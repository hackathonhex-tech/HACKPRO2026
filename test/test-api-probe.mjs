import http from 'http';
import { spawn } from 'child_process';
import { SignJWT } from 'jose';

const PORT = 4050;
const secretKey = new TextEncoder().encode('KIUJASICBXvcivIEC');

const adminToken = await new SignJWT({
  id: 'admin',
  uniqueId: 'admin',
  name: 'Hexaware Lead Organizer',
  role: 'admin',
  permissions: ['all']
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secretKey);

console.log(`Starting Next.js on port ${PORT}...`);

const proc = spawn('npx.cmd', ['next', 'dev', '--webpack', '-p', String(PORT)], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

proc.stdout.on('data', d => {
  const str = d.toString();
  if (str.includes('Ready') || str.includes('GET') || str.includes('Compil')) {
    console.log('[Next]', str.trim());
  }
});
proc.stderr.on('data', d => {
  const str = d.toString();
  if (str.includes('Error') || str.includes('EPERM')) {
    console.error('[Next ERR]', str.trim());
  }
});

function request(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Cookie'] = `token=${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: headers,
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function probe() {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await request('/api/timer');
      if (res.status === 200) {
        console.log('✓ /api/timer ready: Status 200');

        console.log('Testing /admin/dashboard with Admin Token...');
        const adminRes = await request('/admin/dashboard', adminToken);
        console.log('Admin Dashboard Status:', adminRes.status, 'Body length:', adminRes.body.length);

        console.log('Testing /api/auth/login...');
        const authReq = await new Promise((res, rej) => {
          const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, r => {
            let b = '';
            r.on('data', c => b += c);
            r.on('end', () => res({ status: r.statusCode, body: b }));
          });
          req.on('error', rej);
          req.write(JSON.stringify({ uniqueId: 'admin', password: 'admin1234' }));
          req.end();
        });
        console.log('Auth login status:', authReq.status, 'Body:', authReq.body);

        cleanup();
        process.exit(0);
      }
    } catch {}
  }
  console.log('TIMEOUT');
  cleanup();
  process.exit(1);
}

function cleanup() {
  proc.kill();
  if (proc.pid) {
    try {
      spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
    } catch {}
  }
}

probe();
