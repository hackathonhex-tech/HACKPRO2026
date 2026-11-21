import { getUserByUniqueIdOrEmail, getTeamByLeadEmailOrUniqueId } from '../repositories/auth.repository';
import Round from '../models/Round';

export async function loginTeam(identifier: string, secret: string) {
  const team = await getTeamByLeadEmailOrUniqueId(identifier);
  if (!team) {
    return { success: false, message: 'Invalid credentials' };
  }

  const isValidSecret = (team.uniqueId === secret || team.leadEmail?.toLowerCase() === secret.toLowerCase());
  if (!isValidSecret) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Check if there is an active round restricting team access
  const activeRound = await Round.findOne({ isActive: true }).lean();
  if (activeRound && Array.isArray(activeRound.allowedTeamIds)) {
    const teamIdStr = team._id.toString();
    const isAllowed = activeRound.allowedTeamIds.some((id: any) => id.toString() === teamIdStr);
    if (!isAllowed) {
      return { 
        success: false, 
        message: `Access Denied: Your team (${team.name}) is not qualified to enter ${activeRound.name}. Please contact the organizers.` 
      };
    }
  }

  const token = signToken({ id: team._id, uniqueId: team.uniqueId, role: 'team', name: team.name });
  return { success: true, token, role: 'team' };
}
import bcrypt from 'bcrypt';
import { signToken } from '@/server/middleware/auth';

export async function loginStaff(uniqueId: string, password: string) {
  const envAdminUniqueId = process.env.ADMIN_UNIQUE_ID || 'admin';
  const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@hackathon.com';
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  const isEnvAdminMatch = (
    uniqueId.trim().toLowerCase() === envAdminUniqueId.trim().toLowerCase() ||
    uniqueId.trim().toLowerCase() === envAdminEmail.trim().toLowerCase()
  );

  // If attempting to log in as primary Admin
  if (isEnvAdminMatch) {
    if (envAdminPassword && password !== envAdminPassword) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    let user = await getUserByUniqueIdOrEmail(uniqueId);
    if (!user) {
      user = await getUserByUniqueIdOrEmail('admin');
    }
    const token = signToken({
      id: user ? user._id : 'admin_root',
      uniqueId: user ? user.uniqueId : envAdminUniqueId,
      role: 'admin',
      name: user ? user.name : 'System Administrator',
      permissions: ['all']
    });
    return { success: true, token, role: 'admin' };
  }

  const user = await getUserByUniqueIdOrEmail(uniqueId);
  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  // If user role in DB is admin, strictly require process.env.ADMIN_PASSWORD
  if (user.role === 'admin') {
    if (envAdminPassword && password !== envAdminPassword) {
      return { success: false, message: 'Invalid credentials' };
    }
  } else {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }
  }

  let finalPermissions = user.permissions || [];
  if (user.customRoleId && user.customRoleId.permissions) {
    finalPermissions = user.customRoleId.permissions;
  }

  const token = signToken({
    id: user._id,
    uniqueId: user.uniqueId,
    role: user.role,
    name: user.name,
    assessmentMode: user.assessmentMode || 'virtual',
    permissions: finalPermissions
  });

  return { success: true, token, role: user.role };
}


