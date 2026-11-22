"use server";

import { cookies } from 'next/headers';
import * as AuthService from '@/server/services/auth.service';

export async function loginStaffAction(uniqueId: string, password: string) {
  try {
    const result = await AuthService.loginStaff(uniqueId, password);
    
    if (!result.success || !result.token) {
      return { success: false, message: result.message || 'Invalid credentials' };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', result.token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 
    });

    const mode = (result as any).assessmentMode || 'virtual';
    if (result.role === 'judge') {
      cookieStore.set('judge_mode', mode, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24
      });
    }

    return { success: true, role: result.role, assessmentMode: mode };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function unifiedLoginAction(identifier: string, passwordSecret: string) {
  try {
    const trimmedId = (identifier || '').trim();
    const trimmedSecret = (passwordSecret || '').trim();

    // 1. Attempt Staff / Admin / Judge login first
    const staffRes = await AuthService.loginStaff(trimmedId, trimmedSecret);
    if (staffRes.success && staffRes.token) {
      const cookieStore = await cookies();
      cookieStore.set('token', staffRes.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/', 
        maxAge: 60 * 60 * 24 
      });

      const mode = (staffRes as any).assessmentMode || 'virtual';
      if (staffRes.role === 'judge') {
        cookieStore.set('judge_mode', mode, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24
        });
      }

      return { success: true, role: staffRes.role, assessmentMode: mode };
    }

    // 2. Attempt Team / Student login
    const teamRes = await AuthService.loginTeam(trimmedId, trimmedSecret);
    if (teamRes.success && teamRes.token) {
      const cookieStore = await cookies();
      cookieStore.set('token', teamRes.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/', 
        maxAge: 60 * 60 * 24 
      });
      return { success: true, role: teamRes.role };
    }

    // If team qualification restriction was triggered, return its specific message
    if (teamRes.message && teamRes.message.includes('Access Denied')) {
      return { success: false, message: teamRes.message };
    }

    return { success: false, message: 'Invalid credentials. Please check your login details.' };
  } catch (error) {
    console.error('Unified Login Error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

import { verifyApiAuth } from '@/server/middleware/apiAuth';
import connectToDatabase from '@/server/config/db';
import User from '@/server/models/User';

export async function getMeAction(): Promise<{ success: boolean; user: any }> {
  const auth = await verifyApiAuth();
  if (!auth.authenticated || !auth.user) return { success: false, user: null };

  if (auth.user.role === 'judge' && (auth.user.id || auth.user.uniqueId)) {
    try {
      await connectToDatabase();
      const query = auth.user.id ? { _id: auth.user.id } : { uniqueId: auth.user.uniqueId };
      const dbJudge = await User.findOne(query).select('-password').lean();
      if (dbJudge) {
        return {
          success: true,
          user: {
            ...auth.user,
            assessmentMode: (dbJudge as any).assessmentMode || 'virtual',
            name: dbJudge.name || auth.user.name,
            email: dbJudge.email
          }
        };
      }
    } catch (e) {
      console.error('Error fetching fresh judge details in getMeAction:', e);
    }
  }

  return { success: true, user: auth.user };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    cookieStore.delete('judge_mode');
    return { success: true };
  } catch (err) {
    console.error('Logout error:', err);
    return { success: false };
  }
}

