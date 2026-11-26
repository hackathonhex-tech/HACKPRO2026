import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as judgeRepo from '../repositories/judge.repository';
import User from '../models/User';
import connectToDatabase from '../config/db';

export async function getJudges() {
  return await judgeRepo.findJudges();
}

export async function createJudge(body: any) {
  const { name, email, password, assessmentMode } = body;
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanName = (name || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanName) {
    throw new Error('Judge name is required.');
  }
  if (!cleanPassword) {
    throw new Error('Password is required.');
  }

  await connectToDatabase();
  if (cleanEmail) {
    const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: new RegExp(`^${escaped}$`, 'i') }
      ]
    }).lean();
    if (existing) {
      throw new Error(`Email "${email}" is already registered to judge "${(existing as any).name}". Please use a different email.`);
    }
  }

  const uniqueId = `JDG-${uuidv4().substring(0, 6).toUpperCase()}`;
  const hashedPassword = await bcrypt.hash(cleanPassword, 10);

  await judgeRepo.createJudge({
    uniqueId,
    email: cleanEmail,
    password: hashedPassword,
    role: 'judge',
    name: cleanName,
    assessmentMode: assessmentMode === 'offline' ? 'offline' : 'virtual'
  });

  return { uniqueId, name: cleanName, email: cleanEmail, assessmentMode: assessmentMode === 'offline' ? 'offline' : 'virtual' };
}

export async function updateJudge(id: string, body: any) {
  const updateData: any = {};
  if (body.name) updateData.name = body.name.trim();
  if (body.email) updateData.email = body.email.toLowerCase().trim();
  if (body.assessmentMode) {
    updateData.assessmentMode = body.assessmentMode === 'offline' ? 'offline' : 'virtual';
  }
  if (body.password && body.password.trim()) {
    updateData.password = await bcrypt.hash(body.password.trim(), 10);
  }

  const judge = await judgeRepo.updateJudge(id, updateData);
  if (!judge) throw new Error('Judge not found');
  return judge;
}

export async function deleteJudge(id: string) {
  const judge = await judgeRepo.deleteJudge(id);
  if (!judge) throw new Error('Judge not found');
  return true;
}
