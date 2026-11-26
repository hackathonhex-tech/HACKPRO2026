import { getUserByUniqueIdOrEmail, findTeamForLogin } from '../repositories/auth.repository';
import Round from '../models/Round';

export async function loginTeam(identifier: string, secret: string) {
  const cleanId = (identifier || '').trim();
  const cleanSecret = (secret || '').trim();

  if (!cleanId || !cleanSecret) {
    return { success: false, message: 'Please provide both your Email / Login ID and Password / Team Code.' };
  }

  const team = await findTeamForLogin(cleanId, cleanSecret);
  if (!team) {
    return { success: false, message: 'Invalid credentials. No team found with the provided details.' };
  }

  const teamUniqueId = (team.uniqueId || '').toUpperCase();
  const isCodeInId = cleanId.toUpperCase() === teamUniqueId;
  const isCodeInSecret = cleanSecret.toUpperCase() === teamUniqueId;
  const isLegacyLeadSecret = team.leadEmail && cleanSecret.toLowerCase() === team.leadEmail.toLowerCase();

  if (!isCodeInId && !isCodeInSecret && !isLegacyLeadSecret) {
    return { success: false, message: 'Invalid credentials. Incorrect Team Code or Password.' };
  }

  // Determine which entered value represents the user email
  let enteredEmail = '';
  if (isCodeInSecret && !isCodeInId) {
    enteredEmail = cleanId;
  } else if (isCodeInId && !isCodeInSecret) {
    enteredEmail = cleanSecret;
  } else if (isLegacyLeadSecret) {
    enteredEmail = cleanId;
  }

  let isLead = false;
  let userEmail = '';
  let userName = '';

  if (!enteredEmail) {
    // Fallback if both inputs are the team code
    isLead = true;
    userEmail = team.leadEmail;
    userName = team.leadName;
  } else if (team.leadEmail && enteredEmail.toLowerCase() === team.leadEmail.toLowerCase()) {
    isLead = true;
    userEmail = team.leadEmail;
    userName = team.leadName;
  } else {
    // Check if entered email matches any team member
    const matchedMember = (team.members || []).find(
      (m: any) => m.email && m.email.trim().toLowerCase() === enteredEmail.toLowerCase()
    );

    if (matchedMember) {
      isLead = false;
      userEmail = matchedMember.email.trim();
      userName = matchedMember.name || 'Team Member';
    } else {
      return { 
        success: false, 
        message: 'Invalid credentials. The entered email is not registered with this team.' 
      };
    }
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

  const token = signToken({ 
    id: team._id.toString(), 
    uniqueId: team.uniqueId, 
    role: 'team', 
    name: team.name,
    email: userEmail,
    memberName: userName,
    isLead
  });

  return { success: true, token, role: 'team', isLead };
}
import bcrypt from 'bcrypt';
import { signToken } from '@/server/middleware/auth';

export async function loginStaff(uniqueId: string, password: string) {
  const cleanId = (uniqueId || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanId || !cleanPassword) {
    return { success: false, message: 'Please enter both Email/ID and Password.' };
  }

  const envAdminUniqueId = process.env.ADMIN_UNIQUE_ID || 'admin';
  const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@hackathon.com';
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  const isEnvAdminMatch = (
    cleanId.toLowerCase() === envAdminUniqueId.toLowerCase() ||
    cleanId.toLowerCase() === envAdminEmail.toLowerCase()
  );

  // If attempting to log in as primary Admin
  if (isEnvAdminMatch) {
    if (envAdminPassword && cleanPassword !== envAdminPassword) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    let user = await getUserByUniqueIdOrEmail(cleanId);
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

  const user = await getUserByUniqueIdOrEmail(cleanId);
  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  let isMatch = false;

  // 1. Check database hashed password via bcrypt
  if (user.password) {
    try {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    } catch {
      isMatch = false;
    }
    // Plain-text fallback if unhashed
    if (!isMatch && user.password === cleanPassword) {
      isMatch = true;
    }
  }

  // 2. Fallback: if user has admin role in DB and entered envAdminPassword
  if (!isMatch && user.role === 'admin' && envAdminPassword && cleanPassword === envAdminPassword) {
    isMatch = true;
  }

  if (!isMatch) {
    return { success: false, message: 'Invalid credentials' };
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

  return { 
    success: true, 
    token, 
    role: user.role, 
    assessmentMode: user.assessmentMode || 'virtual' 
  };
}


