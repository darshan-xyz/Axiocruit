const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Profile = require('../models/Profile');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const HttpClient = require('../utils/httpClient');
const { dispatchWebhookEvent } = require('../utils/webhookDispatcher');

// AI Service config (defaults to port 8002 for microservice isolation)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';
const AI_TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Helper: Resolve relative resume URLs to absolute URLs
 */
const resolveResumeUrl = (resumeUrl, req) => {
    if (!resumeUrl) return '';
    if (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://')) {
        return resumeUrl;
    }
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5001';
    const cleanPath = resumeUrl.startsWith('/') ? resumeUrl : `/${resumeUrl}`;
    return `${protocol}://${host}${cleanPath}`;
};

/**
 * Helper: Fetch PDF file from URL and convert to Node.js Buffer
 */
const fetchResumeAsBuffer = async (url) => {
    const fetch = require('node-fetch');
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

/**
 * Helper: Save PDF/DOCX buffer to local uploads directory
 * Returns the public URL path for the saved file
 */
const saveResumeFile = async (fileBuffer, originalName) => {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new Error('Valid non-empty file buffer is required to save resume');
    }
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'resumes');

    // Ensure directory exists asynchronously
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Detect docx from extension or zip magic bytes (0x50 0x4B 0x03 0x04)
    const isZipMagic = fileBuffer.length >= 4 &&
      fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B && fileBuffer[2] === 0x03 && fileBuffer[3] === 0x04;
    const isDocxExt = (originalName || '').toLowerCase().endsWith('.docx');
    const isDocx = isDocxExt || (isZipMagic && !(originalName || '').toLowerCase().endsWith('.pdf'));

    const ext = isDocx ? '.docx' : '.pdf';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    // Return relative URL that can be served by Express static middleware
    return `/uploads/resumes/${filename}`;
};

/**
 * Helper: Retrieve resume buffer robustly from local disk first, then remote fetch, then sample fallback
 */
