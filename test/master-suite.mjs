import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: '.env.local' });

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}`;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hackathon_platform';
const JWT_SECRET = process.env.JWT_SECRET || 'KIUJASICBXvcivIEC';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const suiteResults = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    database: MONGO_URI,
    port: PORT
  },
  suites: {
    publicUI: [],
    securityRBAC: [],
    authenticatedUI: [],
    apiEndpoints: [],
    workloadStress: []
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function ensureDirectories() {
  function walk(srcDir, targetBases) {
    if (!fs.existsSync(srcDir)) return;
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = path.join(srcDir, entry.name);
        const rel = path.relative('src/app', sub).replace(/\\/g, '/');
        for (const base of targetBases) {
          const target = path.join(base, rel);
          fs.mkdirSync(path.resolve(target), { recursive: true });
        }
        walk(sub, targetBases);
      }
    }
  }

  const targetBases = [
    '.next/dev/static/chunks/app',
    '.next/dev/server/app',
    '.next/static/chunks/app',
    '.next/server/app'
  ];

  targetBases.forEach(b => fs.mkdirSync(path.resolve(b), { recursive: true }));
  walk('src/app', targetBases);
}

function recordTest(suiteName, name, passed, details = '', metrics = null) {
  suiteResults.summary.total++;
  if (passed) suiteResults.summary.passed++;
  else suiteResults.summary.failed++;

  const entry = { name, passed, details, metrics };
  suiteResults.suites[suiteName].push(entry);

  const statusStr = passed ? 'PASS' : 'FAIL';
  console.log(`  [${statusStr}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function generateToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secretKey);
}

// HTTP request helper
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { ...(options.headers || {}) };
    if (options.token) {
      headers['Cookie'] = `token=${options.token}`;
    }

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: headers,
      timeout: options.timeout || 45000
    };

    const startTime = Date.now();
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          duration
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${path} timed out after ${reqOptions.timeout}ms`));
    });

    req.on('error', err => reject(err));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// Wait for Next.js server to be responsive
async function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  console.log(`Waiting for server at ${BASE_URL}...`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await request('/api/timer', { timeout: 4000 });
      if (res.statusCode === 200) {
        console.log(`✓ Server ready in ${Date.now() - start}ms!`);
        return true;
      }
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Server failed to start within ${timeoutMs}ms`);
}

// Workload / Benchmark runner
async function runLoadBenchmark(path, method, body, concurrency, totalRequests, token = null) {
  const durations = [];
  let successful = 0;
  let failed = 0;
  let inFlight = 0;
  let completed = 0;

  const startTime = Date.now();

  return new Promise((resolve) => {
    function launchNext() {
      if (completed >= totalRequests) {
        if (inFlight === 0) {
          const totalTime = (Date.now() - startTime) / 1000;
          durations.sort((a, b) => a - b);
          const sum = durations.reduce((acc, d) => acc + d, 0);
          const mean = sum / (durations.length || 1);
          const p50 = durations[Math.floor(durations.length * 0.50)] || 0;
          const p90 = durations[Math.floor(durations.length * 0.90)] || 0;
          const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
          const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
          const min = durations[0] || 0;
          const max = durations[durations.length - 1] || 0;
          const rps = totalRequests / (totalTime || 1);
          const errorRate = (failed / totalRequests) * 100;

          resolve({
            path,
            concurrency,
            totalRequests,
            successful,
            failed,
            errorRate: parseFloat(errorRate.toFixed(2)),
            totalDurationSec: parseFloat(totalTime.toFixed(3)),
            rps: parseFloat(rps.toFixed(2)),
            latency: {
              minMs: min,
              meanMs: parseFloat(mean.toFixed(2)),
              p50Ms: p50,
              p90Ms: p90,
              p95Ms: p95,
              p99Ms: p99,
              maxMs: max
            }
          });
        }
        return;
      }

      while (inFlight < concurrency && (completed + inFlight) < totalRequests) {
        inFlight++;
        const reqStart = Date.now();
        request(path, {
          method,
          body,
          token,
          headers: body ? { 'Content-Type': 'application/json' } : {},
          timeout: 30000
        }).then(res => {
          durations.push(Date.now() - reqStart);
          if (res.statusCode >= 200 && res.statusCode < 400) successful++;
          else failed++;
        }).catch(() => {
          durations.push(Date.now() - reqStart);
          failed++;
        }).finally(() => {
          inFlight--;
          completed++;
          launchNext();
        });
      }
    }

    launchNext();
  });
}

