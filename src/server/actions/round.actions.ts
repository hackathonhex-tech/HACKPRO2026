"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as roundService from '@/server/services/round.service';

export async function getActiveRoundAction() {
  try {
    const round = await roundService.getActiveRound();
    return { success: true, round };
  } catch (error: any) {
    if (error.message === 'No active round found') {
      return { success: false, message: 'No active round found' };
    }
    return { success: false, message: 'Server error' };
  }
}

export async function getRoundsAction() {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['round_selection', 'hackathon_setup', 'manage_problems', 'manage_evaluations', 'deliverables']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const rounds = await roundService.getRounds();
    return { success: true, rounds };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function createRoundAction(body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const round = await roundService.createRound(body);
    return { success: true, round };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function updateRoundAction(id: string, body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const round = await roundService.updateRound(id, body);
    return { success: true, round };
  } catch (error: any) {
    if (error.message === 'Round not found') {
      return { success: false, message: 'Round not found' };
    }
    return { success: false, message: 'Server error' };
  }
}

export async function deleteRoundAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await roundService.deleteRound(id);
    return { success: true, message: 'Round deleted successfully' };
  } catch (error: any) {
    if (error.message === 'Round not found') {
      return { success: false, message: 'Round not found' };
    }
    return { success: false, message: 'Server error' };
  }
}

export async function updateRoundAllowedTeamsAction(roundId: string, allowedTeamIds: string[]) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['round_selection', 'manage_problems', 'hackathon_setup']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const round = await roundService.updateRoundAllowedTeams(roundId, allowedTeamIds);
    return { success: true, round };
  } catch (error: any) {
    if (error.message === 'Round not found') {
      return { success: false, message: 'Round not found' };
    }
    return { success: false, message: 'Server error' };
  }
}
