"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  HelpCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { createSupportTicketAction, getMyTeamTicketsAction } from '@/server/actions/support.actions';

export default function TeamSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical / Portal Issue',
    priority: 'MEDIUM',
    description: '',
    contactPhone: '',
    contactEmail: ''
  });

  const loadTickets = async () => {
    setLoading(true);
    const res = await getMyTeamTicketsAction();
    if (res.success && res.tickets) {
      setTickets(res.tickets);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setMsg({ type: 'error', text: 'Please fill in both the subject and description.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    const res = await createSupportTicketAction(formData);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Ticket submitted successfully!' });
      setFormData({
        subject: '',
        category: 'Technical / Portal Issue',
        priority: 'MEDIUM',
        description: '',
        contactPhone: '',
        contactEmail: ''
      });
      loadTickets();
    } else {
      setMsg({ type: 'error', text: res.message || 'Failed to submit ticket.' });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" /> Open
          </span>
        );
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/team/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            Help & Contact Support
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Facing any issue or need assistance during the hackathon? Submit a ticket and our admin team will resolve it.
          </p>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Submit an Issue */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/60">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Raise an Issue / Query</h2>
            <p className="text-xs text-slate-500 mb-6">Describe your problem clearly so our organizers can assist you quickly.</p>

            <AnimatePresence>
              {msg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-2xl text-xs font-bold mb-5 flex items-start gap-2.5 ${
                    msg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{msg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Technical / Portal Issue">Technical / Portal Issue</option>
                  <option value="Problem Statement / Slot">Problem Statement / Slot Booking</option>
                  <option value="Submissions & Project Links">Submissions & Project Links</option>
                  <option value="Evaluation & Judging">Evaluation & Judging</option>
                  <option value="General / Other">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unable to lock case study slot"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe the exact issue you are facing or question you have..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Optional phone #"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-[#3760F8] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Issue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Previously Raised Tickets */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Your Raised Issues</h2>
                <p className="text-xs text-slate-500">Track the resolution status and admin responses for your queries.</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                {tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 animate-pulse space-y-2">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">No issues raised yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  If you run into any difficulty with slot booking, submissions, or portal access, submit a ticket on the left.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((t) => (
                  <div
                    key={t._id}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-200 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-500">{t.category}</span>
                      </div>
                      <div>{getStatusBadge(t.status)}</div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{t.subject}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                        {t.description}
                      </p>
                    </div>

                    {/* Admin Response Box if available */}
                    {t.adminResponse && (
                      <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Admin Resolution / Response</span>
                          {t.resolvedBy && <span className="font-normal text-slate-400">· by {t.resolvedBy}</span>}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {t.adminResponse}
                        </p>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                      <span>Submitted: {new Date(t.createdAt).toLocaleString()}</span>
                      {t.priority && (
                        <span className={`font-bold uppercase ${
                          t.priority === 'URGENT' ? 'text-red-500' :
                          t.priority === 'HIGH' ? 'text-orange-500' : 'text-slate-400'
                        }`}>
                          {t.priority} Priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
