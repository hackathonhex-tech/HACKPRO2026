import connectToDatabase from '@/server/config/db';
import User from '@/server/models/User';

export async function findJudges() {
  await connectToDatabase();
  const judges = await User.find({ role: 'judge' }).select('-password').lean();
  return JSON.parse(JSON.stringify(judges));
}

export async function createJudge(judgeData: any) {
  await connectToDatabase();
  const judge = new User(judgeData);
  await judge.save();
  return JSON.parse(JSON.stringify(judge));
}

export async function updateJudge(id: string, updateData: any) {
  await connectToDatabase();
  const judge = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password').lean();
  return judge ? JSON.parse(JSON.stringify(judge)) : null;
}

export async function deleteJudge(id: string) {
  await connectToDatabase();
  const judge = await User.findByIdAndDelete(id).lean();
  return judge ? JSON.parse(JSON.stringify(judge)) : null;
}
