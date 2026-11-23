"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as importTeamService from '@/server/services/import.team.service';

export async function parseAndValidateEmployeeCsvAction(rawRows: any[]) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const result = await importTeamService.parseAndValidateEmployeeData(rawRows);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[parseAndValidateEmployeeCsvAction error]:', err);
    return { success: false, message: err.message || 'Failed to parse employee data' };
  }
}

export async function importEmployeeTeamsAction(
  teams: importTeamService.ParsedEmployeeTeam[],
  options?: { sendEmails?: boolean }
) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const result = await importTeamService.importEmployeeTeams(teams, options);
    return { success: true, result };
  } catch (err: any) {
    console.error('[importEmployeeTeamsAction error]:', err);
    return { success: false, message: err.message || 'Failed to import teams' };
  }
}
