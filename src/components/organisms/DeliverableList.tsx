"use client";

import { useState } from 'react';
import { FileText, GitBranch, MonitorPlay, Video, Search, RefreshCw, ExternalLink, Download, Edit2, Trash2, X, Loader2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateAdminDeliverableAction, deleteAdminDeliverableAction } from '@/server/actions/team.actions';
import { Pagination } from '../molecules/Pagination';

export interface DeliverableListProps {
  deliverables: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function DeliverableList({ deliverables, loading, onRefresh }: DeliverableListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [viewingDeliverable, setViewingDeliverable] = useState<any>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    githubLink: '',
    deckUrl: '',
    videoLink: '',
    abstract: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterRound, setFilterRound] = useState('');
  const [filterProblem, setFilterProblem] = useState('');

  const uniqueRounds = Array.from(new Set(deliverables.map(d => d.roundId?.name).filter(Boolean)));
  const uniqueProblems = Array.from(new Set(deliverables.map(d => d.teamId?.problemStatementId?.title).filter(Boolean)));

  const filtered = deliverables.filter(d => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      d.teamId?.name?.toLowerCase().includes(searchLower) || 
      d.teamId?.uniqueId?.toLowerCase().includes(searchLower) ||
      d.teamId?.problemStatementId?.title?.toLowerCase().includes(searchLower) ||
      d.roundId?.name?.toLowerCase().includes(searchLower)
    );
    
    const matchesRound = filterRound ? d.roundId?.name === filterRound : true;
    const matchesProblem = filterProblem ? d.teamId?.problemStatementId?.title === filterProblem : true;

