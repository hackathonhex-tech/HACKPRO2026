"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as judgeService from '@/server/services/judge.service';

export async function getJudgesAction() {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['manage_users', 'assign_judges', 'dashboard']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const judges = await judgeService.getJudges();
    return { success: true, judges };
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function createJudgeAction(body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const judge = await judgeService.createJudge(body);
    return { success: true, judge };
  } catch (error: any) {
    console.error('createJudgeAction error:', error);
    if (error.code === 11000) {
      return { success: false, message: 'A judge with this email already exists.' };
    }
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function updateJudgeAction(id: string, body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const judge = await judgeService.updateJudge(id, body);
    return { success: true, judge };
  } catch (error: any) {
    return { success: false, message: error.message === 'Judge not found' ? 'Judge not found' : 'Server error' };
  }
}

export async function deleteJudgeAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_users');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await judgeService.deleteJudge(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message === 'Judge not found' ? 'Judge not found' : 'Server error' };
  }
}
