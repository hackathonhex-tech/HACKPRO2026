import connectToDatabase from '@/server/config/db';
import Team from '@/server/models/Team';
import mongoose from 'mongoose';

export async function findTeams(query: any) {
  await connectToDatabase();
  const teams = await Team.find(query)
    .populate('problemStatementId')
    .populate('assignedJudges', 'name email uniqueId')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(teams));
}

export async function findPaginatedTeams(query: any, page: number = 1, limit: number = 10) {
  await connectToDatabase();
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate('problemStatementId')
      .populate('assignedJudges', 'name email uniqueId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Team.countDocuments(query)
  ]);

  return {
    teams: JSON.parse(JSON.stringify(teams)),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit)
  };
}

export async function getDistinctTeamPlaces(): Promise<string[]> {
  await connectToDatabase();
  const [places, colleges] = await Promise.all([
    Team.distinct('place'),
    Team.distinct('collegeName')
  ]);

  const uniqueSet = new Set<string>();
  [...places, ...colleges].forEach((val: any) => {
    if (val && typeof val === 'string' && val.trim()) {
      uniqueSet.add(val.trim());
    }
  });

  return Array.from(uniqueSet).sort((a, b) => a.localeCompare(b));
}

export async function getConflictingTeamNames(): Promise<string[]> {
  await connectToDatabase();
  // Fetch minimal fields to compute cross-team empId duplicates
  const rawTeams = await Team.find({}).select('name leadEmpId leadSupersetId supersetId members.empId members.supersetId').lean();
  const empMap = new Map<string, string[]>();

  rawTeams.forEach((t: any) => {
    const tName = t.name || 'Unnamed Team';
    const leadIds = [t.leadEmpId, t.leadSupersetId, t.supersetId].filter(Boolean);
    leadIds.forEach((id: string) => {
      const clean = String(id).trim().toUpperCase();
      if (!clean) return;
      if (!empMap.has(clean)) empMap.set(clean, []);
      if (!empMap.get(clean)!.includes(tName)) empMap.get(clean)!.push(tName);
    });

    (t.members || []).forEach((m: any) => {
      const memIds = [m.empId, m.supersetId].filter(Boolean);
      memIds.forEach((id: string) => {
        const clean = String(id).trim().toUpperCase();
        if (!clean) return;
        if (!empMap.has(clean)) empMap.set(clean, []);
        if (!empMap.get(clean)!.includes(tName)) empMap.get(clean)!.push(tName);
      });
    });
  });

  const conflictingTeams = new Set<string>();
  empMap.forEach((teamList) => {
    if (teamList.length > 1) {
      teamList.forEach(tName => conflictingTeams.add(tName));
    }
  });

  return Array.from(conflictingTeams);
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
