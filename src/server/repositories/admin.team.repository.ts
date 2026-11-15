import connectToDatabase from '@/server/config/db';
import Team from '@/server/models/Team';
import mongoose from 'mongoose';

export async function findTeams(query: any) {
  await connectToDatabase();
  const teams = await Team.find(query)
    .populate('problemStatementId')
    .populate('assignedJudges', 'name email uniqueId')
    .lean();
  return JSON.parse(JSON.stringify(teams));
}

export async function createTeam(teamData: any) {
  await connectToDatabase();
  const team = new Team(teamData);
  await team.save();
  return JSON.parse(JSON.stringify(team));
}

export async function updateTeam(id: string, updateData: any) {
  await connectToDatabase();
  const team = await Team.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function deleteTeam(id: string) {
  await connectToDatabase();
  const team = await Team.findByIdAndDelete(id).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function assignJudges(id: string, assignedJudges: string[]) {
  await connectToDatabase();
  const team = await Team.findByIdAndUpdate(
    id,
    { assignedJudges },
    { new: true }
  ).populate('assignedJudges', 'name email uniqueId').lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function findTeamByIdOrUniqueId(id: string) {
  await connectToDatabase();
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const team = await Team.findOne({
    $or: [
      ...(isObjectId ? [{ _id: id }] : []),
      { uniqueId: id }
    ]
  }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function findTeamById(id: string) {
  await connectToDatabase();
  const team = await Team.findById(id).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}
