"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as subAdminService from '@/server/services/subadmin.service';

export async function getSubAdminsAction() {
  const auth = await verifyApiAuth('admin'); // ONLY ADMIN CAN MANAGE SUB ADMIN
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { subAdmins } = await subAdminService.getSubAdmins();
    return { success: true, subAdmins };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function createSubAdminAction(data: { name: string; email: string; password?: string; customRoleId?: string }) {
  const auth = await verifyApiAuth();
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized access' };

  try {
    const { subAdmin } = await subAdminService.createSubAdmin(data);
    return { success: true, subAdmin };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function updateSubAdminAction(id: string, body: any) {
  const auth = await verifyApiAuth('admin'); // ONLY ADMIN CAN MANAGE SUB ADMIN
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    const { subAdmin } = await subAdminService.updateSubAdmin(id, body);
    return { success: true, subAdmin };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function deleteSubAdminAction(id: string) {
  const auth = await verifyApiAuth('admin'); // ONLY ADMIN CAN MANAGE SUB ADMIN
  if (!auth.authenticated) return { success: false, message: auth.error };

  try {
    await subAdminService.deleteSubAdmin(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}
