import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function verifyApiAuth(requiredRole?: string | string[], requiredPermission?: string | string[]) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie) {
      return { authenticated: false, error: 'Authentication required' };
    }

    const token = tokenCookie.value;
    
    try {
      const { payload } = await jwtVerify(token, secret);
      
      // Role Check
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(payload.role as string)) {
          return { authenticated: false, error: 'Unauthorized access' };
        }
      }

      // Permission Check (Only applies to sub-admins)
      if (requiredPermission && payload.role === 'sub-admin') {
        const perms = (payload.permissions as string[]) || [];
        const reqList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

        const hasPerm = reqList.some(req => {
          if (perms.includes(req) || perms.includes('admin') || perms.includes('*')) return true;
          // Backward compatibility mappings
          if (req === 'assign_judges' && perms.includes('manage_users')) return true;
          if (req === 'attendance' && perms.includes('manage_users')) return true;
          if (req === 'round_selection' && perms.includes('manage_problems')) return true;
          if (req === 'deliverables' && perms.includes('manage_problems')) return true;
          if (req === 'hackathon_setup' && perms.includes('manage_problems')) return true;
          return false;
        });

        if (!hasPerm) {
          return { authenticated: false, error: 'Permission denied' };
        }
      }
      
      return { authenticated: true, user: payload };
    } catch {
      return { authenticated: false, error: 'Invalid or expired token' };
    }
  } catch {
    return { authenticated: false, error: 'Authentication processing failed' };
  }
}