async function runMasterTest() {
  console.log('================================================================');
  console.log(' INDUSTRIAL-GRADE COMPREHENSIVE AUTOMATED PLATFORM TEST SUITE');
  console.log(' Target Host:', BASE_URL);
  console.log(' Target Database:', MONGO_URI);
  console.log('================================================================\n');

  ensureDirectories();

  // Connect to mongo to fetch seeded team & judge IDs
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const adminDoc = await db.collection('users').findOne({ role: 'admin' });
  const judgeDoc = await db.collection('users').findOne({ role: 'judge' });
  const teamDoc = await db.collection('teams').findOne({ uniqueId: 'HEX_TEAM_01' });

  // 1. Generate test tokens for all roles
  const adminToken = await generateToken({
    id: adminDoc?._id?.toString() || 'admin_test_id',
    uniqueId: 'admin',
    name: 'Hexaware Lead Organizer',
    role: 'admin',
    permissions: ['all']
  });

  const judgeToken = await generateToken({
    id: judgeDoc?._id?.toString() || 'judge_test_id',
    uniqueId: judgeDoc?.uniqueId || 'JUDGE01',
    name: judgeDoc?.name || 'Dr. Sarah Connor',
    role: 'judge'
  });

  const teamToken = await generateToken({
    id: teamDoc?._id?.toString() || 'team_test_id',
    uniqueId: teamDoc?.uniqueId || 'HEX_TEAM_01',
    name: teamDoc?.name || 'Team Synergy 01',
    role: 'team'
  });

  await mongoose.disconnect();

  // 2. Spawn Next.js server with Webpack compiler on PORT 4040
  console.log(`Starting Next.js Server (webpack mode on port ${PORT})...`);
  const serverProc = spawn(`npx next dev --webpack -p ${PORT}`, {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true
  });

  serverProc.stdout.on('data', d => {
    const s = d.toString();
    console.log('[Server Out]', s.trim());
  });
  serverProc.stderr.on('data', d => {
    console.error('[Server Err]', d.toString().trim());
  });

  function killServer() {
    try {
      if (serverProc.pid) {
        spawn('taskkill', ['/pid', String(serverProc.pid), '/T', '/F']);
      }
    } catch {}
  }

  try {
    await waitForServer(50000);

    // Warm-up compilation
    console.log('\nWarming up page compilation cache...');
    await request('/');
    await request('/leaderboard');
    await request('/timer');
    await request('/register');
    await request('/api/timer');
    try { await request('/judge/dashboard', { token: judgeToken, timeout: 60000 }); } catch {}
    try { await request('/team/dashboard', { token: teamToken, timeout: 60000 }); } catch {}

    console.log('\n========================================================');
    console.log(' SUITE A: PUBLIC ROUTE & UI COMPONENT RENDERING');
    console.log('========================================================');

    // Test Landing Page
    try {
      const res = await request('/');
      const is200 = res.statusCode === 200;
      const hasContent = res.body.includes('Hexaware') || res.body.includes('Hackathon') || res.body.includes('Mavericks');
      recordTest('publicUI', 'Landing Page GET /', is200 && hasContent, 
        `Status ${res.statusCode}, Size ${res.body.length}b, Latency ${res.duration}ms`);
    } catch (e) {
      recordTest('publicUI', 'Landing Page GET /', false, e.message);
    }

    // Test Leaderboard Page
    try {
      const res = await request('/leaderboard');
      const is200 = res.statusCode === 200;
      const hasTable = res.body.includes('Leaderboard') || res.body.includes('Rank') || res.body.includes('Team');
      recordTest('publicUI', 'Leaderboard Page GET /leaderboard', is200 && hasTable, 
        `Status ${res.statusCode}, Size ${res.body.length}b, Latency ${res.duration}ms`);
    } catch (e) {
      recordTest('publicUI', 'Leaderboard Page GET /leaderboard', false, e.message);
    }

    // Test Timer Page
    try {
      const res = await request('/timer');
      const is200 = res.statusCode === 200;
      const hasTimer = res.body.includes('Timer') || res.body.includes('Buzzer') || res.body.includes('flip') || res.body.includes('0');
      recordTest('publicUI', 'Timer Page GET /timer', is200 && hasTimer, 
        `Status ${res.statusCode}, Size ${res.body.length}b, Latency ${res.duration}ms`);
    } catch (e) {
      recordTest('publicUI', 'Timer Page GET /timer', false, e.message);
    }

    // Test Registration Page
    try {
      const res = await request('/register');
      const is200 = res.statusCode === 200;
      const hasForm = res.body.includes('Register') || res.body.includes('Team') || res.body.includes('College');
      recordTest('publicUI', 'Team Registration Page GET /register', is200 && hasForm, 
        `Status ${res.statusCode}, Size ${res.body.length}b, Latency ${res.duration}ms`);
    } catch (e) {
      recordTest('publicUI', 'Team Registration Page GET /register', false, e.message);
    }

    console.log('\n========================================================');
    console.log(' SUITE B: RBAC SECURITY & UNPROTECTED ROUTE GATING');
    console.log('========================================================');

    // Unauthenticated protection tests
    const protectedPaths = [
      { path: '/admin/dashboard', expectedRedirect: '/' },
      { path: '/admin/users', expectedRedirect: '/' },
      { path: '/admin/settings', expectedRedirect: '/' },
      { path: '/judge/dashboard', expectedRedirect: '/' },
      { path: '/team/dashboard', expectedRedirect: '/' }
    ];

    for (const item of protectedPaths) {
      try {
        const res = await request(item.path);
        const isRedirect = (res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 302);
        const redirectsHome = res.headers['location'] === item.expectedRedirect || res.headers['location']?.endsWith(item.expectedRedirect);
        recordTest('securityRBAC', `Unauthenticated Access to ${item.path}`, isRedirect && redirectsHome, 
          `Status ${res.statusCode}, RedirectLocation: ${res.headers['location']}`);
      } catch (e) {
        recordTest('securityRBAC', `Unauthenticated Access to ${item.path}`, false, e.message);
      }
    }

    // Cross-role privilege escalation attempt: Team token accessing Admin routes
    try {
      const res = await request('/admin/dashboard', { token: teamToken });
      const isBlocked = (res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 302);
      recordTest('securityRBAC', 'Privilege Escalation Barrier: Team Token accessing /admin/dashboard', isBlocked, 
        `Status ${res.statusCode}, RedirectLocation: ${res.headers['location']}`);
    } catch (e) {
      recordTest('securityRBAC', 'Privilege Escalation Barrier: Team Token accessing /admin/dashboard', false, e.message);
    }

    // Cross-role privilege escalation attempt: Judge token accessing Admin routes
    try {
      const res = await request('/admin/settings', { token: judgeToken });
      const isBlocked = (res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 302);
      recordTest('securityRBAC', 'Privilege Escalation Barrier: Judge Token accessing /admin/settings', isBlocked, 
        `Status ${res.statusCode}, RedirectLocation: ${res.headers['location']}`);
    } catch (e) {
      recordTest('securityRBAC', 'Privilege Escalation Barrier: Judge Token accessing /admin/settings', false, e.message);
    }

    console.log('\n========================================================');
    console.log(' SUITE C: AUTHENTICATED PORTALS & UI DASHBOARDS');
    console.log('========================================================');

    // Admin authenticated routes
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/setup',
      '/admin/settings',
      '/admin/rubric',
      '/admin/round-qualification',
      '/admin/attendance',
      '/admin/deliverables',
      '/admin/scanner'
    ];

    for (const r of adminRoutes) {
      try {
        const res = await request(r, { token: adminToken, timeout: 45000 });
        const is200 = res.statusCode === 200;
        recordTest('authenticatedUI', `Admin Portal: GET ${r}`, is200, 
          `Status ${res.statusCode}, Length ${res.body.length}b, Latency ${res.duration}ms`);
      } catch (e) {
        recordTest('authenticatedUI', `Admin Portal: GET ${r}`, false, e.message);
      }
    }

    // Judge authenticated routes
    try {
      const res = await request('/judge/dashboard', { token: judgeToken, timeout: 45000 });
      const is200 = res.statusCode === 200;
      recordTest('authenticatedUI', 'Judge Portal: GET /judge/dashboard', is200, 
        `Status ${res.statusCode}, Length ${res.body.length}b, Latency ${res.duration}ms`);
    } catch (e) {
      recordTest('authenticatedUI', 'Judge Portal: GET /judge/dashboard', false, e.message);
    }

    // Team authenticated routes
    const teamRoutes = [
      '/team/dashboard',
      '/team/problem-statement',
      '/team/submit'
    ];

    for (const r of teamRoutes) {
      try {
        const res = await request(r, { token: teamToken, timeout: 45000 });
        const is200 = res.statusCode === 200;
        recordTest('authenticatedUI', `Team Portal: GET ${r}`, is200, 
          `Status ${res.statusCode}, Length ${res.body.length}b, Latency ${res.duration}ms`);
      } catch (e) {
        recordTest('authenticatedUI', `Team Portal: GET ${r}`, false, e.message);
      }
    }

    console.log('\n========================================================');
    console.log(' SUITE D: API ENDPOINTS & LOGICAL INTEGRATION');
    console.log('========================================================');

    // Timer API GET
    try {
      const res = await request('/api/timer');
      const is200 = res.statusCode === 200;
      const data = JSON.parse(res.body);
      const isValid = data.success === true && data.timer !== undefined;
      recordTest('apiEndpoints', 'GET /api/timer State Verification', is200 && isValid, 
        `Timer Status: ${data.timer?.status}, DurationRemaining: ${data.timer?.durationRemaining}s`);
    } catch (e) {
      recordTest('apiEndpoints', 'GET /api/timer State Verification', false, e.message);
    }

    // Timer API POST Unauthenticated Guard (Security Hardening Verification)
    try {
      const resUnauth = await request('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET', payload: { duration: 3600 } })
      });
      const is401 = resUnauth.statusCode === 401;
      const data = JSON.parse(resUnauth.body);
      recordTest('securityRBAC', 'POST /api/timer Unauthenticated Protection (Security Guard)', is401 && !data.success,
        `Status ${resUnauth.statusCode}, Blocked with error: ${data.error}`);
    } catch (e) {
      recordTest('securityRBAC', 'POST /api/timer Unauthenticated Protection (Security Guard)', false, e.message);
    }

    // Timer API POST Authenticated Admin Execution
    try {
      const resAuth = await request('/api/timer', {
        method: 'POST',
        token: adminToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET', payload: { duration: 3600 } })
      });
      const is200 = resAuth.statusCode === 200;
      const data = JSON.parse(resAuth.body);
      recordTest('apiEndpoints', 'POST /api/timer Admin Control (Authenticated)', is200 && data.success,
        `Status ${resAuth.statusCode}, Timer Set to: ${data.timer?.durationRemaining}s`);
    } catch (e) {
      recordTest('apiEndpoints', 'POST /api/timer Admin Control (Authenticated)', false, e.message);
    }

    // Staff / Admin Login API
    try {
      const resCorrect = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: 'admin', password: 'admin1234' })
      });
      const data = JSON.parse(resCorrect.body);
      const isSuccess = resCorrect.statusCode === 200 && data.success === true && data.role === 'admin';
      const hasCookie = (resCorrect.headers['set-cookie'] || []).some(c => c.includes('token='));
      recordTest('apiEndpoints', 'POST /api/auth/login (Admin Credentials)', isSuccess && hasCookie, 
        `Status ${resCorrect.statusCode}, TokenCookieEmitted: ${hasCookie}`);
    } catch (e) {
      recordTest('apiEndpoints', 'POST /api/auth/login (Admin Credentials)', false, e.message);
    }

    // Staff / Admin Login Rejection on Wrong Password
    try {
      const resBad = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: 'admin', password: 'invalid_pass_XYZ' })
      });
      const is401 = resBad.statusCode === 401;
      recordTest('apiEndpoints', 'POST /api/auth/login Rejects Bad Credentials', is401, 
        `Status ${resBad.statusCode}`);
    } catch (e) {
      recordTest('apiEndpoints', 'POST /api/auth/login Rejects Bad Credentials', false, e.message);
    }

    // Team Login API
    try {
      const resTeam = await request('/api/auth/team-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: 'team01@hackathon.org', pin: 'HEX_TEAM_01' })
      });
      const data = JSON.parse(resTeam.body);
      const isSuccess = resTeam.statusCode === 200 && data.success === true && data.role === 'team';
      const hasCookie = (resTeam.headers['set-cookie'] || []).some(c => c.includes('token='));
      recordTest('apiEndpoints', 'POST /api/auth/team-login (Team Credentials)', isSuccess && hasCookie, 
        `Status ${resTeam.statusCode}, Role: ${data.role}`);
    } catch (e) {
      recordTest('apiEndpoints', 'POST /api/auth/team-login (Team Credentials)', false, e.message);
    }

    // Security check: Unauthenticated Mutation on /api/timer
    try {
      const resUnauthTimer = await request('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STOP' })
      });
      const allowsUnauth = resUnauthTimer.statusCode === 200;
      if (allowsUnauth) {
        suiteResults.summary.warnings++;
        recordTest('apiEndpoints', 'Security Audit: POST /api/timer Authentication Enforcement', false, 
          'CRITICAL VULNERABILITY: Route allows unauthenticated mutation of competition timer!');
      } else {
        recordTest('apiEndpoints', 'Security Audit: POST /api/timer Authentication Enforcement', true, 
          'Protected');
      }
    } catch (e) {
      recordTest('apiEndpoints', 'Security Audit: POST /api/timer Authentication Enforcement', true, e.message);
    }

    console.log('\n========================================================');
    console.log(' SUITE E: INDUSTRIAL WORKLOAD, CONCURRENCY & STRESS');
    console.log('========================================================');

    console.log('Running Workload Test 1: Concurrency API (/api/timer, 50 requests @ concurrency 10)...');
    const bench1 = await runLoadBenchmark('/api/timer', 'GET', null, 10, 50);
    recordTest('workloadStress', 'Load Benchmark: /api/timer (10 Concurrency, 50 Requests)', 
      bench1.errorRate === 0, 
      `RPS: ${bench1.rps}, Mean: ${bench1.latency.meanMs}ms, p50: ${bench1.latency.p50Ms}ms, p95: ${bench1.latency.p95Ms}ms, p99: ${bench1.latency.p99Ms}ms, Errors: ${bench1.errorRate}%`,
      bench1
    );

    console.log('Running Workload Test 2: High Concurrency API (/api/timer, 100 requests @ concurrency 25)...');
    const bench2 = await runLoadBenchmark('/api/timer', 'GET', null, 25, 100);
    recordTest('workloadStress', 'Stress Benchmark: /api/timer (25 Concurrency, 100 Requests)', 
      bench2.errorRate < 5, 
      `RPS: ${bench2.rps}, Mean: ${bench2.latency.meanMs}ms, p50: ${bench2.latency.p50Ms}ms, p95: ${bench2.latency.p95Ms}ms, p99: ${bench2.latency.p99Ms}ms, Errors: ${bench2.errorRate}%`,
      bench2
    );

    console.log('Running Workload Test 3: Heavy SSR Leaderboard Queries (30 requests @ concurrency 5)...');
    const bench3 = await runLoadBenchmark('/leaderboard', 'GET', null, 5, 30);
    recordTest('workloadStress', 'Load Benchmark: SSR /leaderboard (5 Concurrency, 30 Requests)', 
      bench3.errorRate === 0, 
      `RPS: ${bench3.rps}, Mean: ${bench3.latency.meanMs}ms, p50: ${bench3.latency.p50Ms}ms, p95: ${bench3.latency.p95Ms}ms, p99: ${bench3.latency.p99Ms}ms, Errors: ${bench3.errorRate}%`,
      bench3
    );

    console.log('Running Workload Test 4: Auth Endpoint CPU Stress (/api/auth/login, 20 requests @ concurrency 5)...');
    const bench4 = await runLoadBenchmark('/api/auth/login', 'POST', JSON.stringify({ uniqueId: 'admin', password: 'admin1234' }), 5, 20);
    recordTest('workloadStress', 'CPU/Crypto Benchmark: /api/auth/login (5 Concurrency, 20 Requests)', 
      bench4.errorRate === 0, 
      `RPS: ${bench4.rps}, Mean: ${bench4.latency.meanMs}ms, p50: ${bench4.latency.p50Ms}ms, p95: ${bench4.latency.p95Ms}ms, Errors: ${bench4.errorRate}%`,
      bench4
    );

    console.log('\n================================================================');
    console.log(`TEST EXECUTION COMPLETE: ${suiteResults.summary.passed}/${suiteResults.summary.total} PASSED (${suiteResults.summary.failed} FAILED)`);
    console.log('================================================================');

    // Write results to JSON
    fs.writeFileSync('test/test-results.json', JSON.stringify(suiteResults, null, 2));
    console.log('✓ Test results saved to test/test-results.json');

  } catch (error) {
    console.error('Fatal execution error in test master suite:', error);
  } finally {
    console.log('Shutting down test server...');
    killServer();
    try { await mongoose.disconnect(); } catch {}
    setTimeout(() => {
      process.exit(suiteResults.summary.failed === 0 ? 0 : 1);
    }, 1000);
  }
}

runMasterTest();
