const User = require('../models/User');
const Organization = require('../models/Organization');
const Profile = require('../models/Profile'); // For future use when profile data is sent
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getJwtSecret } = require('../config/jwt');
const { logAuditEvent } = require('../utils/auditLogger');

// Generate short-lived (15-minute) Access Token
const generateAccessToken = (user) => {
    const id = user._id ? user._id.toString() : user.id;
    return jwt.sign({ id, role: user.role, name: user.name }, getJwtSecret(), {
        expiresIn: '15m',
    });
};

// Legacy generateToken fallback (issues 15m access token for unified security)
const generateToken = (id, role, name) => {
    return jwt.sign({ id, role, name }, getJwtSecret(), {
        expiresIn: '15m',
    });
};

// Helper: Issue Dual Tokens (15m Access Token + 7-Day Rotating Refresh Token & Session)
const issueSessionTokens = async (user, req, res, existingFamilyId = null) => {
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = existingFamilyId || uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userAgent = req?.headers?.['user-agent'] || '';
    const ipAddress = req?.ip || req?.socket?.remoteAddress || req?.connection?.remoteAddress || '';

    const session = new Session({
        userId: user._id,
        refreshTokenHash,
        familyId,
        expiresAt,
        userAgent,
        ipAddress,
        isRevoked: false,
    });
    await session.save();

    // Set HTTP-Only, SameSite=Strict cookie (Secure in production or HTTPS)
    const isProduction = process.env.NODE_ENV === 'production';
    if (res && typeof res.cookie === 'function') {
        res.cookie('refreshToken', rawRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }

    return {
        accessToken,
        refreshToken: rawRefreshToken,
        session,
    };
};

// @desc    Register Organization & Admin
// @route   POST /api/auth/register-org
// @access  Public
exports.registerOrg = async (req, res) => {
    let { name, email, password, website, description } = req.body;
    email = email?.toLowerCase()?.trim();
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Default orgName if not provided (for quick signup)
    const orgName = req.body.orgName || `${trimmedName}'s Organization`;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // 1. Create User (Admin)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: trimmedName,
            email,
            password: hashedPassword,
            role: 'ORGANIZATION' // Organization Admin
        });

        await user.save();

        // 2. Create Organization linked to Admin
        const organization = new Organization({
            name: orgName,
            admin: user._id,
            website,
            description
        });

        await organization.save();

        // 3. Link User to Organization
        user.organization = organization._id;
        await user.save();

        const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

        await logAuditEvent({
            req,
            actor: { id: user._id, email: user.email, role: user.role },
            action: 'ORGANIZATION_REGISTER',
            resource: { type: 'ORGANIZATION', id: organization._id },
            details: { orgName: organization.name }
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: organization,
            token: accessToken,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add Recruiter (By Org Admin)
// @route   POST /api/org/recruiters
// @access  Private (Admin only)
exports.addRecruiter = async (req, res) => {
    let { name, email, password } = req.body;
    email = email?.toLowerCase()?.trim();
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        // Ensure requester is an Admin and has an organization
        // req.user is set by authMiddleware
        const adminUser = await User.findById(req.user.id || req.user._id);
        if (!adminUser || !adminUser.organization) {
            return res.status(400).json({ message: 'Admin does not belong to an organization' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: trimmedName,
            email,
            password: hashedPassword,
            role: 'RECRUITER',
            organization: adminUser.organization
        });

        await user.save();

        // Add recruiter to Organization's list
        await Organization.findByIdAndUpdate(adminUser.organization, {
            $push: { recruiters: user._id }
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'Recruiter added successfully', user: userResponse });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Recruiters for Organization
// @route   GET /api/auth/recruiters
// @access  Private (Admin only)
exports.getRecruiters = async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser.organization) {
            return res.status(400).json({ message: 'Admin does not belong to an organization' });
        }

        const recruiters = await User.find({
            organization: adminUser.organization,
            role: 'RECRUITER'
        }).select('-password');

        res.json(recruiters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register Freelancer
// @route   POST /api/auth/register-freelancer
// @access  Public
exports.registerFreelancer = async (req, res) => {
    let { name, email, password, hourlyRate, yearsOfExperience, availability, headline, bio, skills } = req.body;
    email = email?.toLowerCase()?.trim();
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        user = new User({
            name: trimmedName,
            email,
            password: hashedPassword,
            role: 'INTERVIEWER',
            // approvalStatus defaults to PENDING via schema
        });

        await user.save();

        // Create Profile
        const profile = new Profile({
            user: user._id,
            hourlyRate,
            yearsOfExperience,
            availability,
            headline,
            bio,
            skills
        });
        await profile.save();

        // Link Profile to User
        user.profile = profile._id;
        await user.save();

        const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

        await logAuditEvent({
            req,
            actor: { id: user._id, email: user.email, role: user.role },
            action: 'FREELANCER_REGISTER',
            resource: { type: 'USER', id: user._id },
            details: { skills }
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            approvalStatus: user.approvalStatus,
            token: accessToken,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register Candidate
// @route   POST /api/auth/register-candidate
// @access  Public
exports.registerCandidate = async (req, res) => {
    let { name, email, password } = req.body;
    email = email?.toLowerCase();

    try {
        // Input Sanitization & Validation
        const trimmedName = (name || '').trim();
        const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,60}$/;
        if (!trimmedName || !nameRegex.test(trimmedName)) {
            return res.status(400).json({ message: 'Name can only contain letters and spaces' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: trimmedName,
            email,
            password: hashedPassword,
            role: 'CANDIDATE'
        });

        await user.save();

        // Create Initial Empty Profile
        const profile = new Profile({
            user: user._id
        });
        await profile.save();

        // Link Profile to User
        user.profile = profile._id;
        await user.save();

        const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

        await logAuditEvent({
            req,
            actor: { id: user._id, email: user.email, role: user.role },
            action: 'CANDIDATE_REGISTER',
            resource: { type: 'USER', id: user._id },
            details: { email: user.email }
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: accessToken,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = exports.loginUser = async (req, res) => {
    let { email, password } = req.body;
    email = email?.toLowerCase();

    try {
        const user = await User.findOne({ email }).populate('organization').populate('profile');
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

        // Tamper-evident audit log
        await logAuditEvent({
            req,
            actor: { id: user._id, email: user.email, role: user.role },
            action: 'USER_LOGIN',
            resource: { type: 'USER', id: user._id },
            details: { loginMethod: 'password' }
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            profile: user.profile,
            approvalStatus: user.approvalStatus,
            token: accessToken,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Refresh Access Token & Rotate Refresh Token (with Reuse Detection)
// @route   POST /api/auth/refresh
// @access  Public (Cookie / Bearer / Body)
exports.refresh = exports.refreshToken = async (req, res) => {
    try {
        let rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.['x-refresh-token'];
        if (!rawRefreshToken && req.headers?.authorization?.startsWith('Bearer ')) {
            rawRefreshToken = req.headers.authorization.split(' ')[1];
        }

        if (!rawRefreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        const session = await Session.findOne({ refreshTokenHash: tokenHash });

        if (!session) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        // REUSE DETECTION: If this token was already revoked/rotated, an attacker or replay is attempting reuse!
        // Revoke the ENTIRE session family for zero-trust security.
        if (session.isRevoked) {
            console.warn(`[Security Alert] Refresh token reuse detected for session family ${session.familyId}! Revoking all sessions in family.`);
            await Session.updateMany({ familyId: session.familyId }, { isRevoked: true });
            if (res && typeof res.clearCookie === 'function') {
                res.clearCookie('refreshToken', { path: '/' });
            }
            await logAuditEvent({
                req,
                action: 'REFRESH_TOKEN_REUSE_DETECTED',
                resource: { type: 'SESSION_FAMILY', id: session.familyId },
                details: { compromisedSessionId: session._id, userId: session.userId }
            });
            return res.status(403).json({
                message: 'Security breach detected: Refresh token reuse. All active sessions have been terminated. Please log in again.'
            });
        }

        // Check if token expired
        if (new Date() > session.expiresAt) {
            session.isRevoked = true;
            await session.save();
            if (res && typeof res.clearCookie === 'function') {
                res.clearCookie('refreshToken', { path: '/' });
            }
            return res.status(401).json({ message: 'Refresh token expired. Please log in again.' });
        }

        const user = await User.findById(session.userId).populate('organization').populate('profile');
        if (!user) {
            session.isRevoked = true;
            await session.save();
            if (res && typeof res.clearCookie === 'function') {
                res.clearCookie('refreshToken', { path: '/' });
            }
            return res.status(401).json({ message: 'User account not found' });
        }

        // Rotate: Revoke the consumed session
        session.isRevoked = true;
        await session.save();

        // Issue new access + refresh token in the same session family
        const { accessToken, refreshToken: newRefreshToken } = await issueSessionTokens(user, req, res, session.familyId);

        return res.json({
            token: accessToken,
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                profile: user.profile,
                approvalStatus: user.approvalStatus,
            }
        });
    } catch (err) {
        console.error('[authController.refreshToken] Error:', err);
        return res.status(500).json({ message: 'Server error during token refresh' });
    }
};

// @desc    Logout User & Invalidate Refresh Token / Family
// @route   POST /api/auth/logout
// @access  Public / Private
exports.logout = exports.logoutUser = async (req, res) => {
    try {
        let rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.['x-refresh-token'];
        if (!rawRefreshToken && req.headers?.authorization?.startsWith('Bearer ')) {
            rawRefreshToken = req.headers.authorization.split(' ')[1];
        }

        let sessionFamily = null;
        if (rawRefreshToken) {
            const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
            const session = await Session.findOne({ refreshTokenHash: tokenHash });
            if (session) {
                sessionFamily = session.familyId;
                await Session.updateMany({ familyId: session.familyId }, { isRevoked: true });
            }
        }

        if (req.user?.id) {
            await Session.updateMany({ userId: req.user.id, isRevoked: false }, { isRevoked: true });
        }

        if (res && typeof res.clearCookie === 'function') {
            res.clearCookie('refreshToken', { path: '/' });
        }

        await logAuditEvent({
            req,
            action: 'USER_LOGOUT',
            resource: { type: 'SESSION', id: sessionFamily || 'direct' },
            details: { reason: 'user_initiated' }
        });

        return res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('[authController.logout] Error:', err);
        if (res && typeof res.clearCookie === 'function') {
            res.clearCookie('refreshToken', { path: '/' });
        }
        return res.status(500).json({ message: 'Server error during logout' });
    }
};

// @desc    Get Current Authenticated User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user._id)
            .populate('organization')
            .populate('profile')
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            profile: user.profile,
            approvalStatus: user.approvalStatus,
            profilePicture: user.profilePicture,
            resumeUrl: user.resumeUrl,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error('[authController.getMe] Error:', err);
        return res.status(500).json({ message: 'Server error fetching user profile' });
    }
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid old password' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
