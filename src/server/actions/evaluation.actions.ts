"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import {
  getEvaluationService,
  submitEvaluationService,
  getMyEvaluationsService,
  getAllEvaluationsService,
  resetEvaluationService
} from '@/server/services/evaluation.service';

export async function getEvaluationAction(teamId: string, judgeId: string, roundId: string) {
  const auth = await verifyApiAuth('judge');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { evaluation } = await getEvaluationService(teamId, judgeId, roundId);
    return { success: true, evaluation };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function submitEvaluationAction(body: any) {
  const auth = await verifyApiAuth('judge');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { evaluation } = await submitEvaluationService(body);
    return { success: true, evaluation };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function getMyEvaluationsAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return { success: false, message: 'Unauthorized' };

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jose.jwtVerify(token, secret);
    
    if (payload.role !== 'judge') return { success: false, message: 'Forbidden' };

    const { evaluations } = await getMyEvaluationsService();
    return { success: true, evaluations, currentJudgeId: payload.id };
  } catch (error: any) {
    return { success: false, message: error.message || 'Internal Server Error' };
  }
}

export async function getAllEvaluationsAction() {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_evaluations');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { evaluations } = await getAllEvaluationsService();
    return { success: true, evaluations };
  } catch (error: any) {
    return { success: false, message: error.message || 'Internal Server Error' };
  }
}

import { revalidatePath } from 'next/cache';

export async function resetEvaluationAction(evaluationId: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_evaluations');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await resetEvaluationService(evaluationId);
    revalidatePath('/admin/evaluations');
    revalidatePath('/team/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Internal Server Error' };
  }
}
