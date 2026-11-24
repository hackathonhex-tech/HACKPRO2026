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
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized: Admin privilege required to create sub-admin.' };

  if (!data.name || !data.name.trim()) return { success: false, message: 'Name is required.' };
  if (!data.email || !data.email.trim()) return { success: false, message: 'Email is required.' };
  if (!data.password || !data.password.trim()) return { success: false, message: 'Password is required.' };
  if (!data.customRoleId) return { success: false, message: 'Please select a role for the sub-admin.' };

  try {
    const { subAdmin } = await subAdminService.createSubAdmin(data);
    return { success: true, subAdmin };
  } catch (error: any) {
    if (error?.code === 11000) {
      return { success: false, message: 'A user with this email already exists in the system.' };
    }
    return { success: false, message: error.message || 'Server error while creating sub-admin' };
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
