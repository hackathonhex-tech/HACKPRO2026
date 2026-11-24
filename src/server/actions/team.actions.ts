"use server";

import { cookies } from 'next/headers';
import { signToken } from '@/server/middleware/auth';
import { verifyApiAuth } from '@/server/middleware/apiAuth';
import * as teamService from '../services/team.service';

export async function registerTeamAction(payload: any) {
  try {
    const result = await teamService.registerTeam(payload);
    
    if (result.success && result.team) {
      const { team } = result;
      // Auto-login after registration
      const token = signToken({ id: team._id, uniqueId: team.uniqueId, role: 'team', name: team.name });
      
      const cookieStore = await cookies();
      cookieStore.set('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/', 
        maxAge: 60 * 60 * 24 
      });

      return { 
        success: true, 
        team: { 
          uniqueId: team.uniqueId, 
          name: team.name,
          leadName: team.leadName,
          leadEmail: team.leadEmail,
          members: team.members 
        } 
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Registration Error:', error);
    return { success: false, message: error.message || 'Registration failed' };
  }
}

export async function submitDeliverableAction(body: any) {
  try {
    const auth = await verifyApiAuth('team');
    if (!auth.authenticated) {
      return { success: false, message: auth.error };
    }
    return await teamService.submitDeliverable(body);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getDeliverableAction(teamId: string, roundId: string) {
  try {
    const auth = await verifyApiAuth('team');
    if (!auth.authenticated) {
      return { success: false, message: auth.error };
    }
    return await teamService.getTeamDeliverable(teamId, roundId);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function selectProblemStatementAction(teamId: string, problemStatementId: string, selectedStack?: string) {
  try {
    const auth = await verifyApiAuth('team');
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: auth.error || 'Unauthorized' };
    }

    // Role check: Only the Team Leader is permitted to select the problem statement
    if ((auth.user as any).isLead === false) {
      return { 
        success: false, 
        message: 'Only the Team Leader is authorized to select or change the problem statement.' 
      };
    }

    return await teamService.selectProblemStatement(teamId, problemStatementId, selectedStack, (auth.user as any).email);
  } catch (err: any) {
    console.error('Error selecting problem statement:', err);
    return { success: false, message: 'Server error' };
  }
}

export async function getTeamByUniqueIdAction(uniqueId: string) {
  try {
    return await teamService.getTeamByUniqueIdService(uniqueId);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getAllDeliverablesAction() {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], ['deliverables', 'manage_problems', 'manage_evaluations']);
    if (!auth.authenticated) return { success: false, message: auth.error };
    return await teamService.getAllDeliverablesService();
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function createAdminDeliverableAction(body: any) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], ['deliverables', 'manage_problems']);
    if (!auth.authenticated) return { success: false, message: auth.error };
    return await teamService.createAdminDeliverable(body);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function updateAdminDeliverableAction(id: string, body: any) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], ['deliverables', 'manage_problems']);
    if (!auth.authenticated) return { success: false, message: auth.error };
    return await teamService.updateAdminDeliverable(id, body);
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function deleteAdminDeliverableAction(id: string) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], ['deliverables', 'manage_problems']);
    if (!auth.authenticated) return { success: false, message: auth.error };
    return await teamService.deleteAdminDeliverableService(id);
  } catch {
    return { success: false, message: 'Server error' };
  }
}
