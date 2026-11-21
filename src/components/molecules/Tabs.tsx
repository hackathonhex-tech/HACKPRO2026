import React from 'react';

export interface TabOption {
  id: string;
  label: string;
}

export interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ options, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xs w-fit ${className}`}>
      {options.map((option) => {
        const isActive = activeTab === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all outline-none select-none ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
