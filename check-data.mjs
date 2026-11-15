import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually parse .env.local
const envFile = fs.readFileSync(join(__dirname, '.env.local'), 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const TeamSchema = new mongoose.Schema({}, { strict: false });
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

const PSSchema = new mongoose.Schema({}, { strict: false });
const PS = mongoose.models.ProblemStatement || mongoose.model('ProblemStatement', PSSchema, 'problemstatements');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const teamCount = await Team.countDocuments();
    const psCount = await PS.countDocuments();
    
    console.log(`Teams in database: ${teamCount}`);
    console.log(`Problem Statements in database: ${psCount}`);
    
    if (teamCount > 0) {
      const sampleTeam = await Team.findOne();
      console.log('Sample Team:', sampleTeam);
    }
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
