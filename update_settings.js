import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('settings').updateOne({}, {
    $set: { 
      'leaderboardFilters.round': true,
      'leaderboardFilters.judge': true,
      'leaderboardFilters.problemStatement': true
    }
  });
  console.log('Settings updated');
  process.exit(0);
});
