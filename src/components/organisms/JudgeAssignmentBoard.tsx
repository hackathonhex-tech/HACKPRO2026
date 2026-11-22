"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, Search, Settings2, X, Save, AlertCircle, Download } from 'lucide-react';
import { getTeamsAction, assignJudgesAction } from '@/server/actions/admin.team.actions';
import { getJudgesAction } from '@/server/actions/judge.actions';
import { Pagination } from '../molecules/Pagination';

export function JudgeAssignmentBoard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJudge, setFilterJudge] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  
  // Assignment Modal State
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedJudgeIds, setSelectedJudgeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    const [teamsRes, judgesRes] = await Promise.all([
      getTeamsAction(),
      getJudgesAction()
    ]);
    
    if (teamsRes.success) {
      setTeams(teamsRes.teams);
    }
    if (judgesRes.success) {
      setJudges(judgesRes.judges);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const uniqueTracks = Array.from(new Set(teams.map(t => t.problemStatementId?.track).filter(Boolean)));

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJudge = filterJudge === '' || 
      (t.assignedJudges && t.assignedJudges.some((j: any) => j._id === filterJudge));
      
    const matchesTrack = filterTrack === '' || 
      t.problemStatementId?.track === filterTrack;

    return matchesSearch && matchesJudge && matchesTrack;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const paginatedTeams = filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAssignModal = (team: any) => {
    setSelectedTeam(team);
    setSelectedJudgeIds(team.assignedJudges?.map((j: any) => j._id || j) || []);
  };

  const toggleJudgeSelection = (judgeId: string) => {
    setSelectedJudgeIds(prev => 
      prev.includes(judgeId) 
        ? prev.filter(id => id !== judgeId) 
        : [...prev, judgeId]
    );
  };

  const saveAssignments = async () => {
    if (!selectedTeam) return;
    setSaving(true);
    
    try {
      const res = await assignJudgesAction(selectedTeam._id, selectedJudgeIds);
      
      if (res.success) {
        await fetchData(); // Refresh data
        setSelectedTeam(null);
      } else {
        alert('Failed to save assignments');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving assignments');
    }
    setSaving(false);
  };

  const exportAssignmentsCSV = () => {
    const targetTeams = (searchTerm || filterJudge || filterTrack) ? filteredTeams : teams;
    const headers = ['Team Name', 'Team ID', 'Problem Statement', 'Track', 'Assigned Judges'];
    
    const rows = targetTeams.map(t => {
      const psTitle = t.problemStatementId?.title || 'N/A';
      const psTrack = t.problemStatementId?.track || 'N/A';
      const judges = t.assignedJudges?.map((j: any) => j.name).join('; ') || 'None';
      
      return [
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.uniqueId}"`,
        `"${psTitle.replace(/"/g, '""')}"`,
        `"${psTrack}"`,
        `"${judges}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackathon_judge_assignments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAssignmentsPDF = async () => {
    const targetTeams = (searchTerm || filterJudge || filterTrack) ? filteredTeams : teams;
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Judge Assignments", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Total Teams: ${targetTeams.length}`, 14, 22);
    
    const tableColumn = ["Team Name", "Team ID", "Problem Statement", "Track", "Assigned Judges"];
    const tableRows = targetTeams.map(t => {
      return [
        t.name,
        t.uniqueId,
        t.problemStatementId?.title || 'N/A',
        t.problemStatementId?.track || 'N/A',
        t.assignedJudges?.map((j: any) => j.name).join(', ') || 'None'
      ];
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save("hackathon_judge_assignments.pdf");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
            <Settings2 className="w-6 h-6 mr-3 text-indigo-500" />
            Judge Assignments
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <p className="text-sm text-slate-500">Assign judges to teams for evaluation.</p>
            <div className="flex gap-2 sm:ml-4">
              <button 
                onClick={exportAssignmentsCSV}
                className="flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3 mr-1.5" /> CSV
              </button>
              <button 
                onClick={exportAssignmentsPDF}
                className="flex items-center text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3 mr-1.5" /> PDF
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <select
            value={filterTrack}
            onChange={e => {
              setFilterTrack(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm cursor-pointer"
          >
            <option value="">All Tracks</option>
            {uniqueTracks.map((track: any) => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
          <select
            value={filterJudge}
            onChange={e => {
              setFilterJudge(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm cursor-pointer"
          >
            <option value="">All Judges</option>
            {judges.map(judge => (
              <option key={judge._id} value={judge._id}>{judge.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No teams found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTeams.map((team) => (
            <div key={team.uniqueId} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{team.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block">{team.uniqueId}</span>
                    {team.problemStatementId?.track && (
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">{team.problemStatementId.track}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    Assigned Judges ({team.assignedJudges?.length || 0})
                  </p>
                  
                  {(!team.assignedJudges || team.assignedJudges.length === 0) ? (
                    <div className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      No judges assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {team.assignedJudges.map((judge: any) => (
                        <div key={judge._id} className="flex items-center text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                          <CheckCircle className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
                          <span className="truncate">{judge.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => openAssignModal(team)}
                className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-xl transition-colors text-sm"
              >
                Manage Assignments
              </button>
            </div>
          ))}
        </div>

        {filteredTeams.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTeams.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 9, 18, 27]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50"
          />
        )}
      </>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign Judges</h3>
                  <p className="text-sm text-slate-500">Team: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTeam.name}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-2">
                {judges.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No judges found. Please create judges first.</p>
                ) : (
                  judges.map(judge => {
                    const isSelected = selectedJudgeIds.includes(judge._id);
                    return (
                      <div 
                        key={judge._id}
                        onClick={() => toggleJudgeSelection(judge._id)}
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center mr-4 transition-colors ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                            {judge.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{judge.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            judge.assessmentMode === 'offline'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}>
                            {judge.assessmentMode === 'offline' ? 'Offline' : 'Virtual'}
                          </span>
                          <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {judge.uniqueId}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 shrink-0">
                <button
                  onClick={saveAssignments}
                  disabled={saving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
