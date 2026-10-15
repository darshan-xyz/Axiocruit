const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
    try {
        const { title, location, type, minSalary, skill } = req.query;

        let query = { status: 'Active' };

        // Exclude jobs the candidate has already applied for
        if (req.user && req.user.role === 'CANDIDATE') {
            const appliedJobs = await Application.find({ candidate: req.user._id || req.user.id }).select('job');
            const appliedJobIds = appliedJobs.map(app => app.job);
            if (appliedJobIds.length > 0) {
                query._id = { $nin: appliedJobIds };
            }
        }

        if (title) {
            query.title = { $regex: escapeRegex(title), $options: 'i' };
        }

        if (location) {
            query.location = { $regex: escapeRegex(location), $options: 'i' };
        }

        if (type) {
            query.type = type;
        }

        if (skill) {
            query.skills = { $in: [new RegExp(escapeRegex(skill), 'i')] };
        }

        // Note: Salary filtering is tricky with string. Skipping complex range for now.

        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Job not found' });
        }
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email companyName');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get jobs posted by current user (Recruiter)
// @route   GET /api/jobs/my-jobs
// @access  Private
exports.getMyJobs = async (req, res) => {
    try {
        let posterIds = [req.user.id || req.user._id];
        const roleUpper = (req.user.role || '').toUpperCase();
        if (roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN') {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const teamUsers = await User.find({ organization: orgUser.organization }).select('_id');
                posterIds = teamUsers.map(u => u._id);
            }
        } else if (roleUpper === 'ADMIN') {
            const allJobs = await Job.find({})
                .populate('applicants', 'name email profilePicture headline skills experience resume')
                .sort({ createdAt: -1 })
                .lean();
            if (!allJobs || allJobs.length === 0) return res.json([]);
            const jobIds = allJobs.map(j => j._id);
            const counts = await Application.aggregate([
                { $match: { job: { $in: jobIds } } },
                { $group: { _id: '$job', count: { $sum: 1 } } }
            ]);
            const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
            return res.json(allJobs.map(job => ({ ...job, applicantCount: countMap.get(job._id.toString()) || 0 })));
        }

        const jobs = await Job.find({ postedBy: { $in: posterIds } })
            .populate('applicants', 'name email profilePicture headline skills experience resume')
            .sort({ createdAt: -1 })
            .lean();

        if (!jobs || jobs.length === 0) {
            return res.json([]);
        }

        const jobIds = jobs.map(j => j._id);
        const counts = await Application.aggregate([
            { $match: { job: { $in: jobIds } } },
            { $group: { _id: '$job', count: { $sum: 1 } } }
        ]);

        const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
        const jobsWithCounts = jobs.map(job => ({
            ...job,
            applicantCount: countMap.get(job._id.toString()) || 0
        }));

        res.json(jobsWithCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Recruiter/Admin)
exports.createJob = async (req, res) => {
    try {
        const { title, description, requirements, company, location, type, salary, skills } = req.body;

        const job = new Job({
            title,
            description,
            requirements,
            company: company || (req.user.organization ? 'Organization' : 'Company'), // Fallback
            location,
            type,
            salary,
            skills: Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []),
            postedBy: req.user._id || req.user.id // Ensure this is matching the Recruiter's ID
        });

        await job.save();
        res.status(201).json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidate)
exports.applyJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Check if already applied
        const existingApplication = await Application.findOne({
            job: job._id,
            candidate: req.user.id
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'Already applied to this job' });
        }

        // Get user resume from profile (optional snapshot)
        const User = require('../models/User');
        const Profile = require('../models/Profile');

        const user = await User.findById(req.user.id).populate('profile');
        let profileData = {};

        if (user.profile) {
            // If profile is populated (it might be just an ID if not fully populated by User find, but here we used populate)
            // Ideally we need to fetch Profile document if population fails or is partial, but let's assume valid.
            // Actually, wait, user.profile in User model is ref. 
            // We need to ensuring we have the profile document.
            if (user.profile._id) {
                // It's likely an object now due to populate
                profileData = user.profile;
            } else {
                // Fallback if populate didn't work as expected or if it's just an ID
                profileData = await Profile.findById(user.profile);
            }
        }

        const application = new Application({
            job: job._id,
            candidate: req.user.id,
            resume: user.resumeUrl || (profileData ? profileData.resume : null),
            experience: profileData ? profileData.experience : [],
            education: profileData ? profileData.education : [],
            skills: profileData ? profileData.skills : []
        });

        await application.save();

        // Add to Job applicants
        job.applicants.push(req.user.id);
        await job.save();

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update application status
// @route   PUT /api/jobs/applications/:id/status
// @access  Private (Recruiter)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('job');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (!application.job) {
            return res.status(404).json({ message: 'Associated job not found' });
        }

        // Verify that the user owns the job
        const currentUserId = (req.user._id || req.user.id || '').toString();
        const jobPosterId = (application.job.postedBy?._id || application.job.postedBy || '').toString();
        const isRecruiter = jobPosterId === currentUserId;
        const isDelegatedFreelancer = (application.job.delegatedFreelancerId?._id || application.job.delegatedFreelancerId || '').toString() === currentUserId && application.job.delegationStatus === 'accepted';
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrgAdmin = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let isTenantMatch = false;
        if (isOrgAdmin) {
            let userOrg = req.user.organization;
            if (!userOrg) {
                const currentUserDoc = await User.findById(currentUserId);
                userOrg = currentUserDoc?.organization;
            }
            const userOrgId = (userOrg?._id || userOrg || '').toString();
            const poster = await User.findById(jobPosterId);
            const posterOrgId = (poster?.organization?._id || poster?.organization || '').toString();
            if (userOrgId && posterOrgId && userOrgId === posterOrgId) {
                isTenantMatch = true;
            }
        }

        if (!isRecruiter && !isDelegatedFreelancer && !isTenantMatch && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to update this pipeline' });
        }

        application.status = status;
        await application.save();

        res.json(application);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get applications received for jobs posted by current user OR delegated to current user
