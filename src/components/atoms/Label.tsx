import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className = '', ...props }) => {
  return (
    <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 ${className}`} {...props}>
      {children}
    </label>
  );
};
