import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({ path: '.env.local' });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hackathon_platform';

async function seed() {
  console.log('--- Seeding Local MongoDB for Comprehensive Testing ---');
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;

  // Clear existing collections for a clean, deterministic baseline
  const collections = ['users', 'teams', 'rounds', 'rubrics', 'problemstatements', 'deliverables', 'evaluations', 'settings', 'timers'];
  for (const c of collections) {
    try {
      await db.collection(c).deleteMany({});
    } catch {}
  }

  // 1. Seed Settings
  const settings = {
    isLeaderboardVisible: true,
    isPublicLeaderboardVisible: true,
    isTeamLeaderboardVisible: true,
    hideTeamDetailsOnLeaderboard: false,
    isRegistrationOpen: true,
    maxTeamSize: 4,
    leaderboardFilters: {
      round: true,
      judge: true,
      problemStatement: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection('settings').insertOne(settings);
  console.log('✓ Seeded Settings');

  // 2. Seed Timer
  const timer = {
    status: 'STOPPED',
    durationRemaining: 14400, // 4 hours
    endTime: null,
    automaticBuzzer: true,
    autoBuzzerTriggerTime: 300,
    lastManualBuzzer: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection('timers').insertOne(timer);
  console.log('✓ Seeded Global Timer (4h remaining)');

  // 3. Seed Users (Admin & Judges)
  const hashedAdminPass = await bcrypt.hash('admin1234', 10);
  const hashedJudgePass = await bcrypt.hash('judge123', 10);

  const adminUser = {
    uniqueId: 'admin',
    email: 'admin@hackathon.com',
    password: hashedAdminPass,
    plainPassword: 'admin1234',
    name: 'Hexaware Lead Organizer',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const adminRes = await db.collection('users').insertOne(adminUser);

  const judge1 = {
    uniqueId: 'JUDGE01',
    email: 'judge1@hexaware.com',
    password: hashedJudgePass,
    plainPassword: 'judge123',
    name: 'Dr. Sarah Connor',
    role: 'judge',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const judge2 = {
    uniqueId: 'JUDGE02',
    email: 'judge2@hexaware.com',
    password: hashedJudgePass,
    plainPassword: 'judge123',
    name: 'Prof. Charles Xavier',
    role: 'judge',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const j1Res = await db.collection('users').insertOne(judge1);
  const j2Res = await db.collection('users').insertOne(judge2);
  console.log('✓ Seeded Admin and 2 Judges');

  // 4. Seed Rubrics
  const teamRubric = {
    name: 'Round 1 Innovation & Architecture Rubric',
    isTemplate: true,
    criteria: [
      { name: 'Problem Understanding & Scope', maxScore: 10, weight: 25 },
      { name: 'System Architecture & Scalability', maxScore: 10, weight: 35 },
      { name: 'Technical Depth & Implementation', maxScore: 10, weight: 25 },
      { name: 'UI / UX Polish & Presentation', maxScore: 10, weight: 15 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const memberRubric = {
    name: 'Individual Member Contribution Rubric',
    isTemplate: false,
    criteria: [
      { name: 'Technical Ownership & Q&A Response', maxScore: 10, weight: 100 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const trRes = await db.collection('rubrics').insertOne(teamRubric);
  const mrRes = await db.collection('rubrics').insertOne(memberRubric);
  console.log('✓ Seeded Rubrics (Team & Individual Member)');

  // 5. Seed Problem Statements
  const psList = [
    {
      title: 'High-Throughput Autonomous Settlement Protocol',
      track: 'Web3 & Fintech',
      description: 'Build a decentralized micro-settlement pipeline capable of handling 5,000 TPS.',
      submissionGuidelines: 'Submit GitHub repo, smart contract audit, and architecture diagram.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Real-Time Edge Agent Diagnostic System',
      track: 'Generative AI & IoT',
      description: 'Develop low-latency autonomous edge monitoring agents.',
      submissionGuidelines: 'Submit GitHub repo, Dockerfile, and benchmark demo.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Biomedical Clinical Trial Outcome Predictor',
      track: 'Healthcare & Biotech',
      description: 'Design a predictive clinical evidence synthesizer using multimodal medical data.',
      submissionGuidelines: 'Submit GitHub repo, ML pipeline notebook, and demo deck.',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  const psRes = await db.collection('problemstatements').insertMany(psList);
  console.log(`✓ Seeded ${psList.length} Problem Statements`);

  // 6. Seed Teams
  const colleges = ['IIT Bombay', 'BITS Pilani', 'MIT Manipal', 'NIT Trichy', 'Hexaware Tech Academy'];
  const teamDocs = [];
  for (let i = 1; i <= 8; i++) {
    const pad = i.toString().padStart(2, '0');
    const uId = `HEX_TEAM_${pad}`;
    const psIndex = (i - 1) % psList.length;
    teamDocs.push({
      uniqueId: uId,
      name: `Team Synergy ${pad}`,
      leadName: `Lead Developer ${i}`,
      leadEmail: `team${pad}@hackathon.org`,
      leadPhone: `+91 98765432${pad}`,
      leadSupersetId: `SS_LEAD_${pad}`,
      collegeName: colleges[i % colleges.length],
      department: 'Computer Science & AI',
      problemStatementId: psRes.insertedIds[psIndex],
      selectedStack: 'Next.js, TypeScript, MongoDB, PyTorch',
      qrCodeString: `QR_${uId}`,
      attendance: true,
      assignedJudges: [j1Res.insertedId, j2Res.insertedId],
      members: [
        { name: `Lead Developer ${i}`, email: `team${pad}@hackathon.org`, college: colleges[i % colleges.length], attendance: true },
        { name: `Engineer ${i}-B`, email: `eng_${pad}_b@hackathon.org`, college: colleges[i % colleges.length], attendance: true },
        { name: `Engineer ${i}-C`, email: `eng_${pad}_c@hackathon.org`, college: colleges[i % colleges.length], attendance: true }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  const teamsRes = await db.collection('teams').insertMany(teamDocs);
  const teamIds = Object.values(teamsRes.insertedIds);
  console.log(`✓ Seeded ${teamDocs.length} Hackathon Teams`);

  // 7. Seed Rounds (Round 1 Active with all teams qualified)
  const round1 = {
    name: 'Round 1: Architecture & Prototype',
    isActive: true,
    isSubmissionsOpen: true,
    activeRubricId: trRes.insertedId,
    activeMemberRubricId: mrRes.insertedId,
    allowedTeamIds: teamIds,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const round2 = {
    name: 'Round 2: Grand Finale & Live Pitch',
    isActive: false,
    isSubmissionsOpen: false,
    activeRubricId: trRes.insertedId,
    allowedTeamIds: [teamIds[0], teamIds[1], teamIds[2], teamIds[3]], // Top 4
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r1Res = await db.collection('rounds').insertOne(round1);
  const r2Res = await db.collection('rounds').insertOne(round2);
  console.log('✓ Seeded 2 Rounds (Round 1 Active, Round 2 Finale)');

  // 8. Seed Deliverables for Teams
  const deliverables = [];
  for (let i = 0; i < teamIds.length; i++) {
    const pad = (i + 1).toString().padStart(2, '0');
    deliverables.push({
      teamId: teamIds[i],
      roundId: r1Res.insertedId,
      githubLink: `https://github.com/hex-hackathon/team-${pad}`,
      deckUrl: `https://pitch.hexaware.com/team-${pad}`,
      videoLink: `https://youtube.com/watch?v=demo_${pad}`,
      abstract: `Industrial high-availability prototype for problem statement ${((i % 3) + 1)}.`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  await db.collection('deliverables').insertMany(deliverables);
  console.log(`✓ Seeded ${deliverables.length} Submissions / Deliverables`);

  // 9. Seed Evaluations (Judges evaluating teams)
  const evaluations = [];
  for (let i = 0; i < teamIds.length; i++) {
    // Judge 1 evaluation
    const score1 = 7 + (i % 4); // score between 7 and 10
    evaluations.push({
      teamId: teamIds[i],
      judgeId: j1Res.insertedId,
      roundId: r1Res.insertedId,
      rubricId: trRes.insertedId,
      scores: [
        { criterionId: new mongoose.Types.ObjectId(), score: score1 },
        { criterionId: new mongoose.Types.ObjectId(), score: Math.min(10, score1 + 1) },
        { criterionId: new mongoose.Types.ObjectId(), score: score1 },
        { criterionId: new mongoose.Types.ObjectId(), score: Math.min(10, score1 + 2) }
      ],
      memberScores: [
        { memberId: 'lead', name: `Lead Developer ${i+1}`, totalScore: 9 },
        { memberId: '1', name: `Engineer ${i+1}-B`, totalScore: 8 },
        { memberId: '2', name: `Engineer ${i+1}-C`, totalScore: 8 }
      ],
      totalScore: score1 * 4,
      comment: `Judge 1 evaluation for Team Synergy ${i+1}`,
      publicFeedback: 'Solid prototype and comprehensive documentation.',
      isLocked: true,
      isFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Judge 2 evaluation
    const score2 = 6 + ((i * 2) % 5);
    evaluations.push({
      teamId: teamIds[i],
      judgeId: j2Res.insertedId,
      roundId: r1Res.insertedId,
      rubricId: trRes.insertedId,
      scores: [
        { criterionId: new mongoose.Types.ObjectId(), score: score2 },
        { criterionId: new mongoose.Types.ObjectId(), score: score2 },
        { criterionId: new mongoose.Types.ObjectId(), score: Math.min(10, score2 + 1) },
        { criterionId: new mongoose.Types.ObjectId(), score: score2 }
      ],
      memberScores: [
        { memberId: 'lead', name: `Lead Developer ${i+1}`, totalScore: 8 },
        { memberId: '1', name: `Engineer ${i+1}-B`, totalScore: 8 },
        { memberId: '2', name: `Engineer ${i+1}-C`, totalScore: 7 }
      ],
      totalScore: score2 * 4,
      comment: `Judge 2 evaluation for Team Synergy ${i+1}`,
      publicFeedback: 'Impressive live demo, focus on edge-case testing.',
      isLocked: true,
      isFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  await db.collection('evaluations').insertMany(evaluations);
  console.log(`✓ Seeded ${evaluations.length} Judge Evaluations across all teams`);

  console.log('\n--- Seeding Completed Successfully! ---');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
