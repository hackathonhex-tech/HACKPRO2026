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
  const trimmedEmail = email ? email.toLowerCase().trim() : '';

  await connectToDatabase();
  if (trimmedEmail) {
    const existing = await User.findOne({ email: trimmedEmail }).lean();
    if (existing) {
      throw new Error(`Email "${email}" is already registered to judge "${(existing as any).name}". Please use a different email.`);
    }
  }

  const uniqueId = `JDG-${uuidv4().substring(0, 6).toUpperCase()}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  await judgeRepo.createJudge({
    uniqueId,
    email: trimmedEmail,
    password: hashedPassword,
    role: 'judge',
    name: name.trim(),
    assessmentMode: assessmentMode === 'offline' ? 'offline' : 'virtual'
  });

  return { uniqueId, name, email: trimmedEmail, assessmentMode: assessmentMode === 'offline' ? 'offline' : 'virtual' };
}

export async function updateJudge(id: string, body: any) {
  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.email) updateData.email = body.email;
  if (body.assessmentMode) {
    updateData.assessmentMode = body.assessmentMode === 'offline' ? 'offline' : 'virtual';
  }
  if (body.password) {
    updateData.password = await bcrypt.hash(body.password, 10);
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
