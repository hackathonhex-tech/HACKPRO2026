import React from 'react';
import { UploadCloud, CheckCircle, GitBranch, MonitorPlay, FileText, Film, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectSubmissionFormProps {
  activeRound: any;
  formData: {
    githubLink: string;
    deckUrl: string;
    videoLink: string;
    abstract: string;
  };
  isSubmitting: boolean;
  success: boolean;
  hasSubmitted?: boolean;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProjectSubmissionForm: React.FC<ProjectSubmissionFormProps> = ({
  activeRound,
  formData,
  isSubmitting,
  success,
  hasSubmitted = false,
  setFormData,
  onSubmit
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 pointer-events-none"></div>
      
      <div className="p-8 md:p-10 relative z-10 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Submit Deliverables</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1 flex items-center">
              Round: <span className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">{activeRound.name}</span>
            </p>
          </div>
        </div>
      </div>
      {hasSubmitted ? (
        <div className="p-8 md:p-10 space-y-8">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-6 rounded-2xl mb-8 flex items-start">
            <CheckCircle className="w-8 h-8 text-emerald-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300">Submission Received</h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                Your team has successfully submitted the deliverables for this round. Submissions can only be made once. 
                If you need to make corrections, please contact an administrator.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                <GitBranch className="w-4 h-4 mr-1.5 text-slate-400" /> GitHub Repository
              </label>
              <div className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 break-all">
                {formData.githubLink ? <a href={formData.githubLink} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{formData.githubLink}</a> : 'Not provided'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                <MonitorPlay className="w-4 h-4 mr-1.5 text-slate-400" /> Pitch Deck
              </label>
              <div className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 break-all">
                {formData.deckUrl ? <a href={formData.deckUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{formData.deckUrl}</a> : 'Not provided'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              <Film className="w-4 h-4 mr-1.5 text-slate-400" /> Demo Video or Website Link
            </label>
            <div className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 break-all">
              {formData.videoLink ? <a href={formData.videoLink} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{formData.videoLink}</a> : 'Not provided'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              <FileText className="w-4 h-4 mr-1.5 text-slate-400" /> Project Abstract
            </label>
            <div className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {formData.abstract}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="p-8 md:p-10 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                <GitBranch className="w-4 h-4 mr-1.5 text-slate-400" /> GitHub Repository
              </label>
              <input
                type="url"
                required
                value={formData.githubLink}
                onChange={(e) => setFormData({...formData, githubLink: e.target.value})}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <MonitorPlay className="w-4 h-4 mr-1.5 text-slate-400" /> Pitch Deck
                </label>
                <a
                  href="https://docs.google.com/presentation/d/1by9ByWXFoUoskWTm1DrhOqf7KJA6SqDU/edit?usp=sharing&ouid=112558402096863870802&rtpof=true&sd=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors gap-1"
                  title="Open official PPT template"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PPT Template</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>
              <input
                type="url"
                value={formData.deckUrl}
                onChange={(e) => setFormData({...formData, deckUrl: e.target.value})}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                placeholder="Google Slides, Canva..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              <Film className="w-4 h-4 mr-1.5 text-slate-400" /> Demo Video or Website Link <span className="text-slate-400 font-medium lowercase ml-1">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.videoLink}
              onChange={(e) => setFormData({...formData, videoLink: e.target.value})}
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              placeholder="YouTube, Loom, Website URL..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              <FileText className="w-4 h-4 mr-1.5 text-slate-400" /> Project Abstract
            </label>
            <textarea
              required
              rows={5}
              value={formData.abstract}
              onChange={(e) => setFormData({...formData, abstract: e.target.value})}
              className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm resize-none"
              placeholder="Describe your project, tech stack, and impact..."
            ></textarea>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto">
              {success && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 mr-2" /> Deliverables saved!
                </motion.div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto group relative overflow-hidden bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black py-4 px-8 rounded-xl shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center tracking-wide"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isSubmitting ? (
                <span className="relative z-10 flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</span>
              ) : (
                <span className="relative z-10 flex items-center"><UploadCloud className="w-5 h-5 mr-2" /> Submit Deliverables</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
