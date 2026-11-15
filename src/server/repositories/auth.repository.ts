import connectToDatabase from '@/server/config/db';
import User from '@/server/models/User';
import Team from '@/server/models/Team';
import '@/server/models/Role';

export async function getUserByUniqueIdOrEmail(uniqueId: string) {
  await connectToDatabase();
  let user = await User.findOne({ uniqueId }).populate('customRoleId').lean();
  if (!user) {
    user = await User.findOne({ email: uniqueId }).populate('customRoleId').lean();
  }
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export async function getTeamByLeadEmail(leadEmail: string) {
  await connectToDatabase();
  const team = await Team.findOne({ leadEmail }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function getTeamByLeadEmailOrUniqueId(identifier: string) {
  await connectToDatabase();
  let team = await Team.findOne({ leadEmail: identifier }).lean();
  if (!team) {
    team = await Team.findOne({ uniqueId: identifier }).lean();
  }
  return team ? JSON.parse(JSON.stringify(team)) : null;
}
