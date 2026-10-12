/**
 * User & Profile Management Controller
 * Author: Axiocruit Core Engineering
 */

const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Organization = require('../models/Organization');

// @desc    Get current logged in user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let user = await User.findById(userId).select('-password').populate('profile');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.profile) {
      let profileDoc = await Profile.findOne({ user: user._id });
      if (!profileDoc) {
        profileDoc = new Profile({ user: user._id, resume: user.resumeUrl || '' });
        await profileDoc.save();
      }
      user.profile = profileDoc;
      await User.findByIdAndUpdate(user._id, { $set: { profile: profileDoc._id } });
    } else {
      if (user.resumeUrl && !user.profile.resume) {
        user.profile.resume = user.resumeUrl;
        await Profile.findByIdAndUpdate(user.profile._id, { $set: { resume: user.resumeUrl } });
      } else if (!user.resumeUrl && user.profile.resume) {
        user.resumeUrl = user.profile.resume;
        await User.findByIdAndUpdate(user._id, { $set: { resumeUrl: user.profile.resume } });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('[UserController][getProfile] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update current logged in user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName, lastName, profilePicture,
      headline, bio, skills, experience, projects, education, resume,
      hourlyRate, yearsOfExperience, availability,
      website, description,
    } = req.body;

    // 1. Update User Fields
    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (firstName || lastName) userUpdate.name = `${firstName || ''} ${lastName || ''}`.trim();
    if (profilePicture) userUpdate.profilePicture = profilePicture;

    if (experience !== undefined) userUpdate.experience = experience;
    if (projects !== undefined) userUpdate.projects = projects;
    if (bio !== undefined) userUpdate.bio = bio;
    if (skills !== undefined) userUpdate.skills = skills;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userUpdate },
      { new: true, runValidators: false }
    ).select('-password').populate('profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Update Profile Fields (auto-create/link safely if missing)
    let profileId = user.profile ? (user.profile._id || user.profile) : null;
    let existingProfile = null;

    if (profileId) {
      existingProfile = await Profile.findById(profileId);
    }
    if (!existingProfile) {
      existingProfile = await Profile.findOne({ user: user._id });
    }
    if (!existingProfile) {
      existingProfile = new Profile({ user: user._id, resume: resume || user.resumeUrl || '' });
      await existingProfile.save();
    }
    profileId = existingProfile._id;
    if (!user.profile || user.profile.toString() !== profileId.toString()) {
      await User.findByIdAndUpdate(user._id, { $set: { profile: profileId } }, { runValidators: false });
    }

    const profileUpdate = {};
    if (headline !== undefined) profileUpdate.headline = headline;
    if (bio !== undefined) profileUpdate.bio = bio;
    if (skills !== undefined) profileUpdate.skills = skills;
    if (experience !== undefined) profileUpdate.experience = experience;
    if (education !== undefined) profileUpdate.education = education;
    if (resume !== undefined) {
      profileUpdate.resume = resume;
      await User.findByIdAndUpdate(user._id, { $set: { resumeUrl: resume } });
    }
    if (hourlyRate !== undefined) profileUpdate.hourlyRate = hourlyRate;
    if (yearsOfExperience !== undefined) profileUpdate.yearsOfExperience = yearsOfExperience;
    if (availability !== undefined) profileUpdate.availability = availability;

    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      { $set: profileUpdate },
      { new: true, runValidators: false }
    );

    user.profile = updatedProfile;

    // Synchronize common profile attributes directly onto the User model
    const userDirectUpdate = {};
    if (skills !== undefined) userDirectUpdate.skills = skills;
    if (bio !== undefined) userDirectUpdate.bio = bio;
    if (hourlyRate !== undefined) userDirectUpdate.hourlyRate = hourlyRate;
    if (experience !== undefined && Array.isArray(experience)) userDirectUpdate.experience = experience;
    if (Object.keys(userDirectUpdate).length > 0) {
      await User.findByIdAndUpdate(user._id, { $set: userDirectUpdate });
      Object.assign(user, userDirectUpdate);
    }

    // 3. Update Organization Fields (if user has Organization privileges)
    if ((user.role === 'ADMIN' || user.role === 'ORGANIZATION') && user.organization) {
      const orgUpdate = {};
      const orgDescription = description || req.body.companyDescription;
      if (website) orgUpdate.website = website;
      if (orgDescription) orgUpdate.description = orgDescription;

      if (Object.keys(orgUpdate).length > 0) {
        await Organization.findByIdAndUpdate(user.organization, { $set: orgUpdate });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('[UserController][updateProfile] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePictureUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    res.json({ profilePicture: profilePictureUrl, user });
  } catch (error) {
    console.error('[UserController][uploadProfilePicture] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get list of freelance interviewers with optional filters
// @route   GET /api/users/interviewers
// @access  Private (Recruiter / Admin / Org)
exports.getInterviewers = async (req, res) => {
  try {
    const { skill, maxRate } = req.query;

    const query = {
      role: { $in: ['INTERVIEWER', 'freelancer', 'FREELANCER'] },
      approvalStatus: 'APPROVED',
    };
    let interviewers = await User.find(query).select('-password -email').populate('profile');

    if (skill || maxRate) {
      interviewers = interviewers.filter((user) => {
        let match = true;
        if (!user.profile) return false;

        if (skill) {
          const hasSkill =
            user.profile.skills &&
            user.profile.skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()));
          if (!hasSkill) match = false;
        }

        if (maxRate && match) {
          if (!user.profile.hourlyRate || user.profile.hourlyRate > Number(maxRate)) {
            match = false;
          }
        }

        return match;
      });
    }

    res.json(interviewers);
  } catch (error) {
    console.error('[UserController][getInterviewers] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get list of candidates (for Recruiters)
// @route   GET /api/users/candidates
// @access  Private (Recruiter / Admin)
exports.getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'CANDIDATE' }).select('name email profilePicture');
    res.json(candidates);
  } catch (error) {
    console.error('[UserController][getCandidates] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get public user info by ID
// @route   GET /api/users/by-id/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    const user = await User.findById(req.params.id).select('name role profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[UserController][getUserById] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get profile by email
// @route   GET /api/users/:email
// @access  Private
exports.getUserByEmail = async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[UserController][getUserByEmail] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload resume
// @route   POST /api/users/resume
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.resumeUrl = resumeUrl;

    let profileId = user.profile ? (user.profile._id || user.profile) : null;
    let profile = null;
    if (profileId) {
      profile = await Profile.findById(profileId);
    }
    if (!profile) {
      profile = await Profile.findOne({ user: user._id });
    }
    if (!profile) {
      profile = new Profile({ user: user._id, resume: resumeUrl });
      await profile.save();
      user.profile = profile._id;
    } else {
      profile.resume = resumeUrl;
      await profile.save();
      if (!user.profile) {
        user.profile = profile._id;
      }
    }
    await user.save();

    // Optional: Attempt AI CV parse if AI service is online
    let parsedData = null;
    try {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';
      const fetch = require('node-fetch');
      const FormData = require('form-data');

      if (fs.existsSync(req.file.path)) {
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const form = new FormData();
        form.append('file', fileBuffer, {
          filename: req.file.originalname || 'resume.pdf',
          contentType: 'application/pdf',
        });
        form.append('job_description', '');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const aiRes = await fetch(`${AI_SERVICE_URL}/api/ai/parse-cv`, {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (aiRes.ok) {
          parsedData = await aiRes.json();
          if (parsedData?.skills && parsedData.skills.length > 0 && profile) {
            const mergedSkills = Array.from(new Set([...(profile.skills || []), ...parsedData.skills]));
            profile.skills = mergedSkills;
            await profile.save();
            user.skills = mergedSkills;
            await user.save();
          }
        }
      }
    } catch (aiErr) {
      console.log('[UserController][uploadResume] AI service optional parse note:', aiErr.message);
    }

    // Fallback: If AI service was unavailable, extract skills from PDF content locally
    if (!parsedData && req.file && fs.existsSync(req.file.path)) {
      try {
        const fileBuffer = await fs.promises.readFile(req.file.path);
        const rawContent = fileBuffer.toString('latin1');
        const COMMON_SKILLS = [
          'JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Express',
          'MongoDB', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS',
          'Git', 'HTML', 'CSS', 'Redux', 'GraphQL', 'Next.js', 'Vue', 'Angular',
          'Java', 'C++', 'C#', 'Go', 'Rust', 'Tailwind', 'REST', 'Linux'
        ];
        const extracted = COMMON_SKILLS.filter(skill => {
          const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(rawContent);
        });
        if (extracted.length > 0) {
          parsedData = { skills: extracted };
          if (profile) {
            const mergedSkills = Array.from(new Set([...(profile.skills || []), ...extracted]));
            profile.skills = mergedSkills;
            await profile.save();
            user.skills = mergedSkills;
            await user.save();
          }
        }
      } catch (localExtractErr) {
        console.warn('[UserController][uploadResume] Local fallback parse note:', localExtractErr.message);
      }
    }

    res.json({
      resumeUrl,
      parsedData,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumeUrl: user.resumeUrl,
        skills: user.skills,
        profile,
      }
    });
  } catch (error) {
    console.error('[UserController][uploadResume] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
