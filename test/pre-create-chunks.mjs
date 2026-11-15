import fs from 'fs';
import path from 'path';

function ensureDirs(srcDir, targetBases) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = path.join(srcDir, entry.name);
      const rel = path.relative('src/app', sub).replace(/\\/g, '/');
      for (const base of targetBases) {
        const target = path.join(base, rel);
        fs.mkdirSync(target, { recursive: true });
      }
      ensureDirs(sub, targetBases);
    }
  }
}

const targetBases = [
  '.next/dev/static/chunks/app',
  '.next/dev/server/app',
  '.next/static/chunks/app',
  '.next/server/app'
];

targetBases.forEach(b => fs.mkdirSync(b, { recursive: true }));
ensureDirs('src/app', targetBases);
console.log('✓ All chunk directories successfully pre-created to prevent Windows EPERM race condition.');
