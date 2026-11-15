import connectToDatabase from '@/server/config/db';
import Round from '@/server/models/Round';

export async function findActiveRound() {
  await connectToDatabase();
  const round = await Round.findOne({ isActive: true }).populate('activeRubricId').populate('activeMemberRubricId');
  return round ? JSON.parse(JSON.stringify(round)) : null;
}

export async function findAllRounds() {
  await connectToDatabase();
  const rounds = await Round.find({}).populate('activeRubricId').populate('activeMemberRubricId');
  return JSON.parse(JSON.stringify(rounds));
}

export async function deactivateAllRounds() {
  await connectToDatabase();
  await Round.updateMany({}, { isActive: false });
}

export async function deactivateOtherRounds(excludeId: string) {
  await connectToDatabase();
  await Round.updateMany({ _id: { $ne: excludeId } }, { isActive: false });
}

export async function createRound(data: any) {
  await connectToDatabase();
  const round = new Round(data);
  await round.save();
  return JSON.parse(JSON.stringify(round));
}

export async function updateRoundById(id: string, data: any) {
  await connectToDatabase();
  const round = await Round.findByIdAndUpdate(id, { $set: data }, { new: true });
  return round ? JSON.parse(JSON.stringify(round)) : null;
}

export async function deleteRoundById(id: string) {
  await connectToDatabase();
  return await Round.findByIdAndDelete(id);
}

import mongoose from 'mongoose';

export async function updateRoundAllowedTeams(roundId: string, allowedTeamIds: string[]) {
  await connectToDatabase();
  const objectIds = (allowedTeamIds || []).map(id => new mongoose.Types.ObjectId(id));
  const round = await Round.findByIdAndUpdate(
    roundId, 
    { $set: { allowedTeamIds: objectIds } }, 
    { new: true, runValidators: false }
  );
  return round ? JSON.parse(JSON.stringify(round)) : null;
}
