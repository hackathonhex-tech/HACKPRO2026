import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Paths that require authentication based on role
  const isAdminPath = path.startsWith('/admin');
  const isJudgePath = path.startsWith('/judge');
  const isTeamPath = path.startsWith('/team');

  if (isAdminPath || isJudgePath || isTeamPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      
      if (isAdminPath && payload.role !== 'admin' && payload.role !== 'sub-admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isJudgePath && payload.role !== 'judge') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isTeamPath && payload.role !== 'team') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/judge/:path*', '/team/:path*'],
};
