"use client";

import React, { useState, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  Mail, 
  MapPin, 
  UserCheck, 
  BadgeAlert
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { 
  parseSpreadsheetBuffer, 
  generateSampleEmployeeCSV, 
  generateSampleEmployeeExcel 
} from '@/server/utils/csv';
import { 
  parseAndValidateEmployeeCsvAction, 
  importEmployeeTeamsAction 
} from '@/server/actions/import.team.actions';
import { ParsedEmployeeTeam, ParseValidationResult } from '@/server/services/import.team.service';

export function TeamImportBoard() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'conflicts' | 'clean'>('all');

  // Import Execution
  const [isImporting, setIsImporting] = useState(false);
  const [sendEmails, setSendEmails] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    createdCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  // Handle File Selection & Parse
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setImportSummary(null);
    setIsParsing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const rows = parseSpreadsheetBuffer(buffer, selectedFile.name);

      if (rows.length === 0) {
        setParseError('The uploaded spreadsheet file is empty or missing headers.');
        setParseResult(null);
        setIsParsing(false);
        return;
      }

      const res = await parseAndValidateEmployeeCsvAction(rows);
      if (res.success && res.data) {
        setParseResult(res.data);
      } else {
        setParseError(res.message || 'Failed to process spreadsheet file.');
        setParseResult(null);
      }
    } catch (err: any) {
      setParseError(err.message || 'Error reading the spreadsheet file.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleEmployeeCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackpro_employee_teams_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleExcel = () => {
    const excelBuffer = generateSampleEmployeeExcel();
    const blob = new Blob([excelBuffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackpro_employee_teams_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setImportSummary(null);
    setSearchQuery('');
  };

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.teams.filter(team => {
      // Status filter
      if (statusFilter === 'conflicts' && !team.hasDuplicateMembers) return false;
      if (statusFilter === 'clean' && team.hasDuplicateMembers) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTeam = team.name.toLowerCase().includes(query) ||
          team.place.toLowerCase().includes(query) ||
          team.leadName.toLowerCase().includes(query) ||
          team.leadEmail.toLowerCase().includes(query);

        const matchesMember = team.members.some(m => 
          m.name.toLowerCase().includes(query) ||
          m.empId.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
        );

        return matchesTeam || matchesMember;
      }

      return true;
    });
  }, [parseResult, statusFilter, searchQuery]);

  // Import Handlers
  const handleImport = async (teamsToImport: ParsedEmployeeTeam[]) => {
    if (teamsToImport.length === 0) return;

    setIsImporting(true);
    setImportSummary(null);

    try {
      const res = await importEmployeeTeamsAction(teamsToImport, { sendEmails });
      if (res.success && res.result) {
        setImportSummary(res.result);
      } else {
        alert(res.message || 'Import failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to execute import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Employee Team Import & Conflict Detection
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload employee rosters via Excel (.xlsx, .xls) or CSV. Detect cross-team duplicate members in real-time, view conflicts in orange, and import rosters seamlessly.
          </p>
          {file && (
            <p className="mt-1">
              <span className="inline-block font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                Active File: {file.name}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleExcel}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          >
            Sample Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Sample CSV (.csv)
          </Button>
          {parseResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Upload New File
            </Button>
          )}
        </div>
      </div>

      {/* Spreadsheet Upload Dropzone */}
      {!parseResult && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm ${
            isParsing 
              ? 'border-indigo-400 bg-indigo-50/20' 
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              {isParsing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {isParsing ? 'Analyzing and checking for cross-team duplicates...' : 'Upload Employee Roster (Excel / CSV)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop your Excel (.xlsx, .xls) or CSV (.csv) file here, or click to browse.
              </p>
            </div>

            <div className="inline-block">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  disabled={isParsing}
                />
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-indigo-500/25">
                  <FileSpreadsheet className="w-4 h-4" />
                  Select Excel / CSV File
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Spreadsheet Columns:
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">Emp_id</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">emp_name</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">place</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">team_name</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">email_id</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">team leader mail</span>
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">team leader name</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parse Error Alert */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-700 dark:text-rose-300">
            <p className="font-bold">Import Warning / Error</p>
            <p className="mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {/* Success Import Summary Modal / Banner */}
      {importSummary && (
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Import Completed Successfully!
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Created {importSummary.createdCount} teams in database. (Skipped: {importSummary.skippedCount})
              </p>
            </div>
          </div>
          {importSummary.errors.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
              <p className="font-bold mb-1">Errors logged during import:</p>
              <ul className="list-disc list-inside space-y-1">
                {importSummary.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results View */}
      {parseResult && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Rows</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {parseResult.totalRows}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {parseResult.totalTeams}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {parseResult.totalMembers}
              </p>
            </div>

            {/* Orange Conflicted Teams Card */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-600 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Conflicted Teams
                </p>
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {parseResult.conflictedTeamsCount}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Duplicate member in multiple teams
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Clean Teams
                </p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {parseResult.cleanTeamsCount}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Ready for clean import
              </p>
            </div>
          </div>

          {/* Import Actions Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={sendEmails}
                  onChange={(e) => setSendEmails(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Send Ticket Emails to Team Leads upon import
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Button
                variant="primary"
                onClick={() => {
                  const cleanTeams = parseResult.teams.filter(t => !t.hasDuplicateMembers);
                  handleImport(cleanTeams);
                }}
                disabled={isImporting || parseResult.cleanTeamsCount === 0}
                leftIcon={<UserCheck className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isImporting ? 'Importing...' : `Import Clean Teams Only (${parseResult.cleanTeamsCount})`}
              </Button>

              {parseResult.conflictedTeamsCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Warning: You have ${parseResult.conflictedTeamsCount} teams with duplicate members. Are you sure you want to force import all ${parseResult.teams.length} teams?`)) {
                      handleImport(parseResult.teams);
                    }
                  }}
                  disabled={isImporting}
                  leftIcon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                  className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  Force Import All ({parseResult.teams.length})
                </Button>
              )}
            </div>
          </div>

          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Teams ({parseResult.teams.length})
              </button>
              <button
                onClick={() => setStatusFilter('conflicts')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  statusFilter === 'conflicts'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Conflicted Teams ({parseResult.conflictedTeamsCount})
              </button>
              <button
                onClick={() => setStatusFilter('clean')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  statusFilter === 'clean'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Clean Teams ({parseResult.cleanTeamsCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search team, lead, employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Teams Grid / List */}
          <div className="space-y-4">
            {filteredTeams.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No teams matching the filter</h4>
                <p className="text-xs text-slate-500 mt-1">Try switching tabs or adjusting your search term.</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <div
                  key={team.tempId}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    team.hasDuplicateMembers
                      ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'
                  }`}
                >
                  {/* Team Card Header */}
                  <div
                    className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
                      team.hasDuplicateMembers
                        ? 'bg-amber-100/60 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {team.name}
                      </h3>

                      {team.place && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {team.place}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        <Users className="w-3 h-3" />
                        {team.members.length} Members
                      </span>

                      {/* Prominent Orange Conflict Badge */}
                      {team.hasDuplicateMembers && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm animate-pulse">
                          <BadgeAlert className="w-3.5 h-3.5" />
                          CONFLICT: {team.duplicateMembersCount} DUPLICATE MEMBER{team.duplicateMembersCount > 1 ? 'S' : ''}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Team Lead: </span>
                      {team.leadName} ({team.leadEmail || 'No Email'})
                      {team.leadEmpId && <span className="font-mono ml-1 text-slate-500">[{team.leadEmpId}]</span>}
                    </div>
                  </div>

                  {/* Summary of other conflicting teams if present */}
                  {team.hasDuplicateMembers && team.duplicateInTeamsSummary.length > 0 && (
                    <div className="px-5 py-2.5 bg-amber-200/50 dark:bg-amber-900/40 border-b border-amber-300/60 dark:border-amber-800/60 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>
                        Cross-team conflict detected with: {team.duplicateInTeamsSummary.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Members Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="px-5 py-3">Role</th>
                          <th className="px-5 py-3">Employee Name</th>
                          <th className="px-5 py-3">Employee ID</th>
                          <th className="px-5 py-3">Email Address</th>
                          <th className="px-5 py-3">Location / Place</th>
                          <th className="px-5 py-3">Status / Cross-Team Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {team.members.map((member, idx) => (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              member.isDuplicate
                                ? 'bg-amber-100/70 dark:bg-amber-950/50 hover:bg-amber-200/50 font-medium text-amber-950 dark:text-amber-100'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/20 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <td className="px-5 py-3">
                              {member.isLead ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                  Lead
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Member</span>
                              )}
                            </td>

                            <td className="px-5 py-3 font-semibold">
                              {member.name}
                            </td>

                            <td className="px-5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {member.empId || '—'}
                            </td>

                            <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                              {member.email || '—'}
                            </td>

                            <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                              {member.place || team.place || '—'}
                            </td>

                            <td className="px-5 py-3">
                              {member.isDuplicate ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Also in: {member.duplicateInTeams?.join(', ')}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
