import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../atoms/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: 'indigo' | 'emerald' | 'amber' | 'purple' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, colorClass }) => {
  const iconBgClasses = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    slate: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    <Card className="!p-5 flex items-center hover:shadow-md transition-shadow group !rounded-2xl">
      <div className={`p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform ${iconBgClasses[colorClass]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </Card>
  );
};
