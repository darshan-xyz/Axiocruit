const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Interview = require('../models/Interview');
const User = require('../models/User');

// @desc    Create a Stripe Checkout Session for an Interview Booking
// @route   POST /api/payments/create-checkout-session
// @access  Private (Recruiter)
const createCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in server/.env' });
        }
        const { interviewId } = req.body;

        if (!interviewId) {
            return res.status(400).json({ message: 'Interview ID is required' });
        }

        // 1. Verify Interview Exists and is valid
        const interview = await Interview.findById(interviewId).populate('candidateId', 'name profile');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // 2. Ensure only the Recruiter, their Org Admin, or Admin can pay
        const isOwner = interview.recruiterId.toString() === req.user._id.toString();
        const roleUpper = (req.user.role || '').toUpperCase();
        const isOrgAdmin = roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN';
        const isAdmin = roleUpper === 'ADMIN';

        let isOrgAdminOfPoster = false;
        if (isOrgAdmin) {
            const orgUser = await User.findById(req.user.id);
            if (orgUser && orgUser.organization) {
                const posterUser = await User.findById(interview.recruiterId);
                if (posterUser && posterUser.organization && posterUser.organization.toString() === orgUser.organization.toString()) {
                    isOrgAdminOfPoster = true;
                }
            }
        }

        if (!isOwner && !isAdmin && !isOrgAdminOfPoster) {
            return res.status(403).json({ message: 'Not authorized to pay for this interview' });
        }

        // 3. Ensure it hasn't been paid already
        if (interview.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'This interview has already been paid for' });
        }

        // 4. Get Interviewer's Profile to find their Hourly Rate
        const interviewerId = interview.interviewerId?._id || interview.interviewerId;
        const interviewerUser = await User.findById(interviewerId).populate('profile');
        const hourlyRate = interviewerUser?.hourlyRate || interviewerUser?.profile?.hourlyRate;
        if (!interviewerUser || !hourlyRate) {
            return res.status(400).json({ message: "Interviewer's hourly rate is not set" });
        }

        const amountInCents = Math.round(Number(hourlyRate) * 100);

        // 5. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Interview Session with ${interviewerUser.name}`,
                            description: `Booking for ${new Date(interview.scheduledTime).toLocaleString()}`,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                interviewId: interview._id.toString(), // Important: Used in Webhook to fulfill the order
            },
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/recruiter/schedule?payment=success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/recruiter/schedule?payment=cancelled`,
        });

        res.json({ id: session.id, url: session.url });

    } catch (error) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Stripe Webhook Endpoint
// @route   POST /api/payments/webhook
// @access  Public (Called by Stripe)
const stripeWebhook = async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ message: 'Stripe webhook handler is unconfigured' });
    }

    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        // Stripe requires the raw body to verify the signature
        const rawPayload = req.rawBody || req.body;
        event = stripe.webhooks.constructEvent(rawPayload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Fulfill the purchase...
        const interviewId = session?.metadata?.interviewId;

        if (interviewId) {
            try {
                const interview = await Interview.findByIdAndUpdate(
                    interviewId,
                    { paymentStatus: 'Paid' },
                    { new: true }
                );
                console.log(`Payment successful for interview: ${interviewId}`);
            } catch (err) {
                console.error(`Error updating interview ${interviewId} to Paid:`, err);
            }
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.warn(`[Stripe] Payment failed for intent: ${paymentIntent?.id}, reason: ${paymentIntent?.last_payment_error?.message || 'Unknown'}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send();
};

// @desc    Verify Stripe Checkout Session or interview payment status
// @route   POST /api/payments/verify-session
// @access  Private (Recruiter / Org / Admin / Candidate)
const verifySession = async (req, res) => {
    try {
        const { sessionId, interviewId } = req.body;
        const currentUserId = (req.user?._id || req.user?.id || '').toString();
        const roleUpper = (req.user?.role || '').toUpperCase();
        const isAdmin = roleUpper === 'ADMIN';

        const checkInterviewAuth = async (interview) => {
            if (isAdmin) return true;
            if (!interview) return false;

            // Check if recruiterId matches
            const recruiterIdStr = (interview.recruiterId?._id || interview.recruiterId || '').toString();
            if (recruiterIdStr && recruiterIdStr === currentUserId) return true;

            // Check if candidate matches
            const candidateIdStr = (interview.candidateId?._id || interview.candidateId || '').toString();
            if (candidateIdStr && candidateIdStr === currentUserId) return true;

            // Check if job owner matches
            if (interview.jobId) {
                const Job = require('../models/Job');
                const job = await Job.findById(interview.jobId?._id || interview.jobId);
                const posterIdStr = (job?.postedBy?._id || job?.postedBy || '').toString();
                if (posterIdStr && posterIdStr === currentUserId) return true;
            }

            // Check if org admin of recruiter matches
            if (roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN') {
                const orgUser = await User.findById(currentUserId);
                if (orgUser && orgUser.organization && recruiterIdStr) {
                    const recruiterUser = await User.findById(recruiterIdStr);
                    if (recruiterUser && recruiterUser.organization &&
                        String(recruiterUser.organization) === String(orgUser.organization)) {
                        return true;
                    }
                }
            }

            return false;
        };

        if (sessionId && stripe) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session && (session.payment_status === 'paid' || session.status === 'complete')) {
                const targetInterviewId = session.metadata?.interviewId || interviewId;
                if (targetInterviewId) {
                    const interview = await Interview.findById(targetInterviewId);
                    if (!interview) return res.status(404).json({ message: 'Interview not found' });

                    const isAuthorized = await checkInterviewAuth(interview);
                    if (!isAuthorized) {
                        return res.status(403).json({ message: 'Not authorized to verify payment for this interview' });
                    }

                    interview.paymentStatus = 'Paid';
                    await interview.save();
                    return res.json({ verified: true, paymentStatus: 'Paid', interview });
                }
                return res.json({ verified: true, paymentStatus: 'Paid' });
            }
        }

        if (interviewId) {
            const interview = await Interview.findById(interviewId);
            if (!interview) return res.status(404).json({ message: 'Interview not found' });

            const isAuthorized = await checkInterviewAuth(interview);
            if (!isAuthorized) {
                return res.status(403).json({ message: 'Not authorized to verify payment for this interview' });
            }

            if (interview.paymentStatus === 'Paid') {
                return res.json({ verified: true, paymentStatus: 'Paid', interview });
            }

            // Dev / demo fallback when stripe is not enabled in local environment
            if (!stripe) {
                interview.paymentStatus = 'Paid';
                await interview.save();
                return res.json({ verified: true, paymentStatus: 'Paid', interview });
            }

            return res.json({ verified: false, paymentStatus: interview.paymentStatus, interview });
        }

        return res.status(400).json({ message: 'sessionId or interviewId is required' });
    } catch (error) {
        console.error('Verify session error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

module.exports = {
    createCheckoutSession,
    stripeWebhook,
    verifySession,
};
