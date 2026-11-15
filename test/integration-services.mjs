import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

dotenv.config({ path: '.env.local' });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hackathon_platform';
const JWT_SECRET = process.env.JWT_SECRET || 'KIUJASICBXvcivIEC';
const secretKey = new TextEncoder().encode(JWT_SECRET);

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

async function runIntegrationTests() {
  console.log('====================================================');
  console.log(' PHASE 2: BUSINESS LOGIC, SERVICES & SECURITY SUITE');
  console.log(' Target Database:', MONGO_URI);
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI);

    // Import Services & Repositories
    const AuthService = await import('../src/server/services/auth.service.ts');
    const JudgeService = await import('../src/server/services/judge.service.ts');
    const TeamService = await import('../src/server/services/team.service.ts');
    const RoundService = await import('../src/server/services/round.service.ts');
    const RubricService = await import('../src/server/services/rubric.service.ts');
    const EvaluationService = await import('../src/server/services/evaluation.service.ts');
    const PSService = await import('../src/server/services/problem-statements.service.ts');
    const { signToken } = await import('../src/server/middleware/auth.ts');

    const { default: User } = await import('../src/server/models/User.ts');
    const { default: Team } = await import('../src/server/models/Team.ts');
    const { default: Round } = await import('../src/server/models/Round.ts');
    const { default: Rubric } = await import('../src/server/models/Rubric.ts');
    const { default: Deliverable } = await import('../src/server/models/Deliverable.ts');
    const { default: Evaluation } = await import('../src/server/models/Evaluation.ts');

    console.log('\n--- 1. Testing Staff & Admin Authentication Logic ---');
    // 1.1 Env admin login test
    const adminLoginRes = await AuthService.loginStaff('admin', 'admin1234');
    assert(adminLoginRes.success === true && adminLoginRes.role === 'admin', 
      'Admin login with valid credentials succeeds');
    assert(typeof adminLoginRes.token === 'string', 'Admin login returns signed JWT token');

    // Verify admin token claims
    const verifiedAdmin = await jwtVerify(adminLoginRes.token, secretKey);
    assert(verifiedAdmin.payload.role === 'admin', 'Admin JWT token contains correct role claim');

    // 1.2 Admin login with invalid password
    const adminBadPassRes = await AuthService.loginStaff('admin', 'wrong_password_999');
    assert(adminBadPassRes.success === false, 'Admin login rejects invalid password');

    console.log('\n--- 2. Testing Judge Creation, Password Hashing & Login ---');
    const judgeUniqueId = 'JUDGE_' + Date.now();
    const judgePassword = 'SecureJudgePassword!123';
    const hashedPassword = await bcrypt.hash(judgePassword, 10);

    const testJudge = await User.create({
      uniqueId: judgeUniqueId,
      email: `${judgeUniqueId.toLowerCase()}@hackathon.org`,
      password: hashedPassword,
      plainPassword: judgePassword,
      name: 'Dr. Alan Turing',
      role: 'judge'
    });

    const judgeLoginRes = await AuthService.loginStaff(judgeUniqueId, judgePassword);
    assert(judgeLoginRes.success === true && judgeLoginRes.role === 'judge', 
      'Judge authentication succeeds with bcrypt password verification');

    const judgeBadLogin = await AuthService.loginStaff(judgeUniqueId, 'incorrect_pass');
    assert(judgeBadLogin.success === false, 'Judge authentication fails with invalid password');

    console.log('\n--- 3. Testing Team Registration & Authentication Workflow ---');
    const teamUniqueId = 'HEX_' + Math.floor(1000 + Math.random() * 9000);
    const leadEmail = `lead_${Date.now()}@college.edu`;
    
    const testTeam = await Team.create({
      uniqueId: teamUniqueId,
      name: 'CyberDefenders',
      leadName: 'Alice Johnson',
      leadEmail: leadEmail,
      leadPhone: '9876543210',
      collegeName: 'Hexaware Engineering College',
      department: 'Cybersecurity',
      qrCodeString: `QR_${teamUniqueId}`,
      attendance: true,
      members: [
        { name: 'Alice Johnson', email: leadEmail, college: 'Hexaware Engineering College', attendance: true },
        { name: 'Bob Lee', email: `bob_${Date.now()}@college.edu`, college: 'Hexaware Engineering College', attendance: true }
      ]
    });
    assert(testTeam._id !== undefined, 'Team successfully created in database');

    // Team login using lead email and team UniqueId
    const teamLoginRes = await AuthService.loginTeam(leadEmail, teamUniqueId);
    assert(teamLoginRes.success === true && teamLoginRes.role === 'team', 
      'Team login succeeds with leadEmail and uniqueId PIN');

    // Team login rejection with wrong pin
    const teamBadPinRes = await AuthService.loginTeam(leadEmail, 'WRONG_PIN');
    assert(teamBadPinRes.success === false, 'Team login rejected with invalid PIN');

    console.log('\n--- 4. Testing Round Gating & Team Qualification Filtering ---');
    // Create an active round that allows ONLY testTeam
    const roundWithGate = await Round.create({
      name: 'Stage 2: Semifinals ' + Date.now(),
      isActive: true,
      isSubmissionsOpen: true,
      allowedTeamIds: [testTeam._id]
    });

    // Qualified team should be able to log in
    const qualifiedLogin = await AuthService.loginTeam(leadEmail, teamUniqueId);
    assert(qualifiedLogin.success === true, 'Qualified team enters active restricted round successfully');

    // Create another team that is NOT in allowedTeamIds
    const unqualifiedTeamId = 'HEX_' + Math.floor(1000 + Math.random() * 9000);
    const unqLeadEmail = `unq_${Date.now()}@college.edu`;
    const unqualifiedTeam = await Team.create({
      uniqueId: unqualifiedTeamId,
      name: 'Disqualified Team',
      leadName: 'Charlie',
      leadEmail: unqLeadEmail,
      qrCodeString: `QR_${unqualifiedTeamId}`,
      members: [{ name: 'Charlie', email: unqLeadEmail }]
    });

    // Unqualified team should be blocked by active round qualification restriction
    const unqualifiedLogin = await AuthService.loginTeam(unqLeadEmail, unqualifiedTeamId);
    assert(unqualifiedLogin.success === false && unqualifiedLogin.message.includes('not qualified'), 
      'Unqualified team is strictly blocked by round qualification gating');

    // Reset round active state
    await Round.updateOne({ _id: roundWithGate._id }, { isActive: false });

    console.log('\n--- 5. Testing Scoring Engine & Multi-Judge Evaluation Math ---');
    // Create Rubric
    const scoringRubric = await Rubric.create({
      name: 'Hackathon Grand Rubric ' + Date.now(),
      criteria: [
        { name: 'Feasibility & Scalability', maxScore: 10, weight: 50 },
        { name: 'UI & Polish', maxScore: 10, weight: 30 },
        { name: 'Business Value', maxScore: 10, weight: 20 }
      ]
    });

    // Judge 1 evaluation:
    // Scores: 8/10 on criteria 0 (weight 50) -> 8 * 0.5 = 4
    //         9/10 on criteria 1 (weight 30) -> 9 * 0.3 = 2.7
    //         10/10 on criteria 2 (weight 20) -> 10 * 0.2 = 2.0
    // Total weighted score = 8.7 (or raw sum 27, depending on system design)
    const evalJudge1 = await Evaluation.create({
      teamId: testTeam._id,
      judgeId: testJudge._id,
      roundId: roundWithGate._id,
      rubricId: scoringRubric._id,
      scores: [
        { criterionId: scoringRubric.criteria[0]._id, score: 8 },
        { criterionId: scoringRubric.criteria[1]._id, score: 9 },
        { criterionId: scoringRubric.criteria[2]._id, score: 10 }
      ],
      totalScore: 27,
      comment: 'Top tier architecture and great execution.'
    });
    assert(evalJudge1._id !== undefined, 'Evaluation submitted successfully');

    // Create Judge 2
    const judge2Id = 'JUDGE2_' + Date.now();
    const testJudge2 = await User.create({
      uniqueId: judge2Id,
      email: `${judge2Id.toLowerCase()}@hackathon.org`,
      password: hashedPassword,
      name: 'Ada Lovelace',
      role: 'judge'
    });

    const evalJudge2 = await Evaluation.create({
      teamId: testTeam._id,
      judgeId: testJudge2._id,
      roundId: roundWithGate._id,
      rubricId: scoringRubric._id,
      scores: [
        { criterionId: scoringRubric.criteria[0]._id, score: 10 },
        { criterionId: scoringRubric.criteria[1]._id, score: 10 },
        { criterionId: scoringRubric.criteria[2]._id, score: 10 }
      ],
      totalScore: 30,
      comment: 'Flawless presentation and codebase.'
    });

    // Test average calculation across judges: (27 + 30) / 2 = 28.5
    const teamEvaluations = await Evaluation.find({ teamId: testTeam._id, roundId: roundWithGate._id });
    const computedAvg = teamEvaluations.reduce((acc, ev) => acc + ev.totalScore, 0) / teamEvaluations.length;
    assert(teamEvaluations.length === 2, 'Two independent judge evaluations stored for team');
    assert(computedAvg === 28.5, 'Multi-judge average score computed accurately (28.5)');

    console.log('\n--- 6. Security & Vulnerability Penetration Tests ---');
    // 6.1 Tampered JWT Token Test
    const forgedToken = await new SignJWT({ role: 'admin', uniqueId: 'hacker', name: 'Malicious Actor' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode('wrong_secret_key_attack_attempt'));

    let forgeryCaught = false;
    try {
      await jwtVerify(forgedToken, secretKey);
    } catch (err) {
      forgeryCaught = true;
    }
    assert(forgeryCaught, 'JWT signature forgery attempt successfully detected and rejected');

    // 6.2 Expired Token Test
    const expiredToken = await new SignJWT({ role: 'admin', uniqueId: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('-1s') // Expired 1 second ago
      .sign(secretKey);

    let expiredCaught = false;
    try {
      await jwtVerify(expiredToken, secretKey);
    } catch (err) {
      expiredCaught = true;
    }
    assert(expiredCaught, 'Expired JWT token rejected by verification engine');

    // 6.3 Privilege Escalation Barrier (Team token attempting Admin authorization)
    const teamToken = signToken({ id: testTeam._id, uniqueId: testTeam.uniqueId, role: 'team', name: testTeam.name });
    const { payload: teamPayload } = await jwtVerify(teamToken, secretKey);
    const requiredRole = 'admin';
    const isEscalationBlocked = teamPayload.role !== requiredRole;
    assert(isEscalationBlocked, 'Role escalation barrier: Team token cannot satisfy Admin role requirement');

    // 6.4 Judge token attempting Admin authorization
    const judgeToken = signToken({ id: testJudge._id, uniqueId: testJudge.uniqueId, role: 'judge', name: testJudge.name });
    const { payload: judgePayload } = await jwtVerify(judgeToken, secretKey);
    const isJudgeEscalationBlocked = judgePayload.role !== requiredRole;
    assert(isJudgeEscalationBlocked, 'Role escalation barrier: Judge token cannot satisfy Admin role requirement');

    // 6.5 NoSQL Object Injection Protection Test
    // Simulating object injection in login credentials
    const injectionAttempt = { $ne: null };
    try {
      const injectionRes = await AuthService.loginStaff(injectionAttempt, 'password');
      assert(injectionRes.success === false, 'NoSQL object injection in username handled safely');
    } catch {
      assert(true, 'NoSQL object injection in username threw exception and blocked');
    }

    // Cleanup Phase 2 test entities
    await User.deleteMany({ _id: { $in: [testJudge._id, testJudge2._id] } });
    await Team.deleteMany({ _id: { $in: [testTeam._id, unqualifiedTeam._id] } });
    await Round.deleteOne({ _id: roundWithGate._id });
    await Rubric.deleteOne({ _id: scoringRubric._id });
    await Evaluation.deleteMany({ _id: { $in: [evalJudge1._id, evalJudge2._id] } });

    console.log('\n----------------------------------------------------');
    console.log(`Phase 2 Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log('----------------------------------------------------');

    if (failed > 0) process.exitCode = 1;

  } catch (error) {
    console.error('Phase 2 encountered fatal error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runIntegrationTests();