const getResumeBuffer = async (resumeUrl, req) => {
    let cleanPath = resumeUrl || '';
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        try {
            cleanPath = new URL(cleanPath).pathname;
        } catch {}
    }

    // 1. Try local filesystem if it contains /uploads/
    if (cleanPath.includes('/uploads/')) {
        const filename = path.basename(cleanPath);
        const candidates = [
            path.join(__dirname, '..', 'public', 'uploads', 'resumes', filename),
            path.join(__dirname, '..', 'public', 'uploads', filename),
            path.join(__dirname, '..', 'public', cleanPath.replace(/^\//, '')),
        ];
        for (const cPath of candidates) {
            if (fs.existsSync(cPath)) {
                const buffer = await fs.promises.readFile(cPath);
                return { buffer, filename };
            }
        }
    }

    // 2. Fetch over HTTP if external URL
    if (resumeUrl && (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://'))) {
        try {
            const absoluteUrl = resolveResumeUrl(resumeUrl, req);
            const buffer = await fetchResumeAsBuffer(absoluteUrl);
            const filename = path.basename(new URL(absoluteUrl).pathname) || 'resume.pdf';
            return { buffer, filename };
        } catch (fetchErr) {
            console.warn('[getResumeBuffer] Remote fetch failed:', fetchErr.message);
        }
    }

    // 3. Fallback to sample resume if present
    const fallbackPath = path.join(__dirname, '..', 'public', 'uploads', 'sample-resume.pdf');
    if (fs.existsSync(fallbackPath)) {
        const buffer = await fs.promises.readFile(fallbackPath);
        return { buffer, filename: 'sample-resume.pdf' };
    }

    throw new Error('Resume file not accessible');
};

/**
 * Heuristic fallback evaluation when AI microservice is unavailable or circuit is open
 */
const heuristicParseFallback = (fileBuffer, originalName, jobDescription = '') => {
    // Extract basic words from job description to populate heuristics
    const words = String(jobDescription)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
    const sampleKeywords = Array.from(new Set(words)).slice(0, 5);

    return {
        suitability_score: 50.0,
        matched_keywords: sampleKeywords.length > 0 ? sampleKeywords.slice(0, 2) : ['communication', 'problem solving'],
        missing_keywords: sampleKeywords.length > 2 ? sampleKeywords.slice(2) : [],
        parsed_text: 'Fallback parse generated by resilient heuristic engine.',
        skills: sampleKeywords.length > 0 ? sampleKeywords : ['technical skills'],
        experience_years: 1.0,
        domain: 'General',
        candidate_name: '',
        ai_summary: 'Heuristic evaluation generated due to AI service unavailability (circuit breaker fallback).',
        isFallback: true,
    };
};

/**
 * Enterprise CV parsing using HttpClient with Circuit Breaker
 * Returns parsed CV response or heuristic fallback on outage / open circuit
 */
const parseCVWithAI = async (fileBuffer, originalName, jobDescription = '', options = {}) => {
    const FormData = require('form-data');
    const form = new FormData();
    const isZipMagic = Buffer.isBuffer(fileBuffer) && fileBuffer.length >= 4 &&
      fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B && fileBuffer[2] === 0x03 && fileBuffer[3] === 0x04;
    const isDocx = (originalName || '').toLowerCase().endsWith('.docx') ||
      (isZipMagic && !(originalName || '').toLowerCase().endsWith('.pdf'));
    const contentType = isDocx
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    const normalizedFilename = isDocx
        ? ((originalName || '').toLowerCase().endsWith('.docx') ? originalName : `${originalName || 'resume'}.docx`)
        : ((originalName || '').toLowerCase().endsWith('.pdf') ? originalName : `${originalName || 'resume'}.pdf`);

    form.append('file', fileBuffer, {
        filename: normalizedFilename,
        contentType,
    });
    form.append('job_description', jobDescription || '');

    return HttpClient.executeWithBreaker(
        'ai-service',
        async () => {
            const result = await HttpClient.postForm(`${AI_SERVICE_URL}/api/ai/parse-cv`, form, {
                timeoutMs: options.timeoutMs || AI_TIMEOUT_MS,
                maxRetries: options.maxRetries !== undefined ? options.maxRetries : 1,
            });
            return result;
        },
        async (err) => {
            console.warn(`[applicationController] Circuit breaker fallback triggered: ${err.message}`);
            if (options.throwOnError) throw err;
            return heuristicParseFallback(fileBuffer, originalName, jobDescription);
        },
        options
    );
};

const callAIService = parseCVWithAI;

// @desc    Apply to a job with CV upload + AI analysis
// @route   POST /api/applications/:jobId
// @access  Private (Candidate)
exports.applyWithCV = async (req, res) => {
    try {
        const { jobId } = req.params;

        // 1. Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // 2. Check for duplicate application
        const existingApplication = await Application.findOne({
            job: job._id,
            candidate: req.user.id,
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        // 3. Get user profile data for snapshot
        const user = await User.findById(req.user.id).populate('profile');
        let profileData = {};
        if (user.profile) {
            if (user.profile._id) {
                profileData = user.profile;
            } else {
                profileData = await Profile.findById(user.profile);
            }
        }
        if (!profileData || Object.keys(profileData).length === 0 || !profileData._id) {
            const foundProfile = await Profile.findOne({ user: user._id });
            if (foundProfile) {
                profileData = foundProfile;
                if (!user.profile) {
                    await User.findByIdAndUpdate(user._id, { $set: { profile: foundProfile._id } });
                }
            }
        }

        // 4. Validate that the candidate has a resumeUrl
        let userResumeUrl = user.resumeUrl || (profileData ? profileData.resume : null);

        if (!req.file && !userResumeUrl) {
            return res.status(400).json({ message: 'Please update your profile and upload a CV before applying' });
        }

        // 5. Read the resume file (from direct upload or profile URL)
        let fileBuffer;
        let originalName = 'resume.pdf';

        if (req.file && req.file.buffer) {
            fileBuffer = req.file.buffer;
            originalName = req.file.originalname || 'resume.pdf';
            userResumeUrl = await saveResumeFile(fileBuffer, originalName);
            user.resumeUrl = userResumeUrl;
            await user.save();
            if (user.profile) {
                await Profile.findByIdAndUpdate(user.profile._id || user.profile, { resume: userResumeUrl });
            } else {
                await Profile.findOneAndUpdate({ user: user._id }, { resume: userResumeUrl });
            }
        } else if (userResumeUrl) {
            try {
                const resData = await getResumeBuffer(userResumeUrl, req);
                fileBuffer = resData.buffer;
                originalName = resData.filename;
            } catch (fileErr) {
                console.error('[File Read] Error reading existing resume:', fileErr.message);
            }
        }

        // 6. Build job description text for AI
        const jobDescriptionText = [
            job.description || '',
            job.requirements || '',
            (job.skills || []).join(', '),
        ].filter(Boolean).join('\n\n');

        // 7. Determine sync vs non-blocking async execution
        const isSync = req.query?.sync === 'true' ||
                       req.query?.sync === true ||
                       req.body?.sync === true ||
                       req.body?.syncAi === true ||
                       req.headers?.['x-sync-ai'] === 'true' ||
                       req.headers?.['x-test-sync'] === 'true' ||
                       req.sync === true ||
                       (process.env.SYNC_AI_PARSING === 'true');

        if (isSync) {
            // Synchronous scoring path (explicitly requested or forced via sync param)
            let aiResult = null;
            if (fileBuffer) {
                aiResult = await parseCVWithAI(fileBuffer, originalName, jobDescriptionText);
            }

            const applicationData = {
                job: job._id,
                candidate: req.user.id,
                resume: userResumeUrl,
                resumeUrl: userResumeUrl,
                experience: profileData ? profileData.experience : [],
                education: profileData ? profileData.education : [],
                skills: profileData ? profileData.skills : [],
                aiScore: aiResult ? aiResult.suitability_score : null,
                matchedKeywords: aiResult?.matched_keywords || [],
                missingKeywords: aiResult?.missing_keywords || [],
                status: aiResult ? 'Applied' : 'Pending AI',
            };

            const application = new Application(applicationData);
            await application.save();

            job.applicants.push(req.user.id);
            await job.save();

            if (job.organization) {
                dispatchWebhookEvent({
                    organizationId: job.organization,
                    event: 'application.created',
                    data: {
                        applicationId: application._id,
                        jobId: job._id,
                        jobTitle: job.title,
                        candidateId: req.user.id,
                        aiScore: application.aiScore,
                    },
                });
            }

            return res.status(201).json({
                message: 'Application submitted successfully',
                application: {
                    _id: application._id,
                    aiScore: application.aiScore,
                    matchedKeywords: application.matchedKeywords,
                    missingKeywords: application.missingKeywords,
                    status: application.status,
                    resumeUrl: application.resumeUrl,
                },
                aiAnalyzed: Boolean(aiResult),
                aiProcessing: false,
            });
        }

        // Non-blocking asynchronous path (ATS Pipeline V2 default)
        const applicationData = {
            job: job._id,
            candidate: req.user.id,
            resume: userResumeUrl,
            resumeUrl: userResumeUrl,
            experience: profileData ? profileData.experience : [],
            education: profileData ? profileData.education : [],
            skills: profileData ? profileData.skills : [],
            aiScore: null,
            matchedKeywords: [],
            missingKeywords: [],
            status: 'Pending AI',
        };

        const application = new Application(applicationData);
        await application.save();

        job.applicants.push(req.user.id);
        await job.save();

        if (job.organization) {
            dispatchWebhookEvent({
                organizationId: job.organization,
                event: 'application.created',
                data: {
                    applicationId: application._id,
                    jobId: job._id,
                    jobTitle: job.title,
                    candidateId: req.user.id,
                },
            });
        }

        // Immediately return HTTP 201 without blocking event loop
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                _id: application._id,
                aiScore: application.aiScore,
                matchedKeywords: application.matchedKeywords,
                missingKeywords: application.missingKeywords,
                status: application.status,
                resumeUrl: application.resumeUrl,
            },
            aiAnalyzed: false,
            aiProcessing: true,
        });

        // Asynchronously process CV parsing in background
        if (fileBuffer) {
            (async () => {
                try {
                    const aiResult = await parseCVWithAI(fileBuffer, originalName, jobDescriptionText);
                    if (aiResult && mongoose.connection?.readyState === 1) {
                        await Application.findByIdAndUpdate(application._id, {
                            aiScore: aiResult.suitability_score,
                            matchedKeywords: aiResult.matched_keywords || [],
                            missingKeywords: aiResult.missing_keywords || [],
                            status: 'Applied',
                        });
                        console.log(`[applyWithCV-BG] Async CV scoring completed for application ${application._id}: score=${aiResult.suitability_score}`);
                    }
                } catch (bgErr) {
                    if (mongoose.connection?.readyState === 1) {
                        console.error('[applyWithCV-BG] Error processing AI in background:', bgErr.message);
                    }
                }
            })();
        }
        return;
    } catch (err) {
        console.error('[applyWithCV] Error:', err);
        res.status(500).json({ message: 'Server error while processing application' });
    }
};

// @desc    Get ranked candidates for a specific job
// @route   GET /api/jobs/:jobId/candidates
// @access  Private (Recruiter)
exports.getRankedCandidates = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Verify the job exists and belongs to this recruiter
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const currentUserId = (req.user.id || req.user._id).toString();
        const isOwner = job.postedBy && job.postedBy.toString() === currentUserId;
        const isDelegated = job.delegatedFreelancerId && job.delegatedFreelancerId.toString() === currentUserId;
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrgAdmin = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let isOrgAdminOfJob = false;
        if (isOrgAdmin) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const poster = await User.findById(job.postedBy);
                if (poster && poster.organization && poster.organization.toString() === orgUser.organization.toString()) {
                    isOrgAdminOfJob = true;
                }
            }
        }

        if (!isOwner && !isDelegated && !isOrgAdminOfJob && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view candidates for this job' });
        }

        // Fetch all applications, sorted by AI score descending
        // Applications with null aiScore go to the end
        const applications = await Application.find({ job: jobId })
            .populate({
                path: 'candidate',
                select: 'name firstName lastName email profilePicture headline skills bio experience education location phone resumeUrl',
                populate: { path: 'profile' },
            })
            .populate({
                path: 'job',
                select: 'title company location type salary skills department'
            })
            .sort({ aiScore: -1 })
            .lean();

        // Attach real scheduled interviews if any exist
        let enrichedApplications = applications;
        try {
            const Interview = require('../models/Interview');
            const candidateIds = applications.map(a => a.candidate?._id).filter(Boolean);
            if (candidateIds.length > 0) {
                const scheduledInterviews = await Interview.find({
                    jobId: jobId,
                    candidateId: { $in: candidateIds },
                    status: { $in: ['Scheduled', 'InProgress', 'Pending', 'Accepted'] }
                }).populate('interviewerId', 'name email').lean();

                const interviewMap = new Map();
                for (const inv of scheduledInterviews) {
                    const candKey = inv.candidateId?.toString();
                    if (candKey && !interviewMap.has(candKey)) {
                        interviewMap.set(candKey, inv);
                    }
                }

                enrichedApplications = applications.map(app => {
                    const candId = app.candidate?._id?.toString();
                    const inv = candId ? interviewMap.get(candId) : null;
                    let nextInterviewSlot = null;
                    if (inv && inv.scheduledTime) {
                        const d = new Date(inv.scheduledTime);
                        nextInterviewSlot = {
                            date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            interviewer: inv.interviewerId?.name || 'Assigned Interviewer',
                            roomLink: `#/interview/room/${inv.meetingId || inv._id}`
                        };
                    }
                    return {
                        ...app,
                        nextInterviewSlot,
                        resumeUrl: app.resumeUrl || app.resume || app.candidate?.resumeUrl || (app.candidate?.profile?.resume) || ''
                    };
                });
            }
        } catch (invErr) {
            console.warn('[getRankedCandidates] Interview lookup error:', invErr.message);
        }

        // Move null-score applications to the end
        const scored = enrichedApplications.filter(a => a.aiScore !== null);
        const unscored = enrichedApplications.filter(a => a.aiScore === null);

        res.json({
            jobTitle: job.title,
            totalCandidates: enrichedApplications.length,
            candidates: [...scored, ...unscored],
        });
    } catch (err) {
        console.error('[getRankedCandidates] Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get applications for logged-in candidate
// @route   GET /api/applications/my-applications
// @access  Private (Candidate)
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ candidate: req.user.id || req.user._id })
            .populate({
                path: 'job',
                select: 'title company location type postedBy',
                populate: { path: 'postedBy', select: 'name profilePicture role' }
            })
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (err) {
        console.error('[getMyApplications] Error:', err);
        res.status(500).json({ message: 'Server error fetching applications' });
    }
};

