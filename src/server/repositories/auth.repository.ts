import connectToDatabase from '@/server/config/db';
import User from '@/server/models/User';
import Team from '@/server/models/Team';
import '@/server/models/Role';

export async function getUserByUniqueIdOrEmail(identifier: string) {
  await connectToDatabase();
  const clean = (identifier || '').trim();
  if (!clean) return null;

  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = new RegExp(`^${escaped}$`, 'i');

  const user = await User.findOne({
    $or: [
      { uniqueId: clean },
      { uniqueId: cleanUpper },
      { uniqueId: reg },
      { email: cleanLower },
      { email: reg }
    ]
  }).populate('customRoleId').lean();

  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export async function getTeamByLeadEmail(leadEmail: string) {
  await connectToDatabase();
  const team = await Team.findOne({ leadEmail }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function getTeamByLeadEmailOrUniqueId(identifier: string) {
  await connectToDatabase();
  const clean = (identifier || '').trim();
  if (!clean) return null;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = new RegExp(`^${escaped}$`, 'i');
  const team = await Team.findOne({
    $or: [
      { uniqueId: clean.toUpperCase() },
      { leadEmail: reg },
      { 'members.email': reg }
    ]
  }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}

export async function findTeamForLogin(identifier: string, secret: string) {
  await connectToDatabase();
  const cleanId = (identifier || '').trim();
  const cleanSecret = (secret || '').trim();
  if (!cleanId && !cleanSecret) return null;

  const orConditions: any[] = [];
  if (cleanId) {
    const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regId = new RegExp(`^${escapedId}$`, 'i');
    orConditions.push(
      { uniqueId: cleanId.toUpperCase() },
      { leadEmail: regId },
      { 'members.email': regId }
    );
  }
  if (cleanSecret) {
    const escapedSecret = cleanSecret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regSecret = new RegExp(`^${escapedSecret}$`, 'i');
    orConditions.push(
      { uniqueId: cleanSecret.toUpperCase() },
      { leadEmail: regSecret },
      { 'members.email': regSecret }
    );
  }

  const team = await Team.findOne({ $or: orConditions }).lean();
  return team ? JSON.parse(JSON.stringify(team)) : null;
}
