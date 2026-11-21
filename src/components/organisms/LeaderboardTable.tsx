"use client";
import React, { useState } from 'react';
import { Medal } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Pagination } from '../molecules/Pagination';

interface LeaderboardTableProps {
  filteredLeaderboard: any[];
  isBigScreen: boolean;
  loading: boolean;
  startIndex?: number;
  isStaff?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ filteredLeaderboard, isBigScreen, loading, startIndex = 0, isStaff = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedItems = filteredLeaderboard.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-indigo-900/5 overflow-hidden border border-slate-200/60 flex-1 flex flex-col p-8 space-y-4 animate-pulse">
        <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2"></div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 w-full bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl flex items-center px-6 gap-6">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg hidden sm:block"></div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl ml-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-indigo-900/5 overflow-hidden border border-slate-200/60 flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className={`bg-slate-50 border-b border-slate-200 uppercase tracking-widest ${isBigScreen ? 'text-xl' : 'text-xs'}`}>
              <th className="px-8 py-6 font-black text-slate-400 text-center w-32">Rank</th>
              <th className="px-8 py-6 font-black text-slate-400">{isStaff ? 'Team Details' : 'Rank Entry'}</th>
              <th className="px-8 py-6 font-black text-slate-400">Track / Problem</th>
              <th className="px-8 py-6 font-black text-slate-400 text-right">Score</th>
            </tr>
          </thead>
          <motion.tbody variants={containerVariants} initial="hidden" animate="show">
            {paginatedItems.map((item, index) => {
              const actualRank = (currentPage - 1) * pageSize + index + startIndex + 1;
              const isGold = actualRank === 1;
              const isSilver = actualRank === 2;
              const isBronze = actualRank === 3;
              
              return (
                <motion.tr 
                  variants={itemVariants}
                  key={item.team._id} 
                  className={`border-b border-slate-100 transition-colors group ${
                    isGold ? 'bg-gradient-to-r from-amber-50 to-orange-50/30 hover:from-amber-100 hover:to-orange-100' : 
                    isSilver ? 'bg-gradient-to-r from-slate-50 to-gray-50/50 hover:from-slate-100 hover:to-gray-100' :
                    isBronze ? 'bg-gradient-to-r from-orange-50/50 to-red-50/30 hover:from-orange-100/50 hover:to-red-100/30' : 
                    'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-8 py-6 text-center">
                    {isGold ? (
                      <div className={`mx-auto bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 ${isBigScreen ? 'w-24 h-24' : 'w-14 h-14'}`}>
                        <Medal className={`${isBigScreen ? 'w-12 h-12' : 'w-7 h-7'}`} />
                      </div>
                    ) : isSilver ? (
                      <div className={`mx-auto bg-gradient-to-br from-slate-300 to-slate-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-400/40 ${isBigScreen ? 'w-24 h-24' : 'w-14 h-14'}`}>
                        <span className={`font-black ${isBigScreen ? 'text-5xl' : 'text-2xl'}`}>2</span>
                      </div>
                    ) : isBronze ? (
                      <div className={`mx-auto bg-gradient-to-br from-orange-300 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 ${isBigScreen ? 'w-24 h-24' : 'w-14 h-14'}`}>
                        <span className={`font-black ${isBigScreen ? 'text-5xl' : 'text-2xl'}`}>3</span>
                      </div>
                    ) : (
                      <div className={`mx-auto flex items-center justify-center ${isBigScreen ? 'w-24 h-24' : 'w-14 h-14'}`}>
                        <span className={`font-black text-slate-300 ${isBigScreen ? 'text-5xl' : 'text-2xl'}`}>#{actualRank}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <p className={`font-black text-slate-900 group-hover:text-indigo-600 transition-colors ${isBigScreen ? 'text-5xl mb-4' : 'text-xl mb-1.5'}`}>
                      {isStaff ? item.team.name : `Rank #${actualRank}`}
                    </p>
                    {isStaff && (
                      <span className={`text-indigo-600 font-mono font-bold bg-indigo-50 inline-block rounded-md px-2.5 py-1 ${isBigScreen ? 'text-2xl' : 'text-xs'}`}>
                        {item.team.uniqueId}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`inline-flex items-center bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-black uppercase tracking-wider ${isBigScreen ? 'px-4 py-2 text-xl' : 'px-3 py-1 text-[10px]'}`}>
                        {item.team.problemStatementId?.track || 'N/A'}
                      </span>
                      <span className={`font-bold text-slate-500 ${isBigScreen ? 'text-2xl' : 'text-sm'}`}>
                        {item.team.problemStatementId?.title || 'Unknown Project'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className={`font-black tabular-nums tracking-tighter ${
                      isGold ? 'text-amber-500 drop-shadow-sm' :
                      isSilver ? 'text-slate-500' :
                      isBronze ? 'text-orange-500' :
                      'text-slate-700'
                    } ${isBigScreen ? 'text-[6rem] leading-none' : 'text-[2.5rem]'}`}>
                      {item.score}
                    </p>
                    <p className={`text-slate-400 font-bold uppercase tracking-wider mt-1 ${isBigScreen ? 'text-xl' : 'text-xs'}`}>
                      {item.reviews} Review{item.reviews !== 1 ? 's' : ''}
                    </p>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {filteredLeaderboard.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLeaderboard.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