// @route   GET /api/jobs/applications/received
// @access  Private (Recruiter / Interviewer / Organization / Admin)
exports.getMyReceivedApplications = async (req, res) => {
    try {
        // 1. Branch query based on role
        const roleUpper = (req.user.role || '').toUpperCase();
        const isFreelancer = roleUpper === 'FREELANCER' || roleUpper === 'INTERVIEWER';
        const isOrg = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let posterIds = [req.user.id];
        if (isOrg) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const teamUsers = await User.find({ organization: orgUser.organization }).select('_id');
                posterIds = teamUsers.map(u => u._id);
            }
        }

        const jobQuery = isFreelancer 
            ? { delegatedFreelancerId: req.user.id, delegationStatus: { $in: ['accepted', 'reviewing'] } }
            : isAdmin
                ? {}
                : isOrg
                    ? { postedBy: { $in: posterIds } }
                    : { postedBy: req.user.id, status: 'Active' };

        const jobs = await Job.find(jobQuery).select('_id');
        const jobIds = jobs.map(job => job._id);

        // 2. Find applications for these jobs
        // 2. Find applications for these jobs
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: 'candidate',
                select: 'name email profilePicture headline resumeUrl', // Select only fields that exist on User
                populate: { path: 'profile' } // Get full profile data (experience, etc.) from here
            })
            .populate('job', 'title')
            .sort({ appliedAt: -1 })
            .lean();

        // Attach external AI test and interview results efficiently via batch $in queries
        const Interview = require('../models/Interview');
        const TestSession = require('../models/TestSession');

        const candidateIds = applications
            .filter(a => a.candidate && a.candidate._id)
            .map(a => a.candidate._id);

        if (jobIds.length > 0 && candidateIds.length > 0) {
            const [interviews, testSessions] = await Promise.all([
                Interview.find({
                    jobId: { $in: jobIds },
                    candidateId: { $in: candidateIds },
                    status: 'Completed',
                }).sort({ createdAt: -1 }).lean(),
                TestSession.find({
                    jobId: { $in: jobIds },
                    candidateId: { $in: candidateIds },
                    status: 'completed',
                }).populate('responses.questionId', 'title category').sort({ completedAt: -1 }).lean(),
            ]);

            const interviewMap = new Map();
            for (const item of interviews) {
                const key = `${item.jobId?.toString()}_${item.candidateId?.toString()}`;
                if (!interviewMap.has(key)) {
                    interviewMap.set(key, item);
                }
            }

            const testSessionMap = new Map();
            for (const item of testSessions) {
                const key = `${item.jobId?.toString()}_${item.candidateId?.toString()}`;
                if (!testSessionMap.has(key)) {
                    testSessionMap.set(key, item);
                }
            }

            for (const app of applications) {
                if (!app.candidate || !app.job) continue;
                const key = `${app.job._id.toString()}_${app.candidate._id.toString()}`;
                const interview = interviewMap.get(key);
                if (interview) {
                    app.aiInterviewReport = interview.aiEvaluation || null;
                    app.aiAnalysis = interview.feedback ? interview.feedback.detailedFeedback : null;
                }

                const testSession = testSessionMap.get(key);
                if (testSession) {
                    app.codingTestResults = {
                        finalScore: testSession.finalScore,
                        difficultyReached: testSession.currentDifficulty,
                        responses: testSession.responses.map(r => ({
                            question: r.questionId?.title || 'Unknown',
                            category: r.questionId?.category || 'Unknown',
                            passed: r.passed,
                            score: r.score,
                        })),
                    };
                }
            }
        }

        res.json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-BASED DELEGATION
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Delegate a job pipeline to a freelancer
// @route   POST /api/jobs/:jobId/delegate
// @access  Private (Recruiter — must own the job)
exports.delegateJobToFreelancer = async (req, res) => {
    try {
        const { freelancerId } = req.body;

        if (!freelancerId) {
            return res.status(400).json({ message: 'freelancerId is required' });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Verify ownership — only the recruiter who posted this job can delegate it
        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized — you do not own this job' });
        }

        // Prevent re-delegation if already pending or accepted
        if (job.delegationStatus === 'pending' || job.delegationStatus === 'accepted') {
            return res.status(400).json({
                message: `Job is already ${job.delegationStatus} for delegation`
            });
        }

        // Verify the freelancer exists and has the right role
        const User = require('../models/User');
        const freelancer = await User.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer not found' });
        }
        if (freelancer.role !== 'freelancer' && freelancer.role !== 'INTERVIEWER') {
            return res.status(400).json({ message: 'Target user is not a freelancer' });
        }

        // Update delegation fields
        job.delegatedFreelancerId = freelancerId;
        job.delegationStatus = 'pending';
        await job.save();

        // Return the updated job with populated freelancer info
        const updatedJob = await Job.findById(job._id)
            .populate('postedBy', 'name email')
            .populate('delegatedFreelancerId', 'name email profilePicture');

        res.json({ message: 'Job delegated successfully', job: updatedJob });
    } catch (err) {
        console.error('delegateJobToFreelancer error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all delegated jobs in 'reviewing' state for the recruiter
// @route   GET /api/jobs/delegations/reviewing
// @access  Private (Recruiter)
exports.getReviewingDelegations = async (req, res) => {
    try {
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrg = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let posterIds = [req.user.id];
        if (isOrg) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const teamUsers = await User.find({ organization: orgUser.organization }).select('_id');
                posterIds = teamUsers.map(u => u._id);
            }
        }

        const query = isAdmin
            ? { delegationStatus: 'reviewing' }
            : { postedBy: { $in: posterIds }, delegationStatus: 'reviewing' };

        const jobs = await Job.find(query)
            .populate('delegatedFreelancerId', 'name email profilePicture')
            .populate({
                path: 'proposedCandidateId',
                select: 'name email profilePicture resumeUrl',
                populate: { path: 'profile' }
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json(jobs);
    } catch (err) {
        console.error('getReviewingDelegations error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve a proposed hire from a delegated freelancer
// @route   PUT /api/jobs/delegations/:jobId/approve
// @access  Private (Recruiter — must own the job)
exports.approveDelegatedHire = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const currentUserId = (req.user._id || req.user.id || '').toString();
        const jobPosterId = (job.postedBy?._id || job.postedBy || '').toString();
        const isOwner = jobPosterId && jobPosterId === currentUserId;
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrgAdmin = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let isOrgAdminOfPoster = false;
        if (isOrgAdmin) {
            const orgUser = await User.findById(currentUserId);
            const orgUserOrgId = (orgUser?.organization?._id || orgUser?.organization || '').toString();
            if (orgUserOrgId) {
                const posterUser = await User.findById(jobPosterId);
                const posterOrgId = (posterUser?.organization?._id || posterUser?.organization || '').toString();
                if (posterOrgId && posterOrgId === orgUserOrgId) {
                    isOrgAdminOfPoster = true;
                }
            }
        }

        if (!isOwner && !isAdmin && !isOrgAdminOfPoster) {
            return res.status(403).json({ message: 'Not authorized — you do not own this job' });
        }

        if (job.delegationStatus !== 'reviewing') {
            return res.status(400).json({ message: `Cannot approve — delegation status is '${job.delegationStatus}'` });
        }

        const previousJobState = {
            delegationStatus: job.delegationStatus,
            status: job.status,
        };

        const applicationModel = require('../models/Application');
        const Message = require('../models/Message');

        let candidateAppPrevStatus = null;
        let createdMessageId = null;

        const executeOperations = async (activeSession) => {
            const sessionOpt = activeSession ? { session: activeSession } : {};

            // 1. Mark job as completed and closed
            job.delegationStatus = 'completed';
            job.status = 'Closed';
            await job.save(sessionOpt);

            // 2. Update Application status to 'Hired' for the proposed candidate
            const proposedCandId = (job.proposedCandidateId?._id || job.proposedCandidateId || '').toString();
            if (proposedCandId) {
                const candidateApp = await applicationModel.findOne({
                    job: job._id,
                    candidate: proposedCandId
                }).session(activeSession || null);

                if (candidateApp) {
                    candidateAppPrevStatus = candidateApp.status;
                    candidateApp.status = 'Hired';
                    await candidateApp.save(sessionOpt);
                }

                // Reject all OTHER applicants for this job (bulk update)
                await applicationModel.updateMany(
                    { job: job._id, candidate: { $ne: job.proposedCandidateId }, status: { $ne: 'Hired' } },
                    { $set: { status: 'Rejected' } },
                    sessionOpt
                );
            }

            // 3. Notify the freelancer
            if (job.delegatedFreelancerId) {
                const [createdMsg] = await Message.create([
                    {
                        senderId: req.user._id || req.user.id,
                        receiverId: job.delegatedFreelancerId,
                        content: `Great news! The recruiter approved your proposed candidate for the "${job.title}" role. The project is now complete.`
                    }
                ], sessionOpt);
                if (createdMsg) {
                    createdMessageId = createdMsg._id;
                }
            }
        };

        const compensateRollback = async () => {
            try {
                await Job.findByIdAndUpdate(job._id, {
                    $set: {
                        delegationStatus: previousJobState.delegationStatus,
                        status: previousJobState.status
                    }
                }).catch(() => {});

                const proposedCandId = (job.proposedCandidateId?._id || job.proposedCandidateId || '').toString();
                if (proposedCandId && candidateAppPrevStatus) {
                    await applicationModel.findOneAndUpdate(
                        { job: job._id, candidate: proposedCandId },
                        { $set: { status: candidateAppPrevStatus } }
                    ).catch(() => {});
                }

                if (createdMessageId) {
                    await Message.findByIdAndDelete(createdMessageId).catch(() => {});
                }
            } catch (compErr) {
                console.error('[approveDelegatedHire] Compensation error:', compErr);
            }
        };

        const topologyType = mongoose.connection.client?.topology?.description?.type;
        const supportsTxn = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

        if (supportsTxn) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();
                await executeOperations(session);
                await session.commitTransaction();
            } catch (txnError) {
                await session.abortTransaction().catch(() => {});
                await compensateRollback();
                throw txnError;
            } finally {
                session.endSession().catch(() => {});
            }
        } else {
            try {
                await executeOperations(null);
            } catch (err) {
                await compensateRollback();
                throw err;
            }
        }

        await logAuditEvent({
            req,
            action: 'DELEGATED_HIRE_APPROVE',
            resource: { type: 'JOB', id: job._id },
            details: {
                jobTitle: job.title,
                proposedCandidateId: job.proposedCandidateId,
                delegatedFreelancerId: job.delegatedFreelancerId
            }
        });

        res.json({ message: 'Hire approved successfully. Job closed.', job });
    } catch (err) {
        console.error('approveDelegatedHire error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all hired candidates from the recruiter's closed jobs
// @route   GET /api/jobs/hirings/new
// @access  Private (Recruiter)
exports.getNewHirings = async (req, res) => {
    try {
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrg = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let posterIds = [req.user.id];
        if (isOrg) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const teamUsers = await User.find({ organization: orgUser.organization }).select('_id');
                posterIds = teamUsers.map(u => u._id);
            }
        }

        const query = isAdmin
            ? { status: 'Closed', proposedCandidateId: { $ne: null } }
            : { postedBy: { $in: posterIds }, status: 'Closed', proposedCandidateId: { $ne: null } };

        const closedJobs = await Job.find(query)
            .populate('proposedCandidateId', 'name email profilePicture headline profile')
            .populate('delegatedFreelancerId', 'name email profilePicture')
            .sort({ updatedAt: -1 })
            .lean();

        // Shape the data into a clean hiring record
        const hirings = closedJobs.map(job => ({
            jobId: job._id,
            jobTitle: job.title,
            company: job.company,
            closedAt: job.updatedAt || job.createdAt,
            candidate: job.proposedCandidateId,
            recommendedBy: job.delegatedFreelancerId,
            freelancerReport: job.freelancerFinalReport || '',
            aiSummary: job.aiEvaluationSummary || {},
        }));

        res.json(hirings);
    } catch (err) {
        console.error('getNewHirings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all closed/past jobs for the recruiter
// @route   GET /api/jobs/past-jobs
// @access  Private (Recruiter)
exports.getPastJobs = async (req, res) => {
    try {
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrg = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let posterIds = [req.user.id];
        if (isOrg) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const teamUsers = await User.find({ organization: orgUser.organization }).select('_id');
                posterIds = teamUsers.map(u => u._id);
            }
        }

        const query = isAdmin
            ? { status: 'Closed' }
            : { postedBy: { $in: posterIds }, status: 'Closed' };

        const jobs = await Job.find(query)
            .populate('proposedCandidateId', 'name email profilePicture')
            .sort({ updatedAt: -1 })
            .lean();

        res.json(jobs);
    } catch (err) {
        console.error('getPastJobs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter/Admin/Org)
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const userId = (req.user._id || req.user.id).toString();
        const isOwner = job.postedBy && job.postedBy.toString() === userId;
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrgAdmin = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let isOrgAdminOfPoster = false;
        if (isOrgAdmin) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const posterUser = await User.findById(job.postedBy);
                if (posterUser && posterUser.organization && posterUser.organization.toString() === orgUser.organization.toString()) {
                    isOrgAdminOfPoster = true;
                }
            }
        }

        if (!isOwner && !isAdmin && !isOrgAdminOfPoster) {
            return res.status(403).json({ message: 'Not authorized to update this job' });
        }

        const { title, description, requirements, company, location, type, salary, skills, status, delegationStatus, delegatedFreelancerId } = req.body;
        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (requirements !== undefined) job.requirements = requirements;
        if (company !== undefined) job.company = company;
        if (location !== undefined) job.location = location;
        if (type !== undefined) job.type = type;
        if (salary !== undefined) job.salary = salary;
        if (skills !== undefined) job.skills = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);
        if (status !== undefined && ['Active', 'Closed', 'Draft'].includes(status)) job.status = status;
        if (delegationStatus !== undefined && ['none', 'pending', 'accepted', 'reviewing', 'completed'].includes(delegationStatus)) job.delegationStatus = delegationStatus;
        if (delegatedFreelancerId !== undefined) job.delegatedFreelancerId = delegatedFreelancerId;

        await job.save();
        res.json(job);
    } catch (err) {
        console.error('updateJob error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
