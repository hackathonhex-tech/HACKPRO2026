import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, fullWidth = false, className = '', ...props }) => {
  const baseStyle = `relative group overflow-hidden font-bold transition-all active:scale-[0.98] flex items-center justify-center ${fullWidth ? 'w-full' : ''}`;
  
  const sizes = {
    sm: "py-2 px-4 text-xs rounded-lg",
    md: "py-3 px-6 text-sm rounded-xl",
    lg: "py-4 px-8 text-base rounded-2xl"
  };
  
  const variants = {
    primary: "bg-[#3760F8] text-white hover:bg-[#2546ED] shadow-lg shadow-[#3760F8]/30",
    secondary: "bg-[#D3FE4F] text-slate-950 border border-[#C2EE38] hover:bg-[#C2EE38] shadow-md shadow-[#D3FE4F]/25 font-black",
    outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/30"
  };

  return (
    <button suppressHydrationWarning className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isLoading || props.disabled} {...props}>
      <span className="relative z-10 flex items-center justify-center">
        {isLoading && <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </span>
    </button>
  );
};