    return matchesSearch && matchesRound && matchesProblem;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const paginatedDeliverables = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const downloadCSV = () => {
    const headers = ['Team Name', 'Team ID', 'Round', 'Track', 'Problem Statement', 'Abstract', 'GitHub Link', 'Pitch Deck', 'Demo Video / Website Link'];
    const rows = filtered.map(d => [
      `"${(d.teamId?.name || 'Unknown Team').replace(/"/g, '""')}"`,
      d.teamId?.uniqueId || '',
      d.roundId?.name || 'Unknown Round',
      d.teamId?.problemStatementId?.track || '',
      `"${(d.teamId?.problemStatementId?.title || '').replace(/"/g, '""')}"`,
      `"${(d.abstract || '').replace(/"/g, '""')}"`,
      d.githubLink || '',
      d.deckUrl || '',
      d.videoLink || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'deliverables.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.text('Deliverables Report', 40, 40);
    
    const tableColumn = ['Team Name', 'Team ID', 'Round', 'Track', 'GitHub', 'Pitch Deck', 'Video'];
    const tableRows = filtered.map(d => [
      d.teamId?.name || 'Unknown',
      d.teamId?.uniqueId || '',
      d.roundId?.name || 'Unknown',
      d.teamId?.problemStatementId?.track || '',
      d.githubLink || 'No',
      d.deckUrl || 'No',
      d.videoLink || 'No'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
    });

    doc.save('deliverables.pdf');
  };

  const handleEditClick = (d: any) => {
    setFormData({
      githubLink: d.githubLink || '',
      deckUrl: d.deckUrl || '',
      videoLink: d.videoLink || '',
      abstract: d.abstract || ''
    });
    setEditingDeliverable(d);
  };

  const handleSaveEdit = async () => {
    if (!editingDeliverable) return;
    setIsSubmitting(true);
    const res = await updateAdminDeliverableAction(editingDeliverable._id, formData);
    setIsSubmitting(false);
    if (res.success) {
      setEditingDeliverable(null);
      onRefresh();
    } else {
      alert(res.message || 'Failed to update');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    const res = await deleteAdminDeliverableAction(deletingId);
    setIsSubmitting(false);
    if (res.success) {
      setDeletingId(null);
      onRefresh();
    } else {
      alert(res.message || 'Failed to delete');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Deliverables</h2>
          <p className="text-slate-500 mt-1">Review submitted projects, presentations, and code repositories.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
          <button onClick={downloadCSV} className="flex items-center justify-center px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button onClick={downloadPDF} className="flex items-center justify-center px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button onClick={onRefresh} className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
              placeholder="Search teams, IDs, rounds or tracks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <select
              value={filterRound}
              onChange={(e) => {
                setFilterRound(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Rounds</option>
              {uniqueRounds.map((r: any) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            
            <select
              value={filterProblem}
              onChange={(e) => {
                setFilterProblem(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs truncate"
            >
              <option value="">All Problem Statements</option>
              {uniqueProblems.map((p: any) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading && deliverables.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-bold">Loading submissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-lg">No deliverables found.</p>
              {searchQuery && <p className="text-slate-400 mt-1">Try adjusting your search query.</p>}
            </motion.div>
          ) : (
            paginatedDeliverables.map((d, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }} 
                key={d._id} 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors flex flex-col"
              >
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-1">{d.teamId?.name || 'Unknown Team'}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setViewingDeliverable(d)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(d)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingId(d._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2 items-center">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md">{d.teamId?.uniqueId}</span>
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {d.roundId?.name || 'Unknown Round'}
                    </span>
                    {d.teamId?.problemStatementId?.track && (
                      <span className="text-xs font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                        {d.teamId.problemStatementId.track}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{d.teamId?.problemStatementId?.title || 'No Problem Statement Selected'}</p>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  {d.abstract ? (
                    <div className="mb-4 flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Abstract</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{d.abstract}</p>
                    </div>
                  ) : (
                    <div className="mb-4 flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                      <p className="text-sm text-slate-400 italic">No abstract provided</p>
                    </div>
                  )}

                  <div className="space-y-2 mt-auto">
                    {d.githubLink ? (
                      <a href={d.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-[#24292e] text-white flex items-center justify-center mr-3 shadow-sm">
                          <GitBranch className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">GitHub Repo</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                      </a>
                    ) : null}

                    {d.deckUrl ? (
                      <a href={d.deckUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center mr-3 shadow-sm">
                          <MonitorPlay className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Pitch Deck</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors" />
                      </a>
                    ) : null}

                    {d.videoLink ? (
                      <a href={d.videoLink} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center mr-3 shadow-sm">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Demo Video / Website Link</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 transition-colors" />
                      </a>
                    ) : null}
                    
                    {!d.githubLink && !d.deckUrl && !d.videoLink && (
                      <div className="p-3 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-sm text-slate-500 italic">No links submitted</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
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

      {/* View Modal */}
      <AnimatePresence>
        {viewingDeliverable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingDeliverable(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{viewingDeliverable.teamId?.name || 'Unknown Team'}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">{viewingDeliverable.teamId?.uniqueId} • {viewingDeliverable.roundId?.name}</p>
                </div>
                <button onClick={() => setViewingDeliverable(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h4>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded mr-2 text-xs">
                      {viewingDeliverable.teamId?.problemStatementId?.track || 'N/A'}
                    </span>
                    {viewingDeliverable.teamId?.problemStatementId?.title || 'None Selected'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Abstract</h4>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {viewingDeliverable.abstract || <span className="italic text-slate-400">No abstract provided.</span>}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submitted Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href={viewingDeliverable.githubLink || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${viewingDeliverable.githubLink ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300' : 'opacity-50 pointer-events-none cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="w-10 h-10 rounded-xl bg-[#24292e] text-white flex items-center justify-center mr-4 shadow-sm">
                        <GitBranch className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">GitHub Repo</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{viewingDeliverable.githubLink || 'Not provided'}</p>
                      </div>
                      {viewingDeliverable.githubLink && <ExternalLink className="w-4 h-4 text-slate-400" />}
                    </a>

                    <a href={viewingDeliverable.deckUrl || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${viewingDeliverable.deckUrl ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300' : 'opacity-50 pointer-events-none cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center mr-4 shadow-sm">
                        <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Pitch Deck</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{viewingDeliverable.deckUrl || 'Not provided'}</p>
                      </div>
                      {viewingDeliverable.deckUrl && <ExternalLink className="w-4 h-4 text-slate-400" />}
                    </a>

                    <a href={viewingDeliverable.videoLink || '#'} target="_blank" rel="noopener noreferrer" className={`md:col-span-2 flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${viewingDeliverable.videoLink ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300' : 'opacity-50 pointer-events-none cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mr-4 shadow-sm">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Demo Video / Website Link</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{viewingDeliverable.videoLink || 'Not provided'}</p>
                      </div>
                      {viewingDeliverable.videoLink && <ExternalLink className="w-4 h-4 text-slate-400" />}
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDeliverable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingDeliverable(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit Deliverable</h3>
                <button onClick={() => setEditingDeliverable(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub Link</label>
                  <input type="url" value={formData.githubLink} onChange={e => setFormData({...formData, githubLink: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pitch Deck</label>
                  <input type="url" value={formData.deckUrl} onChange={e => setFormData({...formData, deckUrl: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Demo Video / Website Link</label>
                  <input type="url" value={formData.videoLink} onChange={e => setFormData({...formData, videoLink: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Abstract</label>
                  <textarea rows={4} value={formData.abstract} onChange={e => setFormData({...formData, abstract: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl resize-none" />
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button onClick={() => setEditingDeliverable(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveEdit} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingId(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Submission?</h3>
              <p className="text-slate-500 mb-6 text-sm">This action cannot be undone. The team will be able to submit again once this is deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={isSubmitting} className="flex-1 px-4 py-2.5 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
