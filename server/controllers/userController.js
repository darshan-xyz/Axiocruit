/**
 * User & Profile Management Controller
 * Author: Procruit Core Engineering
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Organization = require('../models/Organization');

// @desc    Get current logged in user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password').populate('profile');
    if (!user) return res.status(404).json({ message: 'User not found' });
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

    // 2. Update Profile Fields (auto-create if missing)
    let profileId = user.profile ? user.profile._id : null;

    if (!profileId) {
      const newProfile = new Profile({ user: user._id });
      await newProfile.save();
      profileId = newProfile._id;
      await User.findByIdAndUpdate(user._id, { $set: { profile: profileId } }, { runValidators: false });
    }

    const profileUpdate = {};
    if (headline !== undefined) profileUpdate.headline = headline;
    if (bio !== undefined) profileUpdate.bio = bio;
    if (skills !== undefined) profileUpdate.skills = skills;
    if (experience !== undefined) profileUpdate.experience = experience;
    if (education !== undefined) profileUpdate.education = education;
    if (resume !== undefined) profileUpdate.resume = resume;
    if (hourlyRate !== undefined) profileUpdate.hourlyRate = hourlyRate;
    if (yearsOfExperience !== undefined) profileUpdate.yearsOfExperience = yearsOfExperience;
    if (availability !== undefined) profileUpdate.availability = availability;

    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      { $set: profileUpdate },
      { new: true, runValidators: false }
    );

    user.profile = updatedProfile;

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

// @desc    Get public profile by email
// @route   GET /api/users/:email
// @access  Public
exports.getUserByEmail = async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    const user = await User.findOne({ email }).select('-password -email');
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

    const user = await User.findByIdAndUpdate(req.user.id, { resumeUrl }, { new: true });

    if (user && user.profile) {
      await Profile.findByIdAndUpdate(user.profile, { resume: resumeUrl });
    }

    res.json({ resumeUrl });
  } catch (error) {
    console.error('[UserController][uploadResume] Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
