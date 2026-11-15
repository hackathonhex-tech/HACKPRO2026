import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'amber' | 'emerald' | 'purple' | 'slate' | 'red' | 'secondary' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'indigo', className = '', ...props }) => {
  const variants = {
    indigo: "bg-[#3760F8]/10 text-[#3760F8] border-[#3760F8]/20 dark:bg-[#3760F8]/20 dark:text-[#92B1FD] dark:border-[#3760F8]/30",
    primary: "bg-[#3760F8] text-white border-transparent",
    secondary: "bg-[#D3FE4F]/25 text-slate-900 border-[#D3FE4F]/50 dark:bg-[#D3FE4F]/20 dark:text-[#D3FE4F] dark:border-[#D3FE4F]/40 font-extrabold",
    amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
  };

  return (
    <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-bold ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
