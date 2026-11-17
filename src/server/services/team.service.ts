import {
  getSettings,
  getTeamByLeadEmail,
  createTeam,
  getDeliverable,
  createDeliverable,
  getTeamByIdWithProblemStatement,
  getProblemStatementById,
  incrementProblemStatementSlots,
  updateTeamProblemStatement,
  getTeamByUniqueId,
  getAllDeliverables,
  updateDeliverable,
  deleteDeliverable
} from '../repositories/team.repository';
import { getPublicFeedbacksForTeam } from '../repositories/evaluation.repository';
import { v4 as uuidv4 } from 'uuid';

import { sendRegistrationTicketEmail } from './email.service';

export async function registerTeam(payload: any) {
  const uniqueId = `TM-${uuidv4().substring(0, 6).toUpperCase()}`;

  const settings = await getSettings();
  if (settings && settings.isRegistrationOpen === false) {
    return { success: false, message: 'Registration is currently closed.' };
  }

  const existingTeam = await getTeamByLeadEmail(payload.leadEmail);
  if (existingTeam) {
    return { success: false, message: 'A team with this lead email already exists.' };
  }

  const leadSuperset = payload.leadSupersetId || payload.supersetId || '';

  const allMembers = [
    {
      name: payload.leadName,
      supersetId: leadSuperset,
      contact: payload.leadEmail,
      email: payload.leadEmail,
      phone: payload.leadPhone,
      college: payload.collegeName,
      department: payload.department,
      attendance: false,
      customFields: payload.leadCustomFields || payload.leadCustom || {}
    },
    ...(payload.members || []).map((m: any) => ({
      name: m.name,
      supersetId: m.supersetId || '',
      contact: m.contact || m.email || m.phone,
      email: m.email || '',
      phone: m.phone || '',
      college: m.college || payload.collegeName,
      department: m.department || payload.department,
      attendance: m.attendance || false,
      customFields: m.customFields || {}
    }))
  ];

  const teamData = {
    name: payload.name,
    leadName: payload.leadName,
    leadEmail: payload.leadEmail,
    leadPhone: payload.leadPhone,
    leadSupersetId: leadSuperset,
    supersetId: leadSuperset,
    collegeName: payload.collegeName,
    department: payload.department,
    customFields: payload.customFields || {},
    members: allMembers,
    uniqueId,
    qrCodeString: uniqueId
  };

  const team = await createTeam(teamData);

  // Automatically allow newly registered team in active rounds
  try {
    await Round.updateMany(
      { $or: [{ isActive: true }, { allowedTeamIds: { $exists: true } }] },
      { $addToSet: { allowedTeamIds: team._id } }
    );
  } catch (err) {
    console.error("[Auto-Allow Round Qualification Error]:", err);
  }

  // Send Brevo email ticket asynchronously
  sendRegistrationTicketEmail(team).catch(err => {
    console.error("[Brevo Email Background Error]:", err);
  });

  return { success: true, team };
}

import Round from '../models/Round';

export async function submitDeliverable(body: any) {
  const { teamId, roundId, githubLink, deckUrl, videoLink, abstract } = body;
  
  const round = await Round.findById(roundId).lean();
  if (round && Array.isArray(round.allowedTeamIds)) {
    const isAllowed = round.allowedTeamIds.some((id: any) => id.toString() === teamId.toString());
    if (!isAllowed) {
      return { success: false, message: 'Your team is not selected/qualified for this round.' };
    }
  }

  const existing = await getDeliverable(teamId, roundId);
  if (existing) {
    return { success: false, message: 'You have already submitted your deliverables for this round.' };
  }

  const deliverable = await createDeliverable({ teamId, roundId, githubLink, deckUrl, videoLink, abstract });
  return { success: true, deliverable };
}

export async function getTeamDeliverable(teamId: string, roundId: string) {
  if (!teamId || !roundId) return { success: false };
  const deliverable = await getDeliverable(teamId, roundId);
  return { success: true, deliverable };
}

export async function selectProblemStatement(teamId: string, problemStatementId: string, selectedStack?: string) {
  const existingTeam = await getTeamByIdWithProblemStatement(teamId);
  if (!existingTeam) {
    return { success: false, message: 'Team not found' };
  }
  
  if (existingTeam.problemStatementId) {
    return { success: false, message: 'Problem statement already selected and locked.' };
  }

  const ps = await getProblemStatementById(problemStatementId);
  if (!ps) {
    return { success: false, message: 'Problem statement not found' };
  }
  
  if (!ps.isVisible) {
    return { success: false, message: 'This problem statement is no longer available' };
  }

  if (ps.slotLimit > 0 && ps.slotsFilled >= ps.slotLimit) {
    return { success: false, message: 'Slots are full for this problem statement.' };
  }

  if (!selectedStack || !selectedStack.trim()) {
    return { success: false, message: 'Please enter a valid tech stack.' };
  }

  await incrementProblemStatementSlots(problemStatementId);
  const updatedTeam = await updateTeamProblemStatement(teamId, problemStatementId, selectedStack);

  return { success: true, team: updatedTeam };
}

export async function getTeamByUniqueIdService(uniqueId: string) {
  const team = await getTeamByUniqueId(uniqueId);
  if (!team) return { success: false, message: 'Team not found' };

  const feedbacks = await getPublicFeedbacksForTeam(team._id);

  return { success: true, team, feedbacks };
}

export async function getAllDeliverablesService() {
  const deliverables = await getAllDeliverables();
  return { success: true, deliverables };
}

export async function createAdminDeliverable(body: any) {
  const { teamId, roundId, githubLink, deckUrl, videoLink, abstract } = body;
  const existing = await getDeliverable(teamId, roundId);
  if (existing) {
    return { success: false, message: 'This team already has a submission for this round.' };
  }
  const deliverable = await createDeliverable({ teamId, roundId, githubLink, deckUrl, videoLink, abstract });
  return { success: true, deliverable };
}

export async function updateAdminDeliverable(id: string, body: any) {
  const { githubLink, deckUrl, videoLink, abstract } = body;
  const deliverable = await updateDeliverable(id, { githubLink, deckUrl, videoLink, abstract });
  if (!deliverable) return { success: false, message: 'Deliverable not found.' };
  return { success: true, deliverable };
}

export async function deleteAdminDeliverableService(id: string) {
  const deliverable = await deleteDeliverable(id);
  if (!deliverable) return { success: false, message: 'Deliverable not found.' };
  return { success: true };
}
