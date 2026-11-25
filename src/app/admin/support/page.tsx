"use client";

import { useState, useEffect, useCallback } from 'react';
import { AdminSupportBoard } from '@/components/organisms/AdminSupportBoard';
import { getAllSupportTicketsAction } from '@/server/actions/support.actions';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getAllSupportTicketsAction('ALL');
    if (res.success && res.tickets) {
      setTickets(res.tickets);
      if (res.stats) {
        setStats(res.stats);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
          <div className="col-span-7 h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminSupportBoard
      initialTickets={tickets}
      stats={stats}
      onRefresh={fetchData}
    />
  );
}
