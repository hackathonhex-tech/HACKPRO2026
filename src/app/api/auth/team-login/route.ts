import { NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import Team from '@/server/models/Team';
import { signToken } from '@/server/middleware/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { uniqueId, pin } = await request.json();

    // uniqueId from form = lead email, pin from form = team unique ID
    const searchEmail = uniqueId?.trim();
    const searchPin = pin?.trim().toUpperCase();

    const team = await Team.findOne({ leadEmail: { $regex: new RegExp('^' + searchEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '$', 'i') } });
    
    if (!team || searchPin !== team.uniqueId.toUpperCase()) {
      return NextResponse.json({ success: false, message: 'Invalid credentials. Use your lead email and Team ID.' }, { status: 401 });
    }

    const token = signToken({ id: team._id, uniqueId: team.uniqueId, role: 'team', name: team.name });
    const response = NextResponse.json({ success: true, role: 'team' });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 });
    return response;

  } catch (error) {
    console.error('Team Login Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
