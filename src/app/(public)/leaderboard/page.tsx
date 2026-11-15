"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trophy, Maximize2, Minimize2, Filter, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LeaderboardTable } from '@/components/organisms/LeaderboardTable';
import { LeaderboardPodium } from '@/components/organisms/LeaderboardPodium';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLeaderboardAction, getPublicSettingsAction } from '@/server/actions/settings.actions';
import { meAction } from '@/server/actions/user.actions';
import { BrandLogo } from '@/components/atoms/BrandLogo';

export default function LeaderboardPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    meAction().then((res: any) => {
      if (res.success && res.user) {
        const r = res.user.role;
        if (r === 'admin' || r === 'sub-admin' || r === 'judge') {
          setIsStaff(true);
        }
      }
    });
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/team/dashboard');
    }
  };
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [isBigScreen, setIsBigScreen] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState({ round: false, judge: false, problemStatement: false });
  
  const [tracks, setTracks] = useState<string[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [problemStatements, setProblemStatements] = useState<any[]>([]);
  
  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const [selectedRound, setSelectedRound] = useState<string>('All');
  const [selectedJudge, setSelectedJudge] = useState<string>('All');
  const [selectedProblem, setSelectedProblem] = useState<string>('All');

  const fetchData = async () => {
    const settingsRes = await getPublicSettingsAction();
    if (settingsRes.success && (settingsRes as any).settings?.leaderboardFilters) {
      setActiveFilters((settingsRes as any).settings.leaderboardFilters);
    }
    
    const data = await getLeaderboardAction();
    if (data.success && (data as any).evaluations) {
      setIsHidden(false);
      setEvaluations((data as any).evaluations);
      
      const uniqueTracks = new Set<string>();
      const uniqueRounds = new Map<string, any>();
      const uniqueJudges = new Map<string, any>();
      const uniqueProblems = new Map<string, any>();
      
      (data as any).evaluations.forEach((item: any) => {
        if (item.teamId?.problemStatementId?.track) {
          uniqueTracks.add(item.teamId.problemStatementId.track);
        }
        if (item.roundId?._id) uniqueRounds.set(item.roundId._id, item.roundId);
        if (item.judgeId?._id) uniqueJudges.set(item.judgeId._id, item.judgeId);
        if (item.teamId?.problemStatementId?._id) uniqueProblems.set(item.teamId.problemStatementId._id, item.teamId.problemStatementId);
      });
      
      setTracks(Array.from(uniqueTracks));
      setRounds(Array.from(uniqueRounds.values()));
      setJudges(Array.from(uniqueJudges.values()));
      setProblemStatements(Array.from(uniqueProblems.values()));
    } else if (!data.success && (data as any).hidden) {
      setIsHidden(true);
      setHiddenMessage((data as any).message || 'The organizers have temporarily hidden the leaderboard. Check back later for the final results!');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLeaderboard = useMemo(() => {
    const filteredEvals = evaluations.filter(ev => {
      let matches = true;
      if (selectedTrack !== 'All' && ev.teamId?.problemStatementId?.track !== selectedTrack) matches = false;
      if (activeFilters.round && selectedRound !== 'All' && ev.roundId?._id !== selectedRound) matches = false;
      if (activeFilters.judge && selectedJudge !== 'All' && ev.judgeId?._id !== selectedJudge) matches = false;
      if (activeFilters.problemStatement && selectedProblem !== 'All' && ev.teamId?.problemStatementId?._id !== selectedProblem) matches = false;
      return matches;
    });

    const teamScores: Record<string, { team: any, scores: number[], total: number }> = {};
    
    filteredEvals.forEach(ev => {
      if (!ev.teamId) return;
      const tId = ev.teamId._id.toString();
      if (!teamScores[tId]) {
        teamScores[tId] = { team: ev.teamId, scores: [], total: 0 };
      }
      teamScores[tId].scores.push(ev.totalScore);
    });

    return Object.values(teamScores).map(item => {
      const avgScore = item.scores.reduce((a, b) => a + b, 0) / item.scores.length;
      return {
        team: item.team,
        score: Number(avgScore.toFixed(2)),
        reviews: item.scores.length
      };
    }).sort((a, b) => b.score - a.score);
  }, [evaluations, selectedTrack, selectedRound, selectedJudge, selectedProblem, activeFilters]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsBigScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsBigScreen(false);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 transition-all duration-500 relative font-sans flex flex-col`}>
      {/* Main Content Area */}
      <div className={`relative flex-1 w-full overflow-hidden flex flex-col ${isBigScreen ? 'p-6 md:p-12' : 'p-4 md:p-8 lg:p-12'}`}>
        
        {/* Vibrant Background Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-amber-300/40 blur-[120px] mix-blend-multiply animate-pulse duration-1000" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-300/40 blur-[120px] mix-blend-multiply" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col">
          
          {/* Header Controls */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/50">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto">
              <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity flex-shrink-0" title="Home">
                <BrandLogo size="md" />
              </Link>

              <div className="h-8 w-px bg-slate-200/80 hidden sm:block flex-shrink-0" />

              <div className="flex items-center gap-3.5">
                {!isBigScreen && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 flex-shrink-0"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className={`p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-md shadow-amber-500/25 flex-shrink-0 ${isBigScreen ? 'p-3.5 scale-110 mx-2' : ''}`}>
                  <Trophy className={isBigScreen ? 'w-8 h-8' : 'w-6 h-6'} />
                </div>
                <div>
                  <h1 className={`font-black tracking-tight text-slate-900 leading-none ${isBigScreen ? 'text-5xl mb-2' : 'text-2xl sm:text-3xl'}`}>
                    Live Leaderboard
                  </h1>
                  <p className={`text-slate-500 font-bold ${isBigScreen ? 'text-xl mt-1.5' : 'text-xs mt-1 uppercase tracking-wider'}`}>
                    Real-time Hackathon Rankings
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                <div className="relative group min-w-[140px]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-indigo-500" />
                  </div>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none appearance-none shadow-sm hover:border-indigo-300 transition-all cursor-pointer text-sm"
                  >
                    <option value="All">All Tracks</option>
                    {tracks.map(track => (
                      <option key={track} value={track}>{track}</option>
                    ))}
                  </select>
                </div>

                {activeFilters.round && (
                  <div className="relative group min-w-[140px]">
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none appearance-none shadow-sm hover:border-indigo-300 transition-all cursor-pointer text-sm"
                    >
                      <option value="All">All Rounds</option>
                      {rounds.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeFilters.judge && (
                  <div className="relative group min-w-[140px]">
                    <select
                      value={selectedJudge}
                      onChange={(e) => setSelectedJudge(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none appearance-none shadow-sm hover:border-indigo-300 transition-all cursor-pointer text-sm"
                    >
                      <option value="All">All Judges</option>
                      {judges.map(j => (
                        <option key={j._id} value={j._id}>{j.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeFilters.problemStatement && (
                  <div className="relative group min-w-[180px] max-w-[200px]">
                    <select
                      value={selectedProblem}
                      onChange={(e) => setSelectedProblem(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none appearance-none shadow-sm hover:border-indigo-300 transition-all cursor-pointer text-sm truncate"
                    >
                      <option value="All">All Problem Statements</option>
                      {problemStatements.map(p => (
                        <option key={p._id} value={p._id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-3.5 bg-white border-2 border-slate-100 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                title="Toggle Full Screen"
              >
                {isBigScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
            </div>
          </motion.div>

          {isHidden ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col justify-center items-center text-center py-32 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl border border-slate-200/60">
              <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-inner">
                <Trophy className="w-16 h-16 text-indigo-300" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-4">Results Hidden</h2>
              <p className="text-slate-500 text-xl max-w-md font-medium leading-relaxed">{hiddenMessage}</p>
            </motion.div>
          ) : (!loading && filteredLeaderboard.length === 0) ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col justify-center items-center text-center py-32 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-xl border border-slate-200/60">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-inner">
                <Sparkles className="w-16 h-16 text-slate-400" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-4">Awaiting Scores!</h2>
              <p className="text-slate-500 text-xl max-w-md font-medium leading-relaxed">The leaderboard is currently empty. It will automatically update as soon as judges submit their evaluations.</p>
            </motion.div>
          ) : (
            <>
              {filteredLeaderboard.length >= 1 && (
                <LeaderboardPodium topTeams={filteredLeaderboard.slice(0, 3)} isBigScreen={isBigScreen} isStaff={isStaff} />
              )}
              {filteredLeaderboard.length > 3 && (
                <LeaderboardTable 
                  filteredLeaderboard={filteredLeaderboard.slice(3)} 
                  isBigScreen={isBigScreen} 
                  loading={loading}
                  startIndex={3}
                  isStaff={isStaff}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
