import { NextResponse } from 'next/server';
import connectToDatabase from '@/server/config/db';
import * as AuthService from '@/server/services/auth.service';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { uniqueId, pin } = await request.json();

    const result = await AuthService.loginTeam(uniqueId, pin);
    if (!result.success || !result.token) {
      return NextResponse.json({ success: false, message: result.message || 'Invalid credentials.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, role: 'team', isLead: result.isLead });
    response.cookies.set('token', result.token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 
    });
    return response;

  } catch (error) {
    console.error('Team Login Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
