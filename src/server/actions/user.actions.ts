"use server";

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import { cookies } from 'next/headers';
import * as userService from '../services/user.service';

export async function meAction() {
  try {
    const auth = await verifyApiAuth();
    if (auth.authenticated && auth.user) {
      return await userService.getMe(auth.user);
    }
    return { success: false, message: auth.error };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    return await userService.logout();
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error' };
  }
}
