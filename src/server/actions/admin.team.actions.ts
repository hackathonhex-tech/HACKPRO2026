"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as adminTeamService from '@/server/services/admin.team.service';

export async function getTeamsAction() {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || (auth.user?.role !== 'admin' && auth.user?.role !== 'judge' && auth.user?.role !== 'sub-admin')) {
    return { success: false, message: 'Unauthorized access' };
  }
  
  if (auth.user?.role === 'sub-admin') {
    const perms = (auth.user?.permissions as string[]) || [];
    const allowedPerms = ['manage_users', 'assign_judges', 'attendance', 'round_selection', 'deliverables', 'manage_evaluations', 'manage_problems', 'hackathon_setup', 'dashboard', 'admin', '*'];
    const hasAccess = perms.some(p => allowedPerms.includes(p));
    if (!hasAccess) return { success: false, message: 'Unauthorized access' };
  }
  try {
    const teams = await adminTeamService.getTeams(auth.user);
    return { success: true, teams };
  } catch {
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getPaginatedTeamsAction(options: {
  page?: number;
  limit?: number;
  search?: string;
  place?: string;
  size?: string;
} = {}): Promise<
  | {
      success: true;
      teams: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      distinctPlaces?: string[];
      conflictingTeamNames?: string[];
    }
  | {
      success: false;
      message: string;
    }
> {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || (auth.user?.role !== 'admin' && auth.user?.role !== 'judge' && auth.user?.role !== 'sub-admin')) {
    return { success: false, message: 'Unauthorized access' };
  }
  
  if (auth.user?.role === 'sub-admin') {
    const perms = (auth.user?.permissions as string[]) || [];
    const allowedPerms = ['manage_users', 'assign_judges', 'attendance', 'round_selection', 'deliverables', 'manage_evaluations', 'manage_problems', 'hackathon_setup', 'dashboard', 'admin', '*'];
    const hasAccess = perms.some(p => allowedPerms.includes(p));
    if (!hasAccess) return { success: false, message: 'Unauthorized access' };
  }

  try {
    const result = await adminTeamService.getPaginatedTeams(auth.user, options);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching paginated teams:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function getAllFilteredTeamsAction(options: {
  search?: string;
  place?: string;
  size?: string;
} = {}): Promise<
  | {
      success: true;
      teams: any[];
    }
  | {
      success: false;
      message: string;
    }
> {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || (auth.user?.role !== 'admin' && auth.user?.role !== 'judge' && auth.user?.role !== 'sub-admin')) {
    return { success: false, message: 'Unauthorized access' };
  }
  
  if (auth.user?.role === 'sub-admin') {
    const perms = (auth.user?.permissions as string[]) || [];
    const allowedPerms = ['manage_users', 'assign_judges', 'attendance', 'round_selection', 'deliverables', 'manage_evaluations', 'manage_problems', 'hackathon_setup', 'dashboard', 'admin', '*'];
    const hasAccess = perms.some(p => allowedPerms.includes(p));
    if (!hasAccess) return { success: false, message: 'Unauthorized access' };
  }

  try {
    const teams = await adminTeamService.getAllFilteredTeams(auth.user, options);
    return { success: true, teams };
  } catch (error) {
    console.error('Error fetching all filtered teams:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function createTeamAction(body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };
  
  try {
    const team = await adminTeamService.createTeam(body);
    return { success: true, team };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function updateTeamAction(id: string, body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const team = await adminTeamService.updateTeam(id, body);
    return { success: true, team };
  } catch (err: any) {
    return { success: false, message: err.message === 'Team not found' ? 'Team not found' : 'Server error' };
  }
}

export async function deleteTeamAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await adminTeamService.deleteTeam(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message === 'Team not found' ? 'Team not found' : 'Server error' };
  }
}

export async function assignJudgesAction(id: string, assignedJudges: string[]) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['manage_users', 'assign_judges']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const team = await adminTeamService.assignJudges(id, assignedJudges);
    return { success: true, team };
  } catch (err: any) {
    return { success: false, message: err.message === 'Team not found' ? 'Team not found' : 'Server error' };
  }
}

export async function updateTeamAttendanceAction(id: string, attendance: boolean) {
  const auth = await verifyApiAuth(['admin', 'sub-admin', 'judge'], ['manage_users', 'attendance', 'scanner']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const team = await adminTeamService.updateTeamAttendance(id, attendance);
    return { success: true, team };
  } catch (err: any) {
    return { success: false, message: err.message === 'Team not found' ? 'Team not found' : 'Server error' };
  }
}

export async function updateTeamAttendanceBatchAction(
  id: string,
  memberAttendances: boolean[],
  teamAttendance?: boolean
) {
  const auth = await verifyApiAuth(['admin', 'sub-admin', 'judge'], ['manage_users', 'attendance', 'scanner']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const team = await adminTeamService.updateTeamMembersAttendanceBatch(id, memberAttendances, teamAttendance);
    return { success: true, team };
  } catch (err: any) {
    return { success: false, message: err.message === 'Team not found' ? 'Team not found' : 'Server error' };
  }
}

export async function updateMemberAttendanceAction(id: string, memberIndex: number, attendance: boolean) {
  const auth = await verifyApiAuth(['admin', 'sub-admin', 'judge'], ['manage_users', 'attendance', 'scanner']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const team = await adminTeamService.updateMemberAttendance(id, memberIndex, attendance);
    return { success: true, team };
  } catch (error: any) {
    if (error.message === 'Team not found') return { success: false, message: 'Team not found' };
    if (error.message === 'Invalid member index') return { success: false, message: 'Invalid member index' };
    return { success: false, message: 'Server error' };
  }
}

export async function resendTeamEmailAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const res = await adminTeamService.resendTeamTicketEmail(id);
    return res;
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}
