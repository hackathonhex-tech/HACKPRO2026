"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Users, 
  MessageSquare, 
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { updateSupportTicketStatusAction, deleteSupportTicketAction } from '@/server/actions/support.actions';

export interface AdminSupportBoardProps {
  initialTickets: any[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  onRefresh: () => Promise<void>;
}

export function AdminSupportBoard({ initialTickets, stats, onRefresh }: AdminSupportBoardProps) {
  const [tickets, setTickets] = useState<any[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0]._id : null
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state for updating selected ticket
  const [adminStatus, setAdminStatus] = useState<string>('OPEN');
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync when initialTickets change
  const currentTicket = useMemo(() => {
    return tickets.find(t => t._id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // When selected ticket changes, update form fields
  const handleSelectTicket = (t: any) => {
    setSelectedTicketId(t._id);
    setAdminStatus(t.status || 'OPEN');
    setAdminResponse(t.adminResponse || '');
    setActionMsg(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const teamName = t.teamId?.name || '';
      const teamId = t.teamId?.uniqueId || '';
      const leadName = t.teamId?.leadName || '';
      const subject = t.subject || '';
      const ticketNumber = t.ticketNumber || '';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        teamName.toLowerCase().includes(q) ||
        teamId.toLowerCase().includes(q) ||
        leadName.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        ticketNumber.toLowerCase().includes(q)
      );

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const handleUpdate = async () => {
    if (!currentTicket) return;
    setUpdating(true);
    setActionMsg(null);

    const res = await updateSupportTicketStatusAction(currentTicket._id, {
      status: adminStatus,
      adminResponse: adminResponse
    });

    if (res.success && res.ticket) {
      setActionMsg({ type: 'success', text: `Ticket successfully marked as ${adminStatus}!` });
      // Update local ticket list
      setTickets(prev => prev.map(t => t._id === currentTicket._id ? { ...t, ...res.ticket } : t));
    } else {
      setActionMsg({ type: 'error', text: res.message || 'Failed to update ticket.' });
    }
    setUpdating(false);
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (ticketId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this team query?')) {
      return;
    }

    setDeleting(true);
    const res = await deleteSupportTicketAction(ticketId);
    if (res.success) {
      const remaining = tickets.filter(t => t._id !== ticketId);
      setTickets(remaining);
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(remaining.length > 0 ? remaining[0]._id : null);
      }
      setActionMsg({ type: 'success', text: 'Query deleted successfully.' });
    } else {
      alert(res.message || 'Failed to delete ticket.');
    }
    setDeleting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" /> Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Stats Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            Support Tickets & Team Queries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and resolve technical issues, slot queries, and requests raised by employee teams.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Queries
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' 
              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-xs' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Issues</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('OPEN')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'OPEN' 
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-xs' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Open / Pending</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.open}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS' 
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.inProgress}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RESOLVED' 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Tickets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/60">
            {/* Search Box */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by team, lead, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <span>Showing {filteredTickets.length} tickets</span>
              <span className="font-semibold">{statusFilter} filter</span>
            </div>

            {/* Tickets Scroll List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto mt-1">
              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No support tickets found matching your filter.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicketId === t._id;
                  return (
                    <div
                      key={t._id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all my-1.5 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500 shadow-sm'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {t.teamId?.uniqueId || 'Team'}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {t.subject}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.teamId?.name} {t.teamId?.leadName && `· ${t.teamId?.leadName}`}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {t.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => handleDelete(t._id, e)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete this query"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ticket & Team Detail Card */}
        <div className="lg:col-span-7">
          {currentTicket ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/60 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {currentTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {currentTicket.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {currentTicket.subject}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(currentTicket.status)}
                  <button
                    onClick={() => handleDelete(currentTicket._id)}
                    disabled={deleting}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/40"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Team Information Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Team Details
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white dark:bg-slate-800 text-indigo-600 rounded">
                    {currentTicket.teamId?.uniqueId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Team Name:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentTicket.teamId?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Team Lead:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentTicket.teamId?.leadName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Lead Email:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{currentTicket.teamId?.leadEmail || currentTicket.contactEmail || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Contact Phone:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{currentTicket.contactPhone || currentTicket.teamId?.leadPhone || '—'}</strong>
                  </div>
                </div>

                {/* Problem statement if assigned */}
                {currentTicket.teamId?.problemStatementId && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <span className="text-slate-400 font-medium">Selected Case Study:</span>{' '}
                    <strong className="text-indigo-700 dark:text-indigo-300">
                      {currentTicket.teamId.problemStatementId.title} ({currentTicket.teamId.problemStatementId.track})
                    </strong>
                  </div>
                )}

                {/* Team Members List */}
                {currentTicket.teamId?.members && currentTicket.teamId.members.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Members:</span>{' '}
                    {currentTicket.teamId.members.map((m: any, i: number) => (
                      <span key={i} className="inline-block mr-2">
                        {m.name} {m.employeeId || m.empId || m.supersetId ? `(${m.employeeId || m.empId || m.supersetId})` : ''}{i < currentTicket.teamId.members.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Issue Description
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentTicket.description}
                </div>
                <p className="text-[11px] text-slate-400">
                  Raised on {new Date(currentTicket.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Admin Action: Update Status & Resolution Note */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Resolution & Admin Response
                </h3>

                <AnimatePresence>
                  {actionMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        actionMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{actionMsg.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Update Ticket Status
                    </label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="OPEN">OPEN (Pending)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (Investigating)</option>
                      <option value="RESOLVED">RESOLVED (Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Priority Level
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentTicket.priority || 'MEDIUM'}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 uppercase cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Response Note / Solution (Visible to Employee Team)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter instructions, resolution status, or guidance for the team..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleDelete(currentTicket._id)}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 transition border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete Query
                  </button>

                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Save Resolution & Update
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/60 text-slate-400 text-sm">
              Select a support ticket from the list to view team details and take action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
