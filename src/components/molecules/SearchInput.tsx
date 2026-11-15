import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../atoms/Input';

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput: React.FC<SearchInputProps> = ({ className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <Input
        {...props}
        className="pl-11"
        type="search"
      />
    </div>
  );
};
