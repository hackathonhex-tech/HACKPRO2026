import React from 'react';
import { Lock, Target, AlertTriangle } from 'lucide-react';

interface ProblemStatementDetailCardProps {
  ps: any;
  team: any;
  hasSelected: boolean;
  isSelected: boolean;
  slotsRemaining: number | null;
  slotsOver: boolean;
  selecting: boolean;
  selectedStack: string;
  isLead?: boolean;
  setSelecting: (val: boolean) => void;
  setSelectedStack: (stack: string) => void;
  onSelectProblemStatement: () => void;
}

const renderStructuredDescription = (text: string) => {
  if (!text) return null;

  // Pre-process the raw text block to inject newlines and formatting 
  // for text that was copy-pasted from PDFs without proper line breaks.
  const processedText = text
    // 1. Bullets: Add newline before '●', '•', or '-' bullets
    .replace(/\s*([●•])\s*/g, '\n$1 ')
    
    // 2. Numbered lists: " 1. text" -> "\n1. text"
    .replace(/\s+(\d+\.\s+[A-Z])/g, '\n$1')
    
    // 3. Headers (injecting colon and newlines)
    .replace(/\s*(Theme|Problem Statement|Challenge|Expected Solution|Expected AI Solution|Expected Deliverables|Expected Outcomes|Expected Impact|Background|Objectives|Project Objectives|Required Software Features|Key Features|Ready-to-Implement Features|Innovation|Innovation Potential|Target Users|Subscription Model|AI SDG Magazine Generator|Magazine Sections|AI Technologies|Key Innovation|Suggested Technologies|Potential Manufacturing Use Cases|Evaluation Metrics|Evaluation Criteria|Relevant SDGs|Hackathon Value Proposition)(:?)\s+(?=[A-Z0-9●•])/gi, '\n$1:\n');

  const lines = processedText.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      let paragraphText = currentParagraph[0];
      for (let i = 1; i < currentParagraph.length; i++) {
        const prevLine = currentParagraph[i-1];
        const currLine = currentParagraph[i];
        
        // Smart reflow: if previous line is long and doesn't end in terminal punctuation, 
        // it's likely a wrapped line from a PDF, so we join with a space.
        // Otherwise, we preserve the intentional newline.
        if (prevLine.length > 50 && !/[.:;?!]$/.test(prevLine)) {
          paragraphText += ' ' + currLine;
        } else {
          paragraphText += '\n' + currLine;
        }
      }

      elements.push(
        <p key={key} className="text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed text-justify w-full mb-5 whitespace-pre-wrap">
          {paragraphText}
        </p>
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph(`p-${index}`);
      return;
    }

    const isHeader = /^[A-Z][A-Za-z0-9\s—–-]{1,50}:$/.test(trimmed) || 
                     trimmed.toLowerCase().startsWith('background:') || 
                     trimmed.toLowerCase().startsWith('project objectives:') ||
                     trimmed.toLowerCase().startsWith('objectives:') ||
                     trimmed.toLowerCase().startsWith('deliverables:');

    const isListItem = /^(\d+[\.\)]|[●•]|-)\s+/.test(trimmed);

    if (isHeader) {
      flushParagraph(`p-head-${index}`);
      elements.push(
        <h3 key={`h-${index}`} className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">
          {trimmed.replace(/:$/, '')}
        </h3>
      );
    } else if (isListItem) {
      flushParagraph(`p-list-${index}`);
      const numMatch = trimmed.match(/^(\d+[\.\)]|[●•]|-)/)?.[0] || '';
      const content = trimmed.replace(/^(\d+[\.\)]|[●•]|-)\s+/, '');
      elements.push(
        <div key={`li-${index}`} className="flex items-start mb-3 text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed w-full pl-2">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-3 flex-shrink-0 font-mono bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-md text-sm">{numMatch}</span>
          <span className="flex-1 text-justify">{content}</span>
        </div>
      );
    } else {
      currentParagraph.push(trimmed);
    }
  });

  flushParagraph('p-final');

  return <div className="w-full">{elements}</div>;
};

export const ProblemStatementDetailCard: React.FC<ProblemStatementDetailCardProps> = ({
  ps,
  team,
  hasSelected,
  isSelected,
  slotsRemaining,
  slotsOver,
  selecting,
  selectedStack,
  isLead = true,
  setSelecting,
  setSelectedStack,
  onSelectProblemStatement
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col relative ${
      isSelected 
        ? 'border-2 border-emerald-500 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]' 
        : 'border border-slate-200 dark:border-slate-700'
    }`}>
      {isSelected && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
      )}
      
      <div className="p-8 md:p-12 flex-1 relative z-10">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-600 uppercase tracking-wider">
            Track: {ps.track}
          </span>
          <div className="flex flex-wrap gap-2">
            {ps.slotLimit > 0 && (
              <span className={`text-sm px-4 py-2 rounded-xl font-bold uppercase tracking-wider ${
                slotsOver 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}>
                {slotsOver ? 'Slots Over' : `${slotsRemaining} Slots Left`}
              </span>
            )}
            {isSelected && (
              <span className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-xl font-black shadow-sm uppercase tracking-wider flex items-center">
                <Lock className="w-4 h-4 mr-2" /> Locked
              </span>
            )}
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-8 leading-tight">{ps.title}</h1>
        
        <div className="w-full max-w-full mb-10">
          {renderStructuredDescription(ps.description)}
        </div>
        
        {isSelected && team?.selectedStack && (
          <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 inline-block w-full sm:w-auto">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Selected Stack</p>
            <p className="text-2xl text-emerald-800 dark:text-emerald-300 font-bold">{team.selectedStack}</p>
          </div>
        )}
      </div>
      
      {!hasSelected && (
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
          {slotsOver ? (
             <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-center">
               <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
               <h4 className="font-bold text-red-800 dark:text-red-400 text-lg">Slots Over</h4>
               <p className="text-red-600 dark:text-red-300/80 mt-1">This problem statement has reached its maximum capacity and cannot be selected.</p>
             </div>
          ) : isLead === false ? (
            <div className="p-5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                  Problem statement selection is reserved for your Team Leader (<span className="text-[#3760F8] font-bold">{team?.leadName || 'Team Lead'}</span>).
                </p>
              </div>
            </div>
          ) : selecting ? (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 ml-1">Enter Proposed Tech Stack *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Next.js, React Native, Python, TensorFlow..."
                  className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white shadow-sm font-medium"
                  value={selectedStack}
                  onChange={(e) => setSelectedStack(e.target.value)}
                />
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Once you lock this selection, it cannot be changed. Are you sure you want to proceed?</p>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => { setSelecting(false); setSelectedStack(''); }}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSelectProblemStatement}
                  className="flex-[2] flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 text-lg"
                >
                  <Target className="w-6 h-6 mr-2" /> Confirm & Lock
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setSelecting(true);
                setSelectedStack('');
              }}
              className="w-full md:w-auto md:px-12 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 text-lg"
            >
              <Target className="w-6 h-6 mr-2" /> Select Problem Statement
            </button>
          )}
        </div>
      )}
    </div>
  );
};
