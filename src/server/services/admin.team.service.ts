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

import Round from '../models/Round';

export async function createTeam(body: any) {
  const uniqueId = `TM-${uuidv4().substring(0, 6).toUpperCase()}`;
  const teamData = {
    name: body.name,
    leadName: body.leadName || body.name,
    leadEmail: body.leadEmail || '',
    leadPhone: body.leadPhone || '',
    collegeName: body.collegeName || '',
    department: body.department || '',
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
