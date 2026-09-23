const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Profile = require('../models/Profile');
const CodingQuestion = require('../models/CodingQuestion');

const defaultQuestions = [
  {
    title: "Warehouse Inventory Match",
    description: "Alice is managing a large warehouse. She has a target total weight of items to ship and a list of individual item weights. She needs to know the exact indices of two items that add up perfectly to her target weight.\n\nDo not use print() or read inputs. Complete the function and return the indices as a list.\n\nExample:\nWeights: [2, 7, 11, 15]\nTarget: 9\nOutput: [0, 1]",
    difficulty: "easy",
    category: "basics",
    starterCode: "def find_items(weights, target):\n    # Write your code here\n    pass",
    functionName: "find_items",
    visibleTestCases: [
      { input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]" },
      { input: "[3, 2, 4], 6", expectedOutput: "[1, 2]" }
    ],
    hiddenTestCases: [
      { input: "[3, 3], 6", expectedOutput: "[0, 1]" },
      { input: "[10, 20, 30, 40, 50], 90", expectedOutput: "[3, 4]" }
    ]
  },
  {
    title: "Spaceship Trajectory",
    description: "A spaceship needs to calculate if its current trajectory reading is a perfect palindrome. Return True if it reads the same forwards and backwards (ignoring spaces and case), or False otherwise.\n\nExample:\nInput: 'racecar'\nOutput: True",
    difficulty: "medium",
    category: "basics",
    starterCode: "def check_trajectory(s):\n    # Write your code here\n    pass",
    functionName: "check_trajectory",
    visibleTestCases: [
      { input: "'racecar'", expectedOutput: "True" },
      { input: "'hello orbit'", expectedOutput: "False" }
    ],
    hiddenTestCases: [
      { input: "'A man a plan a canal Panama'", expectedOutput: "True" },
      { input: "' '", expectedOutput: "True" }
    ]
  }
];

const seedDefaultData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount <= 1) {
      console.log('[Procruit Database] 📦 Checking/seeding demo accounts...');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);

      // 1. Admin
      const existingAdmin = await User.findOne({ email: 'admin@procruit.com' });
      if (!existingAdmin) {
        const admin = new User({
          name: 'System Admin',
          email: 'admin@procruit.com',
          password: hashedPassword,
          role: 'ADMIN',
          approvalStatus: 'APPROVED'
        });
        await admin.save();
      }

      // 2. Organization & Org Admin
      let org = await Organization.findOne({ name: 'Acme Corp' });
      const existingOrgAdmin = await User.findOne({ email: 'org@procruit.com' });
      if (!existingOrgAdmin) {
        const orgAdmin = new User({
          name: 'Acme HR Director',
          email: 'org@procruit.com',
          password: hashedPassword,
          role: 'ORGANIZATION',
          approvalStatus: 'APPROVED'
        });
        await orgAdmin.save();

        if (!org) {
          org = new Organization({
            name: 'Acme Corp',
            admin: orgAdmin._id,
            website: 'https://acme.example.com',
            description: 'Pioneering innovative recruiting solutions.'
          });
          await org.save();
        }

        orgAdmin.organization = org._id;
        await orgAdmin.save();
      }

      // 3. Recruiter
      const existingRecruiter = await User.findOne({ email: 'recruiter@procruit.com' });
      if (!existingRecruiter && org) {
        const recruiter = new User({
          name: 'Jane Recruiter',
          email: 'recruiter@procruit.com',
          password: hashedPassword,
          role: 'RECRUITER',
          organization: org._id,
          approvalStatus: 'APPROVED'
        });
        await recruiter.save();
        await Organization.findByIdAndUpdate(org._id, { $push: { recruiters: recruiter._id } });
      }

      // 4. Interviewer
      const existingInterviewer = await User.findOne({ email: 'interviewer@procruit.com' });
      if (!existingInterviewer) {
        const interviewer = new User({
          name: 'Alex Interviewer',
          email: 'interviewer@procruit.com',
          password: hashedPassword,
          role: 'INTERVIEWER',
          approvalStatus: 'APPROVED',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          hourlyRate: 75,
          bio: 'Senior Full Stack Engineer with 8+ years experience interviewing candidates.'
        });
        await interviewer.save();
        const interviewerProfile = new Profile({
          user: interviewer._id,
          hourlyRate: 75,
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          bio: 'Senior Full Stack Engineer with 8+ years experience interviewing candidates.'
        });
        await interviewerProfile.save();
        interviewer.profile = interviewerProfile._id;
        await interviewer.save();
      }

      // 5. Candidate
      const existingCandidate = await User.findOne({ email: 'candidate@procruit.com' });
      if (!existingCandidate) {
        const candidate = new User({
          name: 'Alex Candidate',
          email: 'candidate@procruit.com',
          password: hashedPassword,
          role: 'CANDIDATE',
          approvalStatus: 'APPROVED'
        });
        await candidate.save();
        const candidateProfile = new Profile({ user: candidate._id });
        await candidateProfile.save();
        candidate.profile = candidateProfile._id;
        await candidateProfile.save();
      }

      console.log('[Procruit Database] ✅ Demo accounts ready: admin@procruit.com, org@procruit.com, recruiter@procruit.com, interviewer@procruit.com, candidate@procruit.com (Password: Password123!)');
    }

    const questionCount = await CodingQuestion.countDocuments();
    if (questionCount === 0) {
      console.log('[Procruit Database] 📦 Seeding default coding questions...');
      await CodingQuestion.insertMany(defaultQuestions);
      console.log('[Procruit Database] ✅ Coding questions seeded successfully.');
    }
  } catch (err) {
    console.warn('[Procruit Database] Notice: auto-seeding skipped or encountered error:', err.message);
  }
};

module.exports = seedDefaultData;
