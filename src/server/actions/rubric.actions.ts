"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import { getRubricsService, createRubricService, updateRubricService, deleteRubricService } from '@/server/services/rubric.service';

export async function getRubricsAction() {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], ['manage_rubric', 'hackathon_setup', 'manage_problems', 'manage_evaluations']);
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { rubrics } = await getRubricsService();
    return { success: true, rubrics };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function createRubricAction(body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_rubric');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { rubric } = await createRubricService(body);
    return { success: true, rubric };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function updateRubricAction(id: string, body: any) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_rubric');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { rubric } = await updateRubricService(id, body);
    return { success: true, rubric };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function deleteRubricAction(id: string) {
  const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_rubric');
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await deleteRubricService(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}
