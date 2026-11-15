import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-700/50 p-6 md:p-8 shadow-2xl ${className}`} {...props}>
      {children}
    </div>
  );
};
