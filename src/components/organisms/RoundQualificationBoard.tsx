"use client";

import { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  Search, 
  Save, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  Layers,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '../atoms/Button';
import { Pagination } from '../molecules/Pagination';

export interface RoundQualificationBoardProps {
  rounds: any[];
  teams: any[];
  onSaveAllowedTeams: (roundId: string, allowedTeamIds: string[]) => Promise<boolean>;
  onRefresh: () => void;
}

export function RoundQualificationBoard({
  rounds,
  teams,
  onSaveAllowedTeams,
  onRefresh
}: RoundQualificationBoardProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUALIFIED' | 'UNSELECTED'>('ALL');
  const [isSaving, setIsSaving] = useState(false);

  const activeRoundId = selectedRoundId || (rounds?.find(r => r.isActive)?._id || rounds?.[0]?._id || '');

  const currentRound = useMemo(() => {
    return rounds?.find(r => r._id === activeRoundId);
  }, [rounds, activeRoundId]);

  const defaultAllowedIds = useMemo(() => {
    const rawAllowed = currentRound?.allowedTeamIds || [];
    return rawAllowed.map((id: any) => 
      typeof id === 'object' && id !== null ? String(id._id || id) : String(id)
    );
  }, [currentRound]);

  const allowedTeamIds = customSelections[activeRoundId] ?? defaultAllowedIds;
  const hasChanges = customSelections[activeRoundId] !== undefined;

  // Extract unique tracks
  const tracks = useMemo(() => {
    const trackSet = new Set<string>();
    teams.forEach(t => {
      if (t.problemStatementId?.track) {
        trackSet.add(t.problemStatementId.track);
      }
    });
    return Array.from(trackSet);
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const teamIdStr = String(t._id);
      const nameMatch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.leadEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const trackMatch = selectedTrack === 'ALL' || t.problemStatementId?.track === selectedTrack;

      const isQualified = allowedTeamIds.includes(teamIdStr);
      const statusMatch = statusFilter === 'ALL' || 
                         (statusFilter === 'QUALIFIED' && isQualified) ||
                         (statusFilter === 'UNSELECTED' && !isQualified);

      return nameMatch && trackMatch && statusMatch;
    });
  }, [teams, searchTerm, selectedTrack, statusFilter, allowedTeamIds]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedTeams = useMemo(() => {
    return filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTeams, currentPage, pageSize]);

  // Toggle single team qualification
  const toggleTeam = (teamId: string) => {
    const teamIdStr = String(teamId);
    let next: string[];
    if (allowedTeamIds.includes(teamIdStr)) {
      next = allowedTeamIds.filter(id => id !== teamIdStr);
    } else {
      next = [...allowedTeamIds, teamIdStr];
    }
    setCustomSelections(prev => ({ ...prev, [activeRoundId]: next }));
  };

  // Select all filtered teams
  const handleSelectAll = () => {
    const filteredIds = filteredTeams.map(t => String(t._id));
    const combined = Array.from(new Set([...allowedTeamIds, ...filteredIds]));
    setCustomSelections(prev => ({ ...prev, [activeRoundId]: combined }));
  };

  // Deselect all filtered teams
  const handleDeselectAll = () => {
    const filteredIdSet = new Set(filteredTeams.map(t => String(t._id)));
    const next = allowedTeamIds.filter(id => !filteredIdSet.has(id));
    setCustomSelections(prev => ({ ...prev, [activeRoundId]: next }));
  };

  // Invert selection for filtered teams
  const handleInvertSelection = () => {
    const filteredIdSet = new Set(filteredTeams.map(t => String(t._id)));
    const next = teams.map(t => String(t._id)).filter(id => {
      if (filteredIdSet.has(id)) {
        return !allowedTeamIds.includes(id);
      }
      return allowedTeamIds.includes(id);
    });
    setCustomSelections(prev => ({ ...prev, [activeRoundId]: next }));
  };

  const handleSave = async () => {
    if (!activeRoundId) return;
    setIsSaving(true);
    const success = await onSaveAllowedTeams(activeRoundId, allowedTeamIds);
    setIsSaving(false);
    if (success) {
      setCustomSelections(prev => {
        const copy = { ...prev };
        delete copy[activeRoundId];
        return copy;
      });
      onRefresh();
    }
  };

  const qualifiedCount = allowedTeamIds.length;
  const totalCount = teams.length;
  const percentQualified = totalCount > 0 ? Math.round((qualifiedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">Round Qualification</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Select which teams are allowed to access and submit deliverables for each hackathon round.
                </p>
              </div>
            </div>
          </div>

          {/* Round Selector Dropdown */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider self-center">Select Round:</label>
            <select
              value={activeRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base shadow-sm"
            >
              {rounds.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} {r.isActive ? '🔥 (LIVE)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Round Info Banner & Stats */}
        {currentRound && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Round Status</p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    currentRound.isActive 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {currentRound.isActive ? '🟢 Active / Live' : '⚪ Inactive'}
                  </span>
                  {currentRound.isSubmissionsOpen && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Submissions Open
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualified Teams</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {qualifiedCount} <span className="text-xs font-medium text-slate-400">/ {totalCount} Teams</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualification Rate</p>
                <p className="text-lg font-black text-slate-800 dark:text-white">
                  {percentQualified}% <span className="text-xs font-normal text-slate-400">Selected</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${percentQualified}%` }} 
                />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">
                {totalCount - qualifiedCount} teams restricted
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Bulk Action Buttons */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by team name, Team ID (TM-XXXX), lead name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Track Filter */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Tracks</option>
              {tracks.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="QUALIFIED">Qualified Teams Only</option>
              <option value="UNSELECTED">Unselected Teams Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 gap-3">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            >
              Select All Visible ({filteredTeams.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeselectAll}
              className="text-xs font-bold border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-950/30"
              leftIcon={<Square className="w-3.5 h-3.5" />}
            >
              Deselect All Visible
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInvertSelection}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Invert Selection
            </Button>
          </div>

          <div className="text-xs font-medium text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredTeams.length}</strong> of {teams.length} teams
          </div>
        </div>
      </div>

      {/* Teams Qualification Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <th className="py-4 px-6 w-16 text-center">
                  <input
                    type="checkbox"
                    checked={filteredTeams.length > 0 && filteredTeams.every(t => allowedTeamIds.includes(String(t._id)))}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6">Team & ID</th>
                <th className="py-4 px-6">Team Lead</th>
                <th className="py-4 px-6">Problem Statement & Track</th>
                <th className="py-4 px-6">College</th>
                <th className="py-4 px-6 text-center">Access Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No teams match your current search/filters.
                  </td>
                </tr>
              ) : (
                paginatedTeams.map((team) => {
                  const isQualified = allowedTeamIds.includes(String(team._id));

                  return (
                    <tr 
                      key={team._id}
                      onClick={() => toggleTeam(team._id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${
                        isQualified ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isQualified}
                          onChange={() => toggleTeam(team._id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">
                        <div className="font-extrabold text-base">{team.name}</div>
                        <span className="inline-block font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 mt-0.5">
                          {team.uniqueId}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{team.leadName}</div>
                        <div className="text-xs text-slate-400">{team.leadEmail}</div>
                        <span className="text-[10px] font-mono text-slate-500">
                          SS: {team.leadSupersetId || team.supersetId || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-medium text-slate-700 dark:text-slate-300 truncate" title={team.problemStatementId?.title}>
                          {team.problemStatementId?.title || <span className="text-amber-500 italic">Not Selected Yet</span>}
                        </div>
                        {team.problemStatementId?.track && (
                          <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-1">
                            {team.problemStatementId.track}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {team.collegeName || '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isQualified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Restricted
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={isQualified ? 'outline' : 'primary'}
                          onClick={() => toggleTeam(team._id)}
                          className={isQualified ? 'border-red-200 text-red-600 hover:bg-red-50 text-xs py-1.5' : 'bg-emerald-600 text-xs py-1.5'}
                        >
                          {isQualified ? 'Remove Access' : 'Qualify Team'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
            className="p-4"
          />
        )}
      </div>

      {/* Floating Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center space-x-6 max-w-xl w-full"
          >
            <div className="flex items-center space-x-3 flex-1">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 animate-bounce" />
              <div>
                <p className="font-bold text-sm">Unsaved Qualification Changes</p>
                <p className="text-xs text-slate-300">
                  {allowedTeamIds.length} teams selected for <span className="text-emerald-400 font-bold">{currentRound?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomSelections(prev => { const copy = { ...prev }; delete copy[activeRoundId]; return copy; });
                }}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 shadow-lg shadow-emerald-500/20"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
