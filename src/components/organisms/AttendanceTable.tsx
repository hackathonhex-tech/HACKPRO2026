"use client";

import { useState } from 'react';
import { Check, X, Search, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '../molecules/Pagination';

export interface AttendanceTableProps {
  teams: any[];
  loading: boolean;
  onRefresh: () => void;
  onToggleMemberAttendance: (teamId: string, memberIndex: number, currentStatus: boolean) => Promise<void>;
  onMarkAllMembers: (team: any, status: boolean) => Promise<void>;
}

export function AttendanceTable({ teams, loading, onToggleMemberAttendance, onMarkAllMembers }: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.leadName && t.leadName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedTeams = filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPresentCount = (team: any) => {
    return team.members?.filter((m: any) => m.attendance).length || 0;
  };

  const exportAttendanceCSV = () => {
    const headers = [
      'Team ID',
      'Team Name',
      'College',
      'Department',
      'Problem Statement Title',
      'Track',
      'Member Role',
      'Student Name',
      'Superset ID',
      'Email',
      'Phone',
      'Attendance Status'
    ];

    const rows: string[] = [];

    teams.forEach(t => {
      const psTitle = t.problemStatementId?.title || 'Not Selected';
      const psTrack = t.problemStatementId?.track || 'N/A';

      if (t.members && t.members.length > 0) {
        t.members.forEach((m: any, idx: number) => {
          const isLead = (m.email && m.email === t.leadEmail) || (m.name === t.leadName && idx === 0);
          const role = isLead ? 'Team Lead' : `Member ${idx + 1}`;
          const supersetId = m.supersetId || (isLead ? (t.leadSupersetId || t.supersetId || '') : '');
          
          rows.push([
            t.uniqueId,
            `"${(t.name || '').replace(/"/g, '""')}"`,
            `"${(t.collegeName || '').replace(/"/g, '""')}"`,
            `"${(t.department || '').replace(/"/g, '""')}"`,
            `"${(psTitle || '').replace(/"/g, '""')}"`,
            `"${(psTrack || '').replace(/"/g, '""')}"`,
            `"${role}"`,
            `"${(m.name || '').replace(/"/g, '""')}"`,
            `"${(supersetId || '').replace(/"/g, '""')}"`,
            `"${(m.email || '').replace(/"/g, '""')}"`,
            `"${(m.phone || m.contact || '').replace(/"/g, '""')}"`,
            m.attendance ? 'PRESENT' : 'ABSENT'
          ].join(','));
        });
      } else {
        rows.push([
          t.uniqueId,
          `"${(t.name || '').replace(/"/g, '""')}"`,
          `"${(t.collegeName || '').replace(/"/g, '""')}"`,
          `"${(t.department || '').replace(/"/g, '""')}"`,
          `"${(psTitle || '').replace(/"/g, '""')}"`,
          `"${(psTrack || '').replace(/"/g, '""')}"`,
          '"Team Lead"',
          `"${(t.leadName || '').replace(/"/g, '""')}"`,
          `"${(t.leadSupersetId || t.supersetId || '').replace(/"/g, '""')}"`,
          `"${(t.leadEmail || '').replace(/"/g, '""')}"`,
          `"${(t.leadPhone || '').replace(/"/g, '""')}"`,
          t.attendance ? 'PRESENT' : 'ABSENT'
        ].join(','));
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackathon_student_attendance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendancePDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Hackathon Student Attendance Report", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const totalStudents = teams.reduce((acc, t) => acc + (t.members?.length || 1), 0);
    const totalPresent = teams.reduce((acc, t) => acc + (t.members?.filter((m: any) => m.attendance).length || (t.attendance ? 1 : 0)), 0);
    doc.text(`Total Teams: ${teams.length} | Total Students: ${totalStudents} | Present: ${totalPresent} | Absent: ${totalStudents - totalPresent} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableRows: any[] = [];
    teams.forEach(t => {
      const psTitle = t.problemStatementId ? `${t.problemStatementId.title} (${t.problemStatementId.track || 'Track N/A'})` : 'Not Selected';
      if (t.members && t.members.length > 0) {
        t.members.forEach((m: any, idx: number) => {
          const isLead = (m.email && m.email === t.leadEmail) || (m.name === t.leadName && idx === 0);
          const role = isLead ? 'Team Lead' : `Member ${idx + 1}`;
          const supersetId = m.supersetId || (isLead ? (t.leadSupersetId || t.supersetId || '—') : '—');
          
          tableRows.push([
            t.uniqueId,
            t.name,
            t.collegeName || '—',
            role,
            m.name || '—',
            supersetId,
            m.email || '—',
            m.phone || m.contact || '—',
            psTitle,
            m.attendance ? 'PRESENT' : 'ABSENT'
          ]);
        });
      } else {
        tableRows.push([
          t.uniqueId,
          t.name,
          t.collegeName || '—',
          'Team Lead',
          t.leadName || '—',
          t.leadSupersetId || t.supersetId || '—',
          t.leadEmail || '—',
          t.leadPhone || '—',
          psTitle,
          t.attendance ? 'PRESENT' : 'ABSENT'
        ]);
      }
    });

    autoTable(doc, {
      head: [['Team ID', 'Team Name', 'College', 'Role', 'Student Name', 'Superset ID', 'Email', 'Phone', 'Problem Statement', 'Status']],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 8) {
          if (data.cell.raw === 'PRESENT') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save("hackathon_student_attendance.pdf");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Attendance Management</h2>
          <p className="text-slate-500 mt-1">Track individual member check-ins for each team.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by team, ID, lead..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white shadow-sm"
            />
          </div>

          <button
            onClick={exportAttendanceCSV}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>

          <button
            onClick={exportAttendancePDF}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Teams</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{teams.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">All Present</p>
          <p className="text-2xl font-black text-emerald-600">{teams.filter(t => t.attendance).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Members</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Members Present</p>
          <p className="text-2xl font-black text-emerald-600">{teams.reduce((acc, t) => acc + getPresentCount(t), 0)}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-xs animate-pulse flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-500 italic">No teams found.</p>
          </div>
        ) : (
          paginatedTeams.map(team => (
            <div key={team._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
              {/* Team Header Row */}
              <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${team.attendance ? 'bg-emerald-500' : getPresentCount(team) > 0 ? 'bg-amber-500' : 'bg-red-400'}`}></div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{team.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{team.uniqueId}</span>
                      {team.leadName && <span className="ml-2">· Lead: {team.leadName}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                    team.attendance 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                      : getPresentCount(team) > 0 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {getPresentCount(team)}/{team.members?.length || 0} Present
                  </span>
                  {expandedTeam === team._id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Member List */}
              <AnimatePresence>
                {expandedTeam === team._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 dark:border-slate-700/50 px-5 pb-5">
                      {/* Quick Actions */}
                      <div className="flex items-center justify-end space-x-3 py-3 border-b border-slate-100 dark:border-slate-700/50 mb-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onMarkAllMembers(team, true); }}
                          className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition"
                        >
                          Mark All Present
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onMarkAllMembers(team, false); }}
                          className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition"
                        >
                          Mark All Absent
                        </button>
                      </div>

                      {/* Members (Lead is first member) */}
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">All Members</p>
                      <div className="space-y-2">
                        {team.members?.map((member: any, idx: number) => {
                          const isLead = member.email === team.leadEmail;
                          return (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isLead ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50'}`}>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">
                                  {member.name}
                                  {isLead && <span className="ml-2 text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded">LEAD</span>}
                                </p>
                                <p className="text-xs text-slate-500">{member.email || member.contact || '—'} {member.college && `· ${member.college}`}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); onToggleMemberAttendance(team._id, idx, member.attendance); }}
                                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                  member.attendance 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400'
                                }`}
                              >
                                {member.attendance ? <><Check className="w-4 h-4 mr-1.5" /> Present</> : <><X className="w-4 h-4 mr-1.5" /> Absent</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {filteredTeams.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTeams.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50"
        />
      )}
    </motion.div>
  );
}
