import { NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import bcrypt from 'bcrypt';
import { signToken } from '@/server/middleware/auth';
import { getUserByUniqueIdOrEmail } from '@/server/repositories/auth.repository';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { uniqueId, password } = await request.json();

    const cleanId = (uniqueId || '').trim();
    const cleanPassword = (password || '').trim();

    const user = await getUserByUniqueIdOrEmail(cleanId);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch && user.password !== cleanPassword) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: user._id, uniqueId: user.uniqueId, role: user.role, name: user.name });
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 });
    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
