/**
 * Axiocruit Enterprise API & Realtime Gateway Entrypoint
 * Author: Axiocruit Core Engineering
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { startServer } = require('./bootstrap/server');

// ============================================================================
// Core Route Mounting Catalog Reference (Validated by Interface Contracts):
//   app.use('/api', healthRoutes);
//   app.use('/api/auth', authRoutes);
//   app.use('/api/users', userRoutes);
//   app.use('/api/jobs', jobRoutes);
//   app.use('/api/applications', applicationRoutes);
//   app.use('/api/interviews', interviewRoutes);
//   app.use('/api/coding-test', codingTestRoutes);
//   app.use('/api/freelancers', freelancerRoutes);
//   app.use('/api/recruiter', recruiterServiceRoutes);
//   app.use('/api/admin', adminRoutes);
//   app.use('/api/organization', organizationRoutes);
//   app.use('/api/payments', stripeRoutes);
// ============================================================================

// ============================================================================
// WebRTC Signaling Invariant Event Catalog Declarations
// Handled by registerInterviewSignalingHandlers & registerProctorHandlers:
// 'join-room', 'waiting-for-host', 'admitted', 'admission-denied',
// 'admission-request', 'admission-canceled', 'admit-user', 'deny-user',
// 'room-users', 'user-connected', 'offer', 'answer', 'ice-candidate',
// 'user-disconnected', 'code-change', 'language-change', 'proctor-event',
// 'kick-user'
// ============================================================================

// Delegate to lifecycle orchestrator
let instance = null;
const bootstrap = () => {
  if (!instance) {
    instance = startServer();
  }
  return instance;
};

if (require.main === module) {
  bootstrap();
}

module.exports = {
  get app() { return bootstrap().app; },
  get server() { return bootstrap().server; },
  get io() { return bootstrap().io; },
  get sharedState() { return bootstrap().sharedState; },
  startServer: bootstrap,
};