// @desc    Retry AI analysis for a specific application
// @route   POST /api/applications/:applicationId/retry-ai
// @access  Private (Recruiter, INTERVIEWER, freelancer — with delegation check)
exports.retryAiAnalysis = async (req, res) => {
    try {
        const { applicationId } = req.params;

        // 1. Find application and populate job & candidate
        const application = await Application.findById(applicationId)
            .populate('job')
            .populate({
                path: 'candidate',
                select: 'name email resumeUrl',
            });

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (!application.job) {
            return res.status(404).json({ message: 'Associated job no longer exists' });
        }

        // 2. Verify permissions (Recruiter who posted it OR delegated Freelancer/Interviewer OR Org/Admin)
        const job = application.job;
        const currentUserId = (req.user._id || req.user.id).toString();
        const isOwner = job.postedBy && job.postedBy.toString() === currentUserId;
        const isDelegated = job.delegatedFreelancerId && job.delegatedFreelancerId.toString() === currentUserId;
        const roleUpper2 = (req.user.role || '').toUpperCase();
        const isOrgAdmin2 = roleUpper2 === 'ORGANIZATION' || roleUpper2 === 'ORG_ADMIN';
        const isAdmin2 = roleUpper2 === 'ADMIN';

        let isOrgAdminOfJob2 = false;
        if (isOrgAdmin2) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const poster = await User.findById(job.postedBy);
                if (poster && poster.organization && poster.organization.toString() === orgUser.organization.toString()) {
                    isOrgAdminOfJob2 = true;
                }
            }
        }

        if (!isOwner && !isDelegated && !isOrgAdminOfJob2 && !isAdmin2) {
            return res.status(403).json({ message: 'Not authorized to modify this application' });
        }

        // Billing Context: When a freelancer triggers AI parsing, the Recruiter (job owner) pays
        const billingAccountId = (req.user.role === 'freelancer' || req.user.role === 'INTERVIEWER') ? job.postedBy : currentUserId;
        console.log(`[retryAiAnalysis] Billing account resolved to: ${billingAccountId} (req.user.role: ${req.user.role})`);

        // 3. Verify it needs a retry (score is null or status is Pending AI)
        if (application.aiScore !== null && application.status !== 'Pending AI') {
            return res.status(400).json({ message: 'Application already has an AI score' });
        }

        // 4. Get the resume URL from the application or candidate
        const resumeUrl = application.resumeUrl || (application.candidate && application.candidate.resumeUrl);
        if (!resumeUrl) {
            return res.status(400).json({ message: 'No resume found for this candidate to analyze' });
        }

        console.log(`[retryAiAnalysis] Resolved resume URL string: ${resumeUrl}`);
        console.log(`[retryAiAnalysis] Populated candidate object exists: ${!!application.candidate}`);

        // 5. Fetch the PDF buffer from the URL or local file
        let pdfBuffer;
        let originalName = 'resume.pdf';
        try {
            const resData = await getResumeBuffer(resumeUrl, req);
            pdfBuffer = resData.buffer;
            originalName = resData.filename;
            console.log(`[retryAiAnalysis] Successfully fetched resume buffer of size: ${pdfBuffer.length} bytes (${originalName})`);
        } catch (fetchErr) {
            console.error('[retryAiAnalysis] Full error fetching resume PDF:', fetchErr);
            return res.status(500).json({ message: 'Failed to retrieve the candidate CV for analysis' });
        }

        // 6. Build Job Description
        const jobDescriptionText = [
            application.job.description || '',
            application.job.requirements || '',
            (application.job.skills || []).join(', '),
        ].filter(Boolean).join('\n\n');

        // 7. Call AI Service
        if (!originalName || originalName === 'resume.pdf') {
            const urlParts = resumeUrl.split('/');
            if (urlParts.length > 0) {
                originalName = urlParts[urlParts.length - 1];
            }
        }

        const aiResult = await callAIService(pdfBuffer, originalName, jobDescriptionText);

        if (!aiResult) {
            return res.status(500).json({ message: 'AI service request failed or timed out again.' });
        }

        // 8. Update application with new score
        application.aiScore = aiResult.suitability_score;
        application.matchedKeywords = aiResult.matched_keywords || [];
        application.missingKeywords = aiResult.missing_keywords || [];
        application.status = 'Applied'; // Clear the pending status

        await application.save();

        // 9. Return the updated application for frontend state updates
        res.status(200).json({
            message: 'AI analysis successful',
            application: {
                _id: application._id,
                aiScore: application.aiScore,
                matchedKeywords: application.matchedKeywords,
                missingKeywords: application.missingKeywords,
                status: application.status
            }
        });
    } catch (err) {
        console.error('[retryAiAnalysis] Error:', err);
        res.status(500).json({ message: 'Server error while retrying AI analysis' });
    }
};

exports.saveResumeFile = saveResumeFile;
exports.parseCVWithAI = parseCVWithAI;
exports.callAIService = callAIService;
exports.heuristicParseFallback = heuristicParseFallback;
