"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as problemStatementService from '@/server/services/problem-statements.service';

export async function getProblemStatementsAction() {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || !['admin', 'judge', 'team', 'sub-admin'].includes(auth.user?.role as string)) {
    return { success: false, message: 'Unauthorized access' };
  }
  if (auth.user?.role === 'sub-admin') {
    const perms = (auth.user?.permissions as string[]) || [];
    const allowed = ['hackathon_setup', 'manage_problems', 'round_selection', 'manage_evaluations', 'deliverables', 'dashboard', 'admin', '*'];
    if (!perms.some(p => allowed.includes(p))) return { success: false, message: 'Unauthorized access' };
  }
  try {
    const ps = await problemStatementService.getProblemStatements(auth.user?.role as string);
    return { success: true, problemStatements: ps };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getPublicProblemStatementsAction() {
  try {
    const ps = await problemStatementService.getProblemStatements('team'); // 'team' role gets only visible PS
    return { success: true, problemStatements: ps };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function createProblemStatementAction(body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const ps = await problemStatementService.createProblemStatement(body);
    return { success: true, problemStatement: ps };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getProblemStatementAction(id: string) {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || !['admin', 'judge', 'team', 'sub-admin'].includes(auth.user?.role as string)) {
    return { success: false, message: 'Unauthorized' };
  }
  if (auth.user?.role === 'sub-admin') {
    const perms = (auth.user?.permissions as string[]) || [];
    const allowed = ['hackathon_setup', 'manage_problems', 'round_selection', 'manage_evaluations', 'deliverables', 'dashboard', 'admin', '*'];
    if (!perms.some(p => allowed.includes(p))) return { success: false, message: 'Unauthorized access' };
  }

  try {
    const ps = await problemStatementService.getProblemStatement(id, auth.user?.role as string);
    return { success: true, problemStatement: ps };
  } catch (err: any) {
    if (err.message === 'Not found or not available') {
      return { success: false, message: 'Not found or not available' };
    }
    return { success: false, message: 'Server error' };
  }
}

export async function updateProblemStatementAction(id: string, body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const ps = await problemStatementService.updateProblemStatement(id, body);
    return { success: true, problemStatement: ps };
  } catch (err: any) {
    if (err.message === 'Not found') {
      return { success: false, message: 'Not found' };
    }
    return { success: false, message: 'Server error' };
  }
}

export async function deleteProblemStatementAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['hackathon_setup', 'manage_problems']);
  if (!auth.authenticated) return { success: false, message: auth.error };
  
  try {
    await problemStatementService.deleteProblemStatement(id);
    return { success: true };
  } catch {
    return { success: false, message: 'Server error' };
  }
}
