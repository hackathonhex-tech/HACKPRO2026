"use client";

import { Users, CheckCircle, Database, BarChart3, PieChart } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { StatCard } from '../molecules/StatCard';

export interface AdminDashboardBoardProps {
  stats: { totalTeams: number; totalJudges: number; checkedIn: number; totalMembers: number; membersPresent: number };
  trackData: { track: string; count: number }[];
  permissions?: string[];
}

export function AdminDashboardBoard({ stats, trackData, permissions = ['admin'] }: AdminDashboardBoardProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  // SVG Donut Chart
  const attendanceRate = stats.totalMembers > 0 ? (stats.membersPresent / stats.totalMembers) * 100 : 0;
  const absentCount = stats.totalMembers - stats.membersPresent;
  const circumference = 2 * Math.PI * 45;
  const presentArc = (attendanceRate / 100) * circumference;

  // Bar chart
  const maxTrackCount = Math.max(...trackData.map(d => d.count), 1);
  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-slate-500 mt-1">Overview of your hackathon&apos;s real-time metrics.</p>
      </div>
      
      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        {(permissions.includes('admin') || permissions.includes('dashboard') || permissions.includes('manage_users')) && (
          <>
            <motion.div variants={item}>
              <StatCard label="Teams" value={stats.totalTeams} icon={Users} colorClass="indigo" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Checked In" value={stats.checkedIn} icon={CheckCircle} colorClass="emerald" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Judges" value={stats.totalJudges} icon={Database} colorClass="amber" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Members" value={stats.totalMembers} icon={Users} colorClass="purple" />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      {(permissions.includes('admin') || permissions.includes('dashboard') || permissions.includes('manage_users')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Attendance Donut Chart */}
          <motion.div variants={item} initial="hidden" animate="show" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
            <div className="flex items-center mb-6">
              <PieChart className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Overview</h3>
            </div>
            
            {stats.totalMembers === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm italic">No members registered yet.</p>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-8">
                <div className="relative">
                  <svg width="160" height="160" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-700" />
                    {/* Present arc */}
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="#10b981" strokeWidth="10" 
                      strokeDasharray={`${presentArc} ${circumference}`} 
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-1000"
                    />
                    <text x="50" y="46" textAnchor="middle" className="fill-slate-900 dark:fill-white text-[1.4rem]" fontWeight="900">{Math.round(attendanceRate)}%</text>
                    <text x="50" y="60" textAnchor="middle" className="fill-slate-500 text-[0.55rem]" fontWeight="600">PRESENT</text>
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Present</p>
                      <p className="text-xs text-slate-500">{stats.membersPresent} members</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Absent</p>
                      <p className="text-xs text-slate-500">{absentCount} members</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Teams by Track Bar Chart */}
          <motion.div variants={item} initial="hidden" animate="show" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Teams by Track</h3>
            </div>
            
            {trackData.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm italic">No track data yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trackData.map((d, i) => (
                  <div key={d.track} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{d.track}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{d.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / maxTrackCount) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                        className="h-full rounded-full group-hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: barColors[i % barColors.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Empty State for limited permissions */}
      {!(permissions.includes('admin') || permissions.includes('dashboard') || permissions.includes('manage_users')) && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-8">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Welcome to your Dashboard</h3>
          <p className="text-slate-500">Use the sidebar to navigate to the tools you have access to.</p>
        </div>
      )}
    </div>
  );
}
