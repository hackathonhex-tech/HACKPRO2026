"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy } from 'lucide-react';

interface PodiumItem {
  team: any;
  score: number;
  reviews: number;
}

interface LeaderboardPodiumProps {
  topTeams: PodiumItem[];
  isBigScreen: boolean;
  isStaff?: boolean;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ topTeams, isBigScreen, isStaff = false }) => {
  if (!topTeams || topTeams.length === 0) return null;

  const rank1 = topTeams[0];
  const rank2 = topTeams[1];
  const rank3 = topTeams[2];

  const podiumData = [
    { 
      rank: 2, 
      data: rank2, 
      podiumHeight: isBigScreen ? '180px' : '120px',
      colorFront: 'bg-gradient-to-b from-slate-300 to-slate-400',
      colorTop: 'bg-gradient-to-br from-slate-200 to-slate-300',
      shadowColor: 'slate-500/30',
      iconColor: 'text-slate-500',
      delay: 0.2
    },
    { 
      rank: 1, 
      data: rank1, 
      podiumHeight: isBigScreen ? '260px' : '180px',
      colorFront: 'bg-gradient-to-b from-amber-400 to-amber-500',
      colorTop: 'bg-gradient-to-br from-amber-300 to-amber-400',
      shadowColor: 'amber-600/40',
      iconColor: 'text-amber-500',
      delay: 0.4
    },
    { 
      rank: 3, 
      data: rank3, 
      podiumHeight: isBigScreen ? '140px' : '90px',
      colorFront: 'bg-gradient-to-b from-orange-400 to-orange-500',
      colorTop: 'bg-gradient-to-br from-orange-300 to-orange-400',
      shadowColor: 'orange-600/30',
      iconColor: 'text-orange-500',
      delay: 0.6
    }
  ];

  return (
    <div className={`relative flex items-end justify-center w-full max-w-5xl mx-auto gap-4 md:gap-8 mb-16 mt-12 ${isBigScreen ? 'mt-24 mb-32' : ''}`}>
      {podiumData.map((item) => {
        if (!item.data) return <div key={`empty-${item.rank}`} className="w-1/3 max-w-[280px]" />;

        return (
          <div key={item.rank} className="relative flex flex-col items-center justify-end w-1/3 max-w-[280px] h-[400px]">
            
            {/* Floating Team Card */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: [0, -10, 0], opacity: 1 }}
              transition={{ 
                y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: item.delay },
                opacity: { duration: 0.5, delay: item.delay }
              }}
              className="z-20 w-full px-2 mb-4 md:mb-8"
            >
              <div className="bg-white/90 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] shadow-2xl border border-white flex flex-col items-center text-center hover:scale-105 transition-transform cursor-default">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-inner flex items-center justify-center mb-3 ${item.iconColor}`}>
                  {item.rank === 1 ? <Trophy className="w-6 h-6 md:w-8 md:h-8" /> : <Medal className="w-6 h-6 md:w-8 md:h-8" />}
                </div>
                
                <h3 className={`font-black text-slate-800 line-clamp-2 leading-tight mb-1 ${isBigScreen ? 'text-3xl' : 'text-lg md:text-xl'}`}>
                  {isStaff ? item.data.team.name : `Rank #${item.rank}`}
                </h3>
                
                {isStaff && (
                  <span className={`font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-4 ${isBigScreen ? 'text-sm' : 'text-[10px] md:text-xs'}`}>
                    {item.data.team.uniqueId}
                  </span>
                )}
                
                <div className="flex flex-col items-center">
                  <span className={`font-black ${item.iconColor} ${isBigScreen ? 'text-5xl' : 'text-3xl md:text-4xl'} drop-shadow-sm`}>
                    {item.data.score}
                  </span>
                  <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Points
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 3D Cylindrical Podium Base */}
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: item.podiumHeight }} 
              transition={{ delay: item.delay, type: "spring", stiffness: 50, damping: 15 }}
              className="relative w-[85%] md:w-[75%] flex-shrink-0 z-10"
            >
              {/* Cylinder Body (Front face) */}
              <div className={`absolute bottom-0 w-full h-[calc(100%-20px)] md:h-[calc(100%-30px)] ${item.colorFront} rounded-b-[2rem] shadow-2xl shadow-${item.shadowColor}`} />
              
              {/* Cylinder Top (Top face) */}
              <div className={`absolute top-0 w-full h-[40px] md:h-[60px] ${item.colorTop} rounded-[50%] shadow-inner border-[3px] border-white/40 flex items-center justify-center overflow-hidden`} >
                <span className="text-white/60 font-black text-5xl md:text-7xl transform scale-y-50 translate-y-2 select-none">
                  {item.rank}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              </div>
            </motion.div>

          </div>
        );
      })}
      
      {/* Stage Floor Glow/Shadow */}
      <div className="absolute bottom-[-20px] w-full max-w-4xl h-[60px] bg-indigo-900/10 blur-2xl rounded-[100%] pointer-events-none z-0" />
    </div>
  );
};
