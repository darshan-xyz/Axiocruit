const User = require('../models/User');
const Job = require('../models/Job');
const Organization = require('../models/Organization');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Message = require('../models/Message');
const FreelancerService = require('../models/FreelancerService');
const Availability = require('../models/Availability');
const TestSession = require('../models/TestSession');
const InterviewGig = require('../models/InterviewGig');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalCandidates = await User.countDocuments({ role: 'CANDIDATE' });
        const totalRecruiters = await User.countDocuments({ role: { $in: ['RECRUITER', 'ORGANIZATION', 'organization'] } });
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        const totalApplications = await Application.countDocuments();

        const totalInterviewers = await User.countDocuments({ role: 'INTERVIEWER' });
        const pendingInterviewers = await User.countDocuments({ role: 'INTERVIEWER', approvalStatus: 'PENDING' });

        const stats = {
            users: { candidates: totalCandidates, recruiters: totalRecruiters, interviewers: totalInterviewers, total: totalCandidates + totalRecruiters + totalInterviewers },
            jobs: { active: activeJobs },
            applications: { total: totalApplications },
            pendingApprovals: pendingInterviewers
        };

        res.status(200).json({ success: true, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (with optional role filter)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) {
            const normalized = String(role).trim().toUpperCase();
            if (normalized === 'ORGANIZATION') {
                query.role = { $in: ['ORGANIZATION', 'organization'] };
            } else if (normalized === 'FREELANCER' || normalized === 'INTERVIEWER') {
                query.role = { $in: ['INTERVIEWER', 'freelancer'] };
            } else {
                query.role = normalized;
            }
        }

        const users = await User.find(query)
            .select('-password')
            .populate('organization', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user (Cascade delete)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent deleting self (Super Admin)
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        // --- Cascade Logic ---

        // 1. Delete Profile if exists
        if (user.profile) {
            await Profile.findByIdAndDelete(user.profile);
        }

        const roleUpper = (user.role || '').toUpperCase();

        // 2. If organization: Delete Organization, Recruiters, and direct/recruiter jobs
        if (roleUpper === 'ORGANIZATION') {
            const org = await Organization.findOne({ admin: user._id });
            if (org) {
                // Find all recruiters in this org
                const recruiters = await User.find({ organization: org._id });
                for (const rec of recruiters) {
                    const recJobs = await Job.find({ postedBy: rec._id }).select('_id');
                    const recJobIds = recJobs.map(j => j._id);
                    if (recJobIds.length > 0) {
                        await Application.deleteMany({ job: { $in: recJobIds } });
                        await Interview.deleteMany({ jobId: { $in: recJobIds } });
                        await TestSession.deleteMany({ jobId: { $in: recJobIds } });
                        await InterviewGig.deleteMany({ jobId: { $in: recJobIds } });
                    }
                    await Job.deleteMany({ postedBy: rec._id });
                    await Message.deleteMany({ $or: [{ senderId: rec._id }, { receiverId: rec._id }] });
                    await InterviewGig.deleteMany({ $or: [{ recruiterId: rec._id }, { candidateId: rec._id }, { assignedFreelancerId: rec._id }] });
                    if (rec.profile) {
                        await Profile.findByIdAndDelete(rec.profile);
                    }
                    await User.findByIdAndDelete(rec._id);
                }
                // Delete the Organization
                await Organization.findByIdAndDelete(org._id);
            }

            // Direct jobs posted by the organization admin user
            const orgDirectJobs = await Job.find({ postedBy: user._id }).select('_id');
            const orgDirectJobIds = orgDirectJobs.map(j => j._id);
            if (orgDirectJobIds.length > 0) {
                await Application.deleteMany({ job: { $in: orgDirectJobIds } });
                await Interview.deleteMany({ jobId: { $in: orgDirectJobIds } });
                await TestSession.deleteMany({ jobId: { $in: orgDirectJobIds } });
                await InterviewGig.deleteMany({ jobId: { $in: orgDirectJobIds } });
            }
            await Job.deleteMany({ postedBy: user._id });
        }

        // 3. If RECRUITER: Remove from Org list and delete their jobs
        if (roleUpper === 'RECRUITER') {
            const recJobs = await Job.find({ postedBy: user._id }).select('_id');
            const recJobIds = recJobs.map(j => j._id);
            if (recJobIds.length > 0) {
                await Application.deleteMany({ job: { $in: recJobIds } });
                await Interview.deleteMany({ jobId: { $in: recJobIds } });
                await TestSession.deleteMany({ jobId: { $in: recJobIds } });
                await InterviewGig.deleteMany({ jobId: { $in: recJobIds } });
            }
            await Job.deleteMany({ postedBy: user._id });
            if (user.organization) {
                await Organization.findByIdAndUpdate(user.organization, {
                    $pull: { recruiters: user._id }
                });
            }
        }

        // 4. If INTERVIEWER / FREELANCER: delete services, availability, reset delegated jobs
        if (roleUpper === 'INTERVIEWER' || roleUpper === 'FREELANCER') {
            await FreelancerService.deleteMany({ freelancerId: user._id });
            await Availability.deleteMany({ freelancerId: user._id });
            await Job.updateMany(
                { delegatedFreelancerId: user._id },
                { delegatedFreelancerId: null, delegationStatus: 'none' }
            );
        }

        // 5. If CANDIDATE: delete applications, pull from job applicants, and delete test sessions
        if (roleUpper === 'CANDIDATE') {
            await Application.deleteMany({ candidate: user._id });
            await Job.updateMany(
                { applicants: user._id },
                { $pull: { applicants: user._id } }
            );
            await TestSession.deleteMany({ candidateId: user._id });
        }

        // 6. Clean up associated interviews
        await Interview.deleteMany({
            $or: [{ candidateId: user._id }, { recruiterId: user._id }, { interviewerId: user._id }]
        });

        // 7. Clean up associated interview gigs
        await InterviewGig.deleteMany({
            $or: [{ candidateId: user._id }, { recruiterId: user._id }, { assignedFreelancerId: user._id }]
        });

        // 8. Clean up associated test sessions (e.g. if candidate or any leftover)
        await TestSession.deleteMany({ candidateId: user._id });

        // 9. Clean up associated messages
        await Message.deleteMany({
            $or: [{ senderId: user._id }, { receiverId: user._id }]
        });

        // Finally, delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all jobs
// @route   GET /api/admin/jobs
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, jobs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        await Application.deleteMany({ job: req.params.id });
        await Interview.deleteMany({ jobId: req.params.id });
        await TestSession.deleteMany({ jobId: req.params.id });
        await InterviewGig.deleteMany({ jobId: req.params.id });

        res.json({ message: 'Job deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending freelancers
// @route   GET /api/admin/freelancers/pending
exports.getPendingFreelancers = async (req, res) => {
    try {
        const freelancers = await User.find({
            role: { $in: ['INTERVIEWER', 'freelancer'] },
            approvalStatus: 'PENDING'
        }).select('-password').populate('profile');

        res.status(200).json({ success: true, users: freelancers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve/Reject freelancer
// @route   PATCH /api/admin/freelancers/:id/approve
exports.approveFreelancer = async (req, res) => {
    try {
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: status },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
