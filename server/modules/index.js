/**
 * Procruit Enterprise Backend Domain Modules Registry
 * Author: Procruit Core Engineering
 */

const authModule = {
  routes: require('../routes/authRoutes'),
  controller: require('../controllers/authController'),
};

const userModule = {
  routes: require('../routes/userRoutes'),
};

const jobModule = {
  routes: require('../routes/jobRoutes'),
  controller: require('../controllers/jobController'),
};

const applicationModule = {
  routes: require('../routes/applicationRoutes'),
  controller: require('../controllers/applicationController'),
};

const interviewModule = {
  routes: require('../routes/interviewRoutes'),
  controller: require('../controllers/interviewController'),
};

const codingTestModule = {
  routes: require('../routes/codingTestRoutes'),
  controller: require('../controllers/codingTestController'),
};

const organizationModule = {
  routes: require('../routes/organizationRoutes'),
  controller: require('../controllers/organizationController'),
};

const marketplaceModule = {
  freelancerRoutes: require('../routes/freelancerRoutes'),
  recruiterServiceRoutes: require('../routes/recruiterServiceRoutes'),
  freelancerController: require('../controllers/freelancerController'),
  recruiterController: require('../controllers/recruiterController'),
};

const healthModule = {
  routes: require('../routes/healthRoutes'),
};

const paymentModule = {
  routes: require('../routes/stripeRoutes'),
  controller: require('../controllers/stripeController'),
};

const adminModule = {
  routes: require('../routes/adminRoutes'),
  controller: require('../controllers/adminController'),
};

const messageModule = {
  routes: require('../routes/messageRoutes'),
  controller: require('../controllers/messageController'),
};

module.exports = {
  auth: authModule,
  users: userModule,
  jobs: jobModule,
  applications: applicationModule,
  interviews: interviewModule,
  codingTests: codingTestModule,
  organizations: organizationModule,
  marketplace: marketplaceModule,
  health: healthModule,
  payments: paymentModule,
  admin: adminModule,
  messages: messageModule,
};
