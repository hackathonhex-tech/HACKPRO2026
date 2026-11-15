import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hackathon_platform';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    results.push({ test: testName, status: 'PASS', details });
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    results.push({ test: testName, status: 'FAIL', details });
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

async function runModelTests() {
  console.log('====================================================');
  console.log(' PHASE 1: DATABASE & MODEL INTEGRITY TEST SUITE');
  console.log(' Target Database:', MONGO_URI);
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    assert(mongoose.connection.readyState === 1, 'MongoDB Connection Established');

    // Dynamically import models to ensure schemas are registered
    const { default: User } = await import('../src/server/models/User.ts');
    const { default: Team } = await import('../src/server/models/Team.ts');
    const { default: Round } = await import('../src/server/models/Round.ts');
    const { default: Rubric } = await import('../src/server/models/Rubric.ts');
    const { default: Evaluation } = await import('../src/server/models/Evaluation.ts');
    const { default: Deliverable } = await import('../src/server/models/Deliverable.ts');
    const { default: Settings } = await import('../src/server/models/Settings.ts');
    const { Timer } = await import('../src/server/models/Timer.ts');
    const { default: ProblemStatement } = await import('../src/server/models/ProblemStatement.ts');

    // Clean up any test fixtures from previous runs before building indexes
    await User.deleteMany({ uniqueId: { $regex: /^test_usr_/ } });
    await Team.deleteMany({ uniqueId: { $regex: /^TEAM_/ } });
    await Round.deleteMany({ name: { $regex: /^Round 1: Preliminary Review/ } });
    await Rubric.deleteMany({ name: { $regex: /Scoring Rubric/ } });

    // Build and synchronize indexes
    await Promise.all([
      User.init(),
      Team.init(),
      Round.init(),
      Rubric.init(),
      Evaluation.init(),
      Deliverable.init(),
      Settings.init(),
      Timer.init(),
      ProblemStatement.init()
    ]);
    assert(true, 'Database Indexes Built and Synchronized');

    console.log('\n--- 1. Testing User Model Schemas & Constraints ---');
    // Test: User missing required fields
    try {
      const invalidUser = new User({});
      await invalidUser.validate();
      assert(false, 'User model enforces required fields', 'Validation should have failed');
    } catch (err) {
      assert(err.errors.uniqueId && err.errors.password && err.errors.name && err.errors.role, 
        'User model enforces required fields (uniqueId, password, name, role)');
    }

    // Test: User role enum validation
    try {
      const invalidRoleUser = new User({
        uniqueId: 'test_invalid_role_' + Date.now(),
        password: 'hashedpassword',
        name: 'Invalid Role',
        role: 'superadmin_non_existent'
      });
      await invalidRoleUser.validate();
      assert(false, 'User model validates role enum', 'Should reject non-enum role');
    } catch (err) {
      assert(err.errors.role !== undefined, 'User model enforces role enum constraint');
    }

    // Test: User CRUD and uniqueId uniqueness
    const testUniqueId = 'test_usr_' + Date.now();
    const createdUser = await User.create({
      uniqueId: testUniqueId,
      email: `${testUniqueId}@test.com`,
      password: '$2b$10$hashedexamplepasswordhere',
      plainPassword: 'password123',
      name: 'Test Engineer',
      role: 'judge'
    });
    assert(createdUser._id !== undefined, 'User document persists correctly in local MongoDB');

    // Test: Duplicate uniqueId constraint
    try {
      await User.create({
        uniqueId: testUniqueId,
        email: `another_${testUniqueId}@test.com`,
        password: 'pwd',
        name: 'Duplicate User',
        role: 'judge'
      });
      assert(false, 'User enforces uniqueId uniqueness index', 'Duplicate created without error');
    } catch (err) {
      assert(err.code === 11000, 'User enforces uniqueId uniqueness (E11000 duplicate key caught)');
    }

    console.log('\n--- 2. Testing Team Model Schemas & Constraints ---');
    const testTeamId = 'TEAM_' + Date.now();
    const createdTeam = await Team.create({
      uniqueId: testTeamId,
      name: 'Alpha Innovators',
      leadName: 'Jane Doe',
      leadEmail: `${testTeamId}@university.edu`,
      leadPhone: '+1-555-0199',
      collegeName: 'Hexaware Tech Institute',
      department: 'Computer Science',
      qrCodeString: `QR_${testTeamId}`,
      members: [
        { name: 'Jane Doe', email: `${testTeamId}@university.edu`, college: 'Hexaware Tech' },
        { name: 'John Smith', email: `john_${testTeamId}@university.edu`, college: 'Hexaware Tech' }
      ]
    });
    assert(createdTeam._id !== undefined, 'Team document persists with embedded members array');
    assert(createdTeam.members.length === 2, 'Team embedded members array validation');

    // Duplicate team uniqueId check
    try {
      await Team.create({
        uniqueId: testTeamId,
        name: 'Duplicate Team',
        leadName: 'Lead 2',
        leadEmail: `diff_${testTeamId}@university.edu`,
        qrCodeString: 'QR_DUP'
      });
      assert(false, 'Team enforces uniqueId uniqueness', 'Duplicate created without error');
    } catch (err) {
      assert(err.code === 11000, 'Team enforces uniqueId uniqueness (E11000 duplicate key caught)');
    }

    console.log('\n--- 3. Testing Round & Rubric Models ---');
    const createdRubric = await Rubric.create({
      name: 'Team Scoring Rubric ' + Date.now(),
      criteria: [
        { name: 'Technical Depth', maxScore: 20, weight: 40 },
        { name: 'Innovation & Impact', maxScore: 20, weight: 40 },
        { name: 'Presentation & UI', maxScore: 10, weight: 20 }
      ]
    });
    assert(createdRubric._id !== undefined, 'Rubric document persists with criteria array');

    const createdMemberRubric = await Rubric.create({
      name: 'Member Scoring Rubric ' + Date.now(),
      criteria: [
        { name: 'Individual Contribution & Q&A', maxScore: 10, weight: 100 }
      ]
    });
    assert(createdMemberRubric._id !== undefined, 'Member Rubric document persists with criteria');

    const createdRound = await Round.create({
      name: 'Round 1: Preliminary Review ' + Date.now(),
      isActive: true,
      isSubmissionsOpen: true,
      activeRubricId: createdRubric._id,
      activeMemberRubricId: createdMemberRubric._id,
      allowedTeamIds: [createdTeam._id]
    });
    assert(createdRound._id !== undefined, 'Round document persists with rubric linkage and allowedTeamIds');
    assert(createdRound.allowedTeamIds.length === 1, 'Round allowedTeamIds stores team ObjectId references');

    console.log('\n--- 4. Testing ProblemStatement & Deliverable Models ---');
    const createdPS = await ProblemStatement.create({
      title: 'Decentralized Autonomous Hackathon Platform',
      track: 'Web3 & AI',
      description: 'Design a resilient evaluation and scoring platform.',
      submissionGuidelines: 'Submit GitHub repo and live video link.'
    });
    assert(createdPS._id !== undefined, 'ProblemStatement document persists with track and guidelines');

    const createdDeliverable = await Deliverable.create({
      teamId: createdTeam._id,
      roundId: createdRound._id,
      githubLink: 'https://github.com/hackathon/team-alpha',
      deckUrl: 'https://pitch.com/team-alpha',
      videoLink: 'https://youtube.com/watch?v=alpha_demo',
      abstract: 'An AI-powered evaluation engine.'
    });
    assert(createdDeliverable._id !== undefined, 'Deliverable document persists with links & abstract');

    // Test: Deliverable compound unique index (teamId + roundId)
    try {
      await Deliverable.create({
        teamId: createdTeam._id,
        roundId: createdRound._id,
        githubLink: 'https://github.com/hackathon/duplicate'
      });
      assert(false, 'Deliverable enforces compound index { teamId, roundId }', 'Duplicate submission allowed');
    } catch (err) {
      assert(err.code === 11000, 'Deliverable enforces compound unique index { teamId: 1, roundId: 1 }');
    }

    console.log('\n--- 5. Testing Evaluation Model & Scoring Compound Unique Index ---');
    const createdEval = await Evaluation.create({
      teamId: createdTeam._id,
      judgeId: createdUser._id,
      roundId: createdRound._id,
      rubricId: createdRubric._id,
      scores: [
        { criterionId: createdRubric.criteria[0]._id, score: 18 },
        { criterionId: createdRubric.criteria[1]._id, score: 19 },
        { criterionId: createdRubric.criteria[2]._id, score: 9 }
      ],
      memberScores: [
        { memberId: 'lead', name: 'Jane Doe', totalScore: 9 },
        { memberId: '1', name: 'John Smith', totalScore: 8 }
      ],
      totalScore: 46,
      comment: 'Exceptional architectural clarity and test discipline.',
      publicFeedback: 'Great prototype demo!'
    });
    assert(createdEval._id !== undefined, 'Evaluation document persists with team & member score subdocs');

    // Test: Evaluation compound unique index (teamId + judgeId + roundId)
    try {
      await Evaluation.create({
        teamId: createdTeam._id,
        judgeId: createdUser._id,
        roundId: createdRound._id,
        rubricId: createdRubric._id,
        totalScore: 30
      });
      assert(false, 'Evaluation enforces compound unique index { teamId, judgeId, roundId }', 'Duplicate allowed');
    } catch (err) {
      assert(err.code === 11000, 'Evaluation enforces compound unique index { teamId: 1, judgeId: 1, roundId: 1 }');
    }

    console.log('\n--- 6. Testing Settings & Timer Models ---');
    let settingsDoc = await Settings.findOne();
    if (!settingsDoc) {
      settingsDoc = await Settings.create({
        isPublicLeaderboardVisible: true,
        isTeamLeaderboardVisible: true,
        isRegistrationOpen: true,
        maxTeamSize: 4
      });
    }
    assert(settingsDoc.isPublicLeaderboardVisible !== undefined, 'Settings singleton persistence & defaults');

    let timerDoc = await Timer.findOne();
    if (!timerDoc) {
      timerDoc = await Timer.create({
        status: 'STOPPED',
        durationRemaining: 3600,
        automaticBuzzer: true
      });
    }
    assert(timerDoc.status !== undefined && timerDoc.durationRemaining !== undefined, 
      'Timer persistence & default configuration');

    // Cleanup test fixtures
    await User.deleteOne({ _id: createdUser._id });
    await Team.deleteOne({ _id: createdTeam._id });
    await Round.deleteOne({ _id: createdRound._id });
    await Rubric.deleteOne({ _id: createdRubric._id });
    await Rubric.deleteOne({ _id: createdMemberRubric._id });
    await ProblemStatement.deleteOne({ _id: createdPS._id });
    await Deliverable.deleteOne({ _id: createdDeliverable._id });
    await Evaluation.deleteOne({ _id: createdEval._id });

    console.log('\n----------------------------------------------------');
    console.log(`Phase 1 Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log('----------------------------------------------------');

    if (failed > 0) process.exitCode = 1;

  } catch (error) {
    console.error('Phase 1 encountered fatal error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runModelTests();
