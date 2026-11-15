"use server";

import * as RoleService from '../services/role.service';
import { verifyApiAuth } from '../middleware/apiAuth';

export async function getRolesAction() {
  const auth = await verifyApiAuth();
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized access' };

  try {
    const roles = await RoleService.getRoles();
    return { success: true, ...roles };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch roles' };
  }
}

export async function createRoleAction(data: { name: string; permissions: string[] }) {
  const auth = await verifyApiAuth();
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized access' };

  try {
    const role = await RoleService.createRole(data);
    return { success: true, ...role };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create role' };
  }
}

export async function updateRoleAction(id: string, data: { name: string; permissions: string[] }) {
  const auth = await verifyApiAuth();
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized access' };

  try {
    const role = await RoleService.updateRole(id, data);
    return { success: true, ...role };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update role' };
  }
}

export async function deleteRoleAction(id: string) {
  const auth = await verifyApiAuth();
  if (auth.user?.role !== 'admin') return { success: false, message: 'Unauthorized access' };

  try {
    await RoleService.deleteRole(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete role' };
  }
}
