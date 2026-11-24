import { v4 as uuidv4 } from 'uuid';
import * as teamRepo from '../repositories/admin.team.repository';
import { sendRegistrationTicketEmail } from './email.service';

export async function getTeams(user: any) {
  const query: any = {};
  if (user.role === 'judge') {
    query.assignedJudges = user.id;
  }
  return await teamRepo.findTeams(query);
}

export async function getPaginatedTeams(
  user: any,
  options: { page?: number; limit?: number; search?: string; place?: string; size?: string } = {}
) {
  const query: any = {};
  if (user.role === 'judge') {
    query.assignedJudges = user.id;
  }

  const { search, place, size, page = 1, limit = 10 } = options;

  // Search filter across name, uniqueId, leadName, leadEmail, place, and members
  if (search && search.trim()) {
    const cleanSearch = search.trim();
    const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { name: regex },
      { uniqueId: regex },
      { leadName: regex },
      { leadEmail: regex },
      { leadPhone: regex },
      { leadEmpId: regex },
      { leadSupersetId: regex },
      { place: regex },
      { collegeName: regex },
      { 'members.name': regex },
      { 'members.email': regex },
      { 'members.empId': regex },
      { 'members.supersetId': regex }
    ];
  }

  // Place filter
  if (place && place.trim()) {
    const cleanPlace = place.trim();
    const escapedPlace = cleanPlace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regPlace = new RegExp(`^${escapedPlace}$`, 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { place: regPlace },
        { collegeName: regPlace }
      ]
    });
  }

  // Team Size filter
  if (size && size.trim() !== '') {
    const sizeInt = parseInt(size, 10);
    if (!isNaN(sizeInt)) {
      query.members = { $size: sizeInt };
    }
  }

  const [paginatedResult, distinctPlaces, conflictingTeamNames] = await Promise.all([
    teamRepo.findPaginatedTeams(query, page, limit),
    teamRepo.getDistinctTeamPlaces(),
    teamRepo.getConflictingTeamNames()
  ]);

  return {
    ...paginatedResult,
    distinctPlaces,
    conflictingTeamNames
  };
}

export async function getAllFilteredTeams(
  user: any,
  options: { search?: string; place?: string; size?: string } = {}
) {
  const query: any = {};
  if (user.role === 'judge') {
    query.assignedJudges = user.id;
  }

  const { search, place, size } = options;

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { name: regex },
      { uniqueId: regex },
      { leadName: regex },
      { leadEmail: regex },
      { leadPhone: regex },
      { leadEmpId: regex },
      { leadSupersetId: regex },
      { place: regex },
      { collegeName: regex },
      { 'members.name': regex },
      { 'members.email': regex },
      { 'members.empId': regex },
      { 'members.supersetId': regex }
    ];
  }

  if (place && place.trim()) {
    const cleanPlace = place.trim();
    const escapedPlace = cleanPlace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regPlace = new RegExp(`^${escapedPlace}$`, 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { place: regPlace },
        { collegeName: regPlace }
      ]
    });
  }

  if (size && size.trim() !== '') {
    const sizeInt = parseInt(size, 10);
    if (!isNaN(sizeInt)) {
      query.members = { $size: sizeInt };
    }
  }

  return await teamRepo.findTeams(query);
}

import Round from '../models/Round';

export async function createTeam(body: any) {
  const uniqueId = `TM-${uuidv4().substring(0, 6).toUpperCase()}`;
  const teamData: any = {
    ...body,
    name: body.name,
    leadName: body.leadName || body.name,
    leadEmail: body.leadEmail || '',
    leadPhone: body.leadPhone || '',
    leadEmpId: body.leadEmpId || body.empId || '',
    place: body.place || '',
    leadSupersetId: body.leadSupersetId || body.supersetId || '',
    supersetId: body.supersetId || body.leadSupersetId || '',
    collegeName: body.collegeName || '',
    department: body.department || '',
    customFields: body.customFields || {},
    members: body.members || [],
    uniqueId,
    qrCodeString: uniqueId
  };
  const team = await teamRepo.createTeam(teamData);

  // Automatically allow newly created team in active rounds
  try {
    await Round.updateMany(
      { $or: [{ isActive: true }, { allowedTeamIds: { $exists: true } }] },
      { $addToSet: { allowedTeamIds: team._id } }
    );
  } catch (err) {
    console.error("[Auto-Allow Round Qualification Admin Error]:", err);
  }

  // Send Brevo email ticket asynchronously
  sendRegistrationTicketEmail(team).catch(err => {
    console.error("[Brevo Email Admin Creation Error]:", err);
  });

  return team;
}

export async function updateTeam(id: string, body: any) {
  const team = await teamRepo.updateTeam(id, body);
  if (!team) throw new Error('Team not found');
  return team;
}

export async function deleteTeam(id: string) {
  const team = await teamRepo.deleteTeam(id);
  if (!team) throw new Error('Team not found');
  return true;
}

export async function assignJudges(id: string, judges: string[]) {
  const team = await teamRepo.assignJudges(id, judges);
  if (!team) throw new Error('Team not found');
  return team;
}

export async function updateTeamAttendance(id: string, attendance: boolean) {
  const team = await teamRepo.findTeamByIdOrUniqueId(id);
  if (!team) throw new Error('Team not found');
  
  return await teamRepo.updateTeam(team._id, { attendance });
}

export async function updateMemberAttendance(id: string, memberIndex: number, attendance: boolean) {
  const team = await teamRepo.findTeamById(id);
  if (!team) throw new Error('Team not found');
  
  if (memberIndex < 0 || memberIndex >= team.members.length) {
    throw new Error('Invalid member index');
  }

  team.members[memberIndex].attendance = attendance;
  const overallAttendance = team.members.every((m: any) => m.attendance === true);
  
  return await teamRepo.updateTeam(team._id, { 
    members: team.members,
    attendance: overallAttendance 
  });
}

export async function resendTeamTicketEmail(id: string) {
  const team = await teamRepo.findTeamById(id);
  if (!team) throw new Error('Team not found');
  
  return await sendRegistrationTicketEmail(team);
}
