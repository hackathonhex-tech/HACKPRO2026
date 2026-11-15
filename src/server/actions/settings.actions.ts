"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as SettingsService from '@/server/services/settings.service';

export async function getPublicSettingsAction() {
  try {
    return await SettingsService.getPublicSettings();
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getAdminSettingsAction() {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_settings');
    if (!auth.authenticated) return { success: false, message: auth.error };
    
    return await SettingsService.getAdminSettings();
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function updateAdminSettingsAction(body: any) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_settings');
    if (!auth.authenticated) return { success: false, message: auth.error };
    
    return await SettingsService.updateAdminSettings(body);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getLeaderboardAction() {
  try {
    const auth = await verifyApiAuth();
    return await SettingsService.getLeaderboard(auth.user?.role as string | undefined);
  } catch {
    return { success: false, message: 'Internal Server Error' };
  }
}
