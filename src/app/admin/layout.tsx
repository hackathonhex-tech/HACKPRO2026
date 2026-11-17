"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, ClipboardList, Clock, BarChart, Scan, ClipboardCheck, FileText, Settings, Sliders, Award, FileEdit } from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { getMeAction } from '@/server/actions/auth.actions';

const adminNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'QR Scanner', href: '/admin/scanner', icon: Scan, permission: 'scanner' },
  { name: 'User Management', href: '/admin/users', icon: Users, permission: 'manage_users' },
  { name: 'Registration Setup', href: '/admin/registration-fields', icon: FileEdit, permission: 'manage_settings' },
  { name: 'Assign Judges', href: '/admin/assign', icon: Users, permission: 'assign_judges' },
  { name: 'Attendance', href: '/admin/attendance', icon: Clock, permission: 'attendance' },
  { name: 'Round Selection', href: '/admin/round-qualification', icon: Award, permission: 'round_selection' },
  { name: 'Deliverables', href: '/admin/deliverables', icon: ClipboardList, permission: 'deliverables' },
  { name: 'Evaluations', href: '/admin/evaluations', icon: ClipboardCheck, permission: 'manage_evaluations' },
  { name: 'Rubric Config', href: '/admin/rubric', icon: FileText, permission: 'manage_rubric' },
  { name: 'Hackathon Setup', href: '/admin/setup', icon: Settings, permission: 'hackathon_setup' },
  { name: 'Global Settings', href: '/admin/settings', icon: Sliders, permission: 'manage_settings' },
  { name: 'Leaderboard', href: '/leaderboard', icon: BarChart, permission: 'leaderboard' },
];

function checkPermission(perms: string[], permission?: string): boolean {
  if (!permission) return true;
  if (perms.includes(permission) || perms.includes('admin') || perms.includes('*')) return true;
  // Backward compatibility mappings
  if (permission === 'assign_judges' && perms.includes('manage_users')) return true;
  if (permission === 'attendance' && perms.includes('manage_users')) return true;
  if (permission === 'round_selection' && perms.includes('manage_problems')) return true;
  if (permission === 'deliverables' && perms.includes('manage_problems')) return true;
  if (permission === 'hackathon_setup' && perms.includes('manage_problems')) return true;
  return false;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [navItems, setNavItems] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getMeAction().then((res) => {
      if (res.success && res.user) {
        if (res.user.role === 'admin') {
          setNavItems(adminNav);
        } else if (res.user.role === 'sub-admin') {
          const perms = (res.user.permissions as string[]) || [];
          const filteredNav = adminNav.filter(item => checkPermission(perms, item.permission));
          setNavItems(filteredNav);

          // Route protection for sub-admin
          const matchedItem = adminNav.find(item => pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href)));
          if (matchedItem && matchedItem.permission && !checkPermission(perms, matchedItem.permission)) {
            if (filteredNav.length > 0) {
              router.push(filteredNav[0].href);
            } else {
              router.push('/');
            }
          } else if ((pathname === '/admin' || pathname === '/admin/dashboard') && !checkPermission(perms, 'dashboard')) {
            if (filteredNav.length > 0) {
              router.push(filteredNav[0].href);
            }
          }
        }
      }
    });
  }, [pathname, router]);

  return (
    <DashboardTemplate
      title="Admin Portal"
      subtitle="HACKPRO"
      titleIcon={ShieldCheck}
      navItems={navItems.length > 0 ? navItems : [{ name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }]}
      titleColorClass="text-[#3760F8]"
      activeColorClass="bg-[#3760F8]"
    >
      {children}
    </DashboardTemplate>
  );
}
