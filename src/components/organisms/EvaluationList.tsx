"use client";

import React, { useState } from 'react';
import { Download, FileText, Star, User, Users, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../atoms/Button';
import { SearchInput } from '../molecules/SearchInput';
import { Pagination } from '../molecules/Pagination';
import { getTeamsAction } from '@/server/actions/admin.team.actions';
import { resetEvaluationAction } from '@/server/actions/evaluation.actions';
import { getAllDeliverablesAction } from '@/server/actions/team.actions';

export interface EvaluationListProps {
  evaluations: any[];
  teams?: any[];
  loading: boolean;
  onRefresh?: () => void;
}

export function EvaluationList({ evaluations, teams = [], loading, onRefresh }: EvaluationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRound, setFilterRound] = useState('');
  const [filterJudge, setFilterJudge] = useState('');
  const [filterProblem, setFilterProblem] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'evaluations' | 'missing'>('evaluations');
  
  // Expanded row tabs: 'team' | 'lead' | 'member_0' | etc.
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [resettingId, setResettingId] = useState<string | null>(null);

  const handleResetEvaluation = async (e: React.MouseEvent, evaluationId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to reset and delete this evaluation? This cannot be undone.')) return;
    
    setResettingId(evaluationId);
    try {
      const res = await resetEvaluationAction(evaluationId);
      if (res.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(res.message || 'Failed to reset evaluation');
      }
    } catch (err) {
      console.error(err);
      alert('Error resetting evaluation');
    }
    setResettingId(null);
  };

  const uniqueRounds = Array.from(new Set(evaluations.map(e => e.roundId?.name).filter(Boolean)));
  const uniqueJudges = Array.from(new Set(evaluations.map(e => e.judgeId?.name).filter(Boolean)));
  const uniqueProblems = Array.from(new Set(evaluations.map(e => e.teamId?.problemStatementId?.title).filter(Boolean)));

  const filteredEvaluations = evaluations.filter(ev => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      ev.teamId?.name?.toLowerCase().includes(searchLower) ||
      ev.teamId?.uniqueId?.toLowerCase().includes(searchLower) ||
      ev.judgeId?.name?.toLowerCase().includes(searchLower)
    );
    const matchesRound = filterRound ? ev.roundId?.name === filterRound : true;
    const matchesJudge = filterJudge ? ev.judgeId?.name === filterJudge : true;
    const matchesProblem = filterProblem ? ev.teamId?.problemStatementId?.title === filterProblem : true;
    
    return matchesSearch && matchesRound && matchesJudge && matchesProblem;
  });

  const relevantTeams = teams.filter(t => {
    // Hide incomplete registrations that haven't selected a problem statement yet
    if (!t.problemStatementId) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      t.name?.toLowerCase().includes(searchLower) ||
      t.uniqueId?.toLowerCase().includes(searchLower)
    );
    const matchesProblem = filterProblem ? t.problemStatementId?.title === filterProblem : true;
    // We only consider present teams if attendance is marked, but let's assume we want to track all registered teams that match filters
    return matchesSearch && matchesProblem;
  });

  // A team is evaluated if they have at least one evaluation in the filtered set
  const evaluatedTeamIds = new Set(filteredEvaluations.map(e => e.teamId?._id?.toString() || e.teamId));
  const missingTeams = relevantTeams.filter(t => !evaluatedTeamIds.has(t._id?.toString()));

  // Pagination
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(10);
  const [missingPage, setMissingPage] = useState(1);
  const [missingPageSize, setMissingPageSize] = useState(10);

  const paginatedEvaluations = filteredEvaluations.slice((evalPage - 1) * evalPageSize, evalPage * evalPageSize);
  const paginatedMissingTeams = missingTeams.slice((missingPage - 1) * missingPageSize, missingPage * missingPageSize);

  const exportCSV = () => {
    const headers = ['Team ID', 'Team Name', 'College', 'Track', 'Problem Statement', 'Judge', 'Round', 'Total Score', 'Team Rubric Score', 'Member Scores', 'Private Comment', 'Public Feedback'];
    const csvContent = [
      headers.join(','),
      ...filteredEvaluations.map(ev => {
        const teamScore = ev.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0) || 0;
        const memberDetails = ev.memberScores?.map((m: any) => `${m.name}: ${m.totalScore}`).join(' | ') || 'None';
        return [
          ev.teamId?.uniqueId || '',
          `"${(ev.teamId?.name || '').replace(/"/g, '""')}"`,
          `"${(ev.teamId?.collegeName || ev.teamId?.members?.[0]?.college || '').replace(/"/g, '""')}"`,
          `"${(ev.teamId?.problemStatementId?.track || 'N/A').replace(/"/g, '""')}"`,
          `"${(ev.teamId?.problemStatementId?.title || 'N/A').replace(/"/g, '""')}"`,
          `"${(ev.judgeId?.name || '').replace(/"/g, '""')}"`,
          `"${(ev.roundId?.name || '').replace(/"/g, '""')}"`,
          ev.totalScore || 0,
          teamScore,
          `"${memberDetails}"`,
          `"${(ev.comment || '').replace(/"/g, '""')}"`,
          `"${(ev.publicFeedback || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackathon_evaluations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isExportingDetails, setIsExportingDetails] = useState(false);

  const exportDetailsCSV = async () => {
    setIsExportingDetails(true);
    try {
      const res = await getAllDeliverablesAction();
      const deliverables = res.success && 'deliverables' in res ? (res.deliverables as any[]) || [] : [];
      
      const headers = ['Team ID', 'Team Name', 'College', 'Track', 'Problem Statement', 'Judge', 'Round', 'Total Score', 'Team Rubric Score', 'Member Scores', 'Private Comment', 'Public Feedback', 'GitHub Repo', 'Pitch Deck', 'Demo Video / Website Link'];
      
      const csvContent = [
        headers.join(','),
        ...filteredEvaluations.map(ev => {
          const teamScore = ev.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0) || 0;
          const memberDetails = ev.memberScores?.map((m: any) => `${m.name}: ${m.totalScore}`).join(' | ') || 'None';
          
          // Match by ID handling possible ObjectId objects or strings
          const teamId = ev.teamId?._id?.toString() || ev.teamId?.toString();
          const roundId = ev.roundId?._id?.toString() || ev.roundId?.toString();
          
          const deliverable = deliverables.find((d: any) => 
            (d.teamId?._id?.toString() || d.teamId?.toString()) === teamId && 
            (d.roundId?._id?.toString() || d.roundId?.toString()) === roundId
          );
          
          return [
            ev.teamId?.uniqueId || '',
            `"${(ev.teamId?.name || '').replace(/"/g, '""')}"`,
            `"${(ev.teamId?.collegeName || ev.teamId?.members?.[0]?.college || '').replace(/"/g, '""')}"`,
            `"${(ev.teamId?.problemStatementId?.track || 'N/A').replace(/"/g, '""')}"`,
            `"${(ev.teamId?.problemStatementId?.title || 'N/A').replace(/"/g, '""')}"`,
            `"${(ev.judgeId?.name || '').replace(/"/g, '""')}"`,
            `"${(ev.roundId?.name || '').replace(/"/g, '""')}"`,
            ev.totalScore || 0,
            teamScore,
            `"${memberDetails}"`,
            `"${(ev.comment || '').replace(/"/g, '""')}"`,
            `"${(ev.publicFeedback || '').replace(/"/g, '""')}"`,
            `"${(deliverable?.githubLink || '').replace(/"/g, '""')}"`,
            `"${(deliverable?.deckUrl || '').replace(/"/g, '""')}"`,
            `"${(deliverable?.videoLink || '').replace(/"/g, '""')}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hackathon_evaluations_with_links.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to export detailed results.");
    } finally {
      setIsExportingDetails(false);
    }
  };

  const exportDetailsPDF = async () => {
    setIsExportingDetails(true);
    try {
      const res = await getAllDeliverablesAction();
      const deliverables = res.success && 'deliverables' in res ? (res.deliverables as any[]) || [] : [];

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('landscape');
      doc.text("Evaluations with Deliverable Links", 14, 15);
      
      autoTable(doc, {
        startY: 20,
        head: [['Team', 'Total', 'GitHub Repo', 'Pitch Deck', 'Demo Video / Website']],
        body: filteredEvaluations.map(ev => {
          const teamId = ev.teamId?._id?.toString() || ev.teamId?.toString();
          const roundId = ev.roundId?._id?.toString() || ev.roundId?.toString();
          
          const deliverable = deliverables.find((d: any) => 
            (d.teamId?._id?.toString() || d.teamId?.toString()) === teamId && 
            (d.roundId?._id?.toString() || d.roundId?.toString()) === roundId
          );

          return [
            `${ev.teamId?.name}\n(${ev.teamId?.uniqueId})`,
            ev.totalScore?.toString() || '0',
            deliverable?.githubLink || 'None',
            deliverable?.deckUrl || 'None',
            deliverable?.videoLink || 'None'
          ];
        }),
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          2: { cellWidth: 70 },
          3: { cellWidth: 70 },
          4: { cellWidth: 70 }
        }
      });
      doc.save('hackathon_evaluations_with_links.pdf');
    } catch (e) {
      console.error(e);
      alert("Failed to export detailed results.");
    } finally {
      setIsExportingDetails(false);
    }
  };

  const exportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('landscape');
    doc.text("Hackathon Evaluations Details", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Team', 'College', 'Track', 'Judge', 'Round', 'Total', 'Team Score', 'Members', 'Comments']],
      body: filteredEvaluations.map(ev => {
        const teamScore = ev.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0) || 0;
        const memberDetails = ev.memberScores?.map((m: any) => `${m.name.split(' ')[0]}: ${m.totalScore}`).join('\n') || 'None';
        return [
          `${ev.teamId?.name}\n(${ev.teamId?.uniqueId})`,
          ev.teamId?.collegeName || ev.teamId?.members?.[0]?.college || '-',
          ev.teamId?.problemStatementId?.track || '-',
          ev.judgeId?.name || 'Unknown',
          ev.roundId?.name || 'Unknown',
          ev.totalScore?.toString() || '0',
          teamScore.toString(),
          memberDetails,
          ev.comment || '-'
        ];
      })
    });
    doc.save('hackathon_evaluations.pdf');
  };

  const exportBlankFormCSV = async () => {
    try {
      const res = await getTeamsAction();
      if (!res.success) throw new Error("Failed to fetch teams");
      
      const presentTeams = res.teams.filter((t: any) => t.attendance);
      
      const headers = [
        'Team ID', 'Team Name', 'College', 'Superset ID(s)', 'Problem Statement', 'Track',
        'Innovation and creativity', 'Business impact and relevant', 'Presentation', 'Technical depth',
        'Overall Score', 'Feedback'
      ];
      
      // Group by track
      const teamsByTrack = presentTeams.reduce((acc: any, team: any) => {
        const track = team.problemStatementId?.track || 'Unassigned';
        if (!acc[track]) acc[track] = [];
        acc[track].push(team);
        return acc;
      }, {});
      
      const sortedTracks = Object.keys(teamsByTrack).sort();
      
      const rows: string[] = [];
      sortedTracks.forEach(track => {
        teamsByTrack[track].forEach((t: any) => {
          const supersetIds = t.members?.map((m: any) => m.supersetId || '').filter(Boolean).join('; ') || t.supersetId || '';
          
          rows.push([
            t.uniqueId,
            `"${(t.name || '').replace(/"/g, '""')}"`,
            `"${(t.collegeName || '').replace(/"/g, '""')}"`,
            `"${supersetIds}"`,
            `"${(t.problemStatementId?.title || 'N/A').replace(/"/g, '""')}"`,
            `"${track}"`,
            '', // Innovation
            '', // Business
            '', // Presentation
            '', // Technical
            '', // Overall
            ''  // Feedback
          ].join(','));
        });
      });
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hackathon_blank_evaluation_forms.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to export blank forms.");
    }
  };

  const exportBlankFormPDF = async () => {
    try {
      const res = await getTeamsAction();
      if (!res.success) throw new Error("Failed to fetch teams");
      
      const presentTeams = res.teams.filter((t: any) => t.attendance);
      
      // Group by track
      const teamsByTrack = presentTeams.reduce((acc: any, team: any) => {
        const track = team.problemStatementId?.track || 'Unassigned';
        if (!acc[track]) acc[track] = [];
        acc[track].push(team);
        return acc;
      }, {});
      
      const sortedTracks = Object.keys(teamsByTrack).sort();
      
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('landscape');
      
      const headers = [
        'Team ID', 'Team Name', 'College', 'Superset ID(s)', 'Problem Statement',
        'Innovation', 'Business', 'Presentation', 'Technical',
        'Overall', 'Feedback'
      ];
      
      let isFirstPage = true;
      
      sortedTracks.forEach(track => {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;
        
        doc.setFontSize(16);
        doc.text(`Blank Evaluation Form - ${track}`, 14, 15);
        
        const tableRows = teamsByTrack[track].map((t: any) => {
          const supersetIds = t.members?.map((m: any) => m.supersetId || '').filter(Boolean).join(',\n') || t.supersetId || '';
          
          return [
            t.uniqueId,
            t.name,
            t.collegeName || '-',
            supersetIds,
            t.problemStatementId?.title || 'N/A',
            '', // Innovation
            '', // Business
            '', // Presentation
            '', // Technical
            '', // Overall
            ''  // Feedback
          ];
        });
        
        autoTable(doc, {
          startY: 20,
          head: [headers],
          body: tableRows,
          styles: { fontSize: 8, minCellHeight: 25 }, // taller cells for writing
          columnStyles: {
            5: { cellWidth: 20 }, // Innovation
            6: { cellWidth: 20 }, // Business
            7: { cellWidth: 20 }, // Presentation
            8: { cellWidth: 20 }, // Technical
            9: { cellWidth: 20 }, // Overall
            10: { cellWidth: 40 } // Feedback
          }
        });
      });
      
      doc.save('hackathon_blank_evaluation_forms.pdf');
    } catch (e) {
      console.error(e);
      alert("Failed to export blank forms.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Evaluations</h2>
          <p className="text-slate-500 mt-1">Review and export judges&apos; marks and feedback.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportBlankFormCSV} title="Empty template for offline judging">
            Blank Form CSV
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={exportBlankFormPDF} title="Empty template for offline judging">
            Blank Form PDF
          </Button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block self-center mx-2"></div>
          <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportCSV}>
            Results CSV
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Download className={`w-4 h-4 ${isExportingDetails ? 'animate-bounce' : ''}`} />} onClick={exportDetailsCSV} disabled={isExportingDetails}>
            Details CSV
          </Button>
          <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={exportPDF}>
            Results PDF
          </Button>
          <Button variant="primary" size="sm" leftIcon={<FileText className={`w-4 h-4 ${isExportingDetails ? 'animate-bounce' : ''}`} />} onClick={exportDetailsPDF} disabled={isExportingDetails}>
            Details PDF
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by Team Name, ID, or Judge Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Rounds</option>
              {uniqueRounds.map((r: any) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            
            <select
              value={filterJudge}
              onChange={(e) => setFilterJudge(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Judges</option>
              {uniqueJudges.map((j: any) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            
            <select
              value={filterProblem}
              onChange={(e) => setFilterProblem(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs truncate"
            >
              <option value="">All Problem Statements</option>
              {uniqueProblems.map((p: any) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Teams</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{relevantTeams.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Evaluated Teams</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{evaluatedTeamIds.size}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Pending Teams</p>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{missingTeams.length}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 px-2 gap-6">
        <button 
          onClick={() => setViewMode('evaluations')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 ${viewMode === 'evaluations' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Completed Evaluations
        </button>
        <button 
          onClick={() => setViewMode('missing')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 ${viewMode === 'missing' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Pending Teams ({missingTeams.length})
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'evaluations' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Judge</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Round</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comments</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg ml-auto"></div></td>
                    </tr>
                  ))}
                </>
              ) : filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No evaluations found.
                  </td>
                </tr>
              ) : (
                paginatedEvaluations.map((ev) => (
                  <React.Fragment key={ev._id}>
                    <tr 
                      onClick={() => setExpandedId(expandedId === ev._id ? null : ev._id)}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{ev.teamId?.name || 'Unknown'}</p>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{ev.teamId?.uniqueId}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {ev.judgeId?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {ev.roundId?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {ev.isFlagged ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">Flagged</span>
                        ) : ev.isLocked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">Submitted</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-full font-bold">
                          <Star className="w-3 h-3 mr-1" />
                          {ev.totalScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={ev.comment}>
                        {ev.comment || <span className="text-slate-400 italic">No comments</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => handleResetEvaluation(e, ev._id)}
                          disabled={resettingId === ev._id}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset / Delete Evaluation"
                        >
                          {resettingId === ev._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === ev._id && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <td colSpan={7} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left Col: Scores Breakdown */}
                            <div>
                              <div className="flex flex-wrap gap-2 mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 p-1.5 rounded-xl">
                                <button
                                  onClick={() => setActiveTab({...activeTab, [ev._id]: 'team'})}
                                  className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${(!activeTab[ev._id] || activeTab[ev._id] === 'team') ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                  <Users className="w-3 h-3 mr-1" /> Team
                                </button>
                                {ev.memberScores?.map((ms: any) => (
                                  <button
                                    key={ms.memberId}
                                    onClick={() => setActiveTab({...activeTab, [ev._id]: ms.memberId})}
                                    className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${activeTab[ev._id] === ms.memberId ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                    title={ms.name}
                                  >
                                    <User className="w-3 h-3 mr-1" /> {ms.name?.split(' ')[0]}
                                  </button>
                                ))}
                              </div>

                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-900 dark:text-white">
                                  Score Breakdown
                                </h4>
                                {(!activeTab[ev._id] || activeTab[ev._id] === 'team') ? (
                                  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold">
                                    Total: {ev.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0)?.toFixed(2) || 0}
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold">
                                    Total: {ev.memberScores?.find((m: any) => m.memberId === activeTab[ev._id])?.totalScore?.toFixed(2) || 0}
                                  </span>
                                )}
                              </div>
                              
                              {(!activeTab[ev._id] || activeTab[ev._id] === 'team') ? (
                                ev.rubricId?.criteria ? (
                                  <div className="space-y-3 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                    {ev.rubricId.criteria.map((crit: any) => {
                                      const matchingScore = ev.scores?.find((s: any) => s.criterionId === crit._id);
                                      const scoreValue = matchingScore ? matchingScore.score : 0;
                                      const percentage = (scoreValue / 5) * 100;
                                      
                                      return (
                                        <div key={crit._id}>
                                          <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{crit.name}</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{scoreValue} <span className="text-slate-400 text-xs">/ 5</span></span>
                                          </div>
                                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic">No criteria data found.</p>
                                )
                              ) : (
                                ev.roundId?.activeMemberRubricId?.criteria ? (
                                  <div className="space-y-3 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                    {ev.roundId.activeMemberRubricId.criteria.map((crit: any) => {
                                      const memberScoreData = ev.memberScores?.find((m: any) => m.memberId === activeTab[ev._id]);
                                      const matchingScore = memberScoreData?.scores?.find((s: any) => s.criterionId === crit._id);
                                      const scoreValue = matchingScore ? matchingScore.score : 0;
                                      const percentage = (scoreValue / 5) * 100;
                                      
                                      return (
                                        <div key={crit._id}>
                                          <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{crit.name}</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{scoreValue} <span className="text-slate-400 text-xs">/ 5</span></span>
                                          </div>
                                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic">No member criteria data found.</p>
                                )
                              )}

                            </div>

                            {/* Right Col: Feedback */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Private Notes (Admin only)</h4>
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl">
                                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {ev.comment || <span className="text-slate-400 italic">None provided.</span>}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Public Feedback (Visible to Team)</h4>
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 p-4 rounded-xl">
                                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {ev.publicFeedback || <span className="text-slate-400 italic">None provided.</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Track</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Problem Statement</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Judge(s)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</th>
              </tr>
            </thead>
            <tbody>
              {missingTeams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    All teams have been evaluated! 🎉
                  </td>
                </tr>
              ) : (
                paginatedMissingTeams.map((t) => (
                  <tr key={t._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{t.uniqueId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {t.problemStatementId?.track || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {t.problemStatementId?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.assignedJudges?.length > 0 
                        ? t.assignedJudges.map((j: any) => j.name).join(', ') 
                        : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.members?.length || 0} members
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
        
        {viewMode === 'evaluations' && filteredEvaluations.length > 0 && (
          <Pagination
            currentPage={evalPage}
            totalItems={filteredEvaluations.length}
            pageSize={evalPageSize}
            onPageChange={setEvalPage}
            onPageSizeChange={(newSize) => {
              setEvalPageSize(newSize);
              setEvalPage(1);
            }}
          />
        )}

        {viewMode === 'missing' && missingTeams.length > 0 && (
          <Pagination
            currentPage={missingPage}
            totalItems={missingTeams.length}
            pageSize={missingPageSize}
            onPageChange={setMissingPage}
            onPageSizeChange={(newSize) => {
              setMissingPageSize(newSize);
              setMissingPage(1);
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
