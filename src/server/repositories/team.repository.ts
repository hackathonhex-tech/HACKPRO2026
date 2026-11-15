import connectToDatabase from '@/server/config/db';
import Team from '@/server/models/Team';
import Settings from '@/server/models/Settings';
import Deliverable from '@/server/models/Deliverable';
import ProblemStatement from '@/server/models/ProblemStatement';

export async function getSettings() {
  await connectToDatabase();
  const settings = await Settings.findOne({}).lean();
  return settings ? JSON.parse(JSON.stringify(settings)) : null;
}

export async function getTeamByLeadEmail(leadEmail: string) {
  await connectToDatabase();
  const team = await Team.findOne({ leadEmail }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function createTeam(teamData: any) {
  await connectToDatabase();
  const team = new Team(teamData);
  await team.save();
  return JSON.parse(JSON.stringify(team));
}

export async function getDeliverable(teamId: string, roundId: string) {
  await connectToDatabase();
  const deliverable = await Deliverable.findOne({ teamId, roundId }).lean();
  return deliverable ? JSON.parse(JSON.stringify(deliverable)) : null;
}

export async function createDeliverable(data: any) {
  await connectToDatabase();
  const deliverable = await Deliverable.create(data);
  return JSON.parse(JSON.stringify(deliverable));
}

export async function getTeamByIdWithProblemStatement(teamId: string) {
  await connectToDatabase();
  const team = await Team.findById(teamId).populate('problemStatementId').lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function getProblemStatementById(id: string) {
  await connectToDatabase();
  const ps = await ProblemStatement.findById(id).lean();
  return ps ? JSON.parse(JSON.stringify(ps)) : null;
}

export async function incrementProblemStatementSlots(id: string) {
  await connectToDatabase();
  await ProblemStatement.updateOne({ _id: id }, { $inc: { slotsFilled: 1 } });
}

export async function updateTeamProblemStatement(teamId: string, problemStatementId: string, selectedStack?: string) {
  await connectToDatabase();
  const updateData: any = { problemStatementId };
  if (selectedStack) {
    updateData.selectedStack = selectedStack;
  }
  const team = await Team.findByIdAndUpdate(teamId, { $set: updateData }, { new: true }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function getTeamByUniqueId(uniqueId: string) {
  await connectToDatabase();
  const team = await Team.findOne({ uniqueId })
    .populate('problemStatementId')
    .populate('assignedJudges')
    .lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function getAllDeliverables() {
  await connectToDatabase();
  const deliverables = await Deliverable.find({})
    .populate({
      path: 'teamId',
      select: 'name uniqueId collegeName problemStatementId',
      populate: {
        path: 'problemStatementId',
        select: 'title track'
      }
    })
    .populate({
      path: 'roundId',
      select: 'name'
    })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(deliverables));
}

export async function updateDeliverable(id: string, data: any) {
  await connectToDatabase();
  const deliverable = await Deliverable.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
  return deliverable ? JSON.parse(JSON.stringify(deliverable)) : null;
}

export async function deleteDeliverable(id: string) {
  await connectToDatabase();
  const deliverable = await Deliverable.findByIdAndDelete(id).lean();
  return deliverable ? JSON.parse(JSON.stringify(deliverable)) : null;
}
