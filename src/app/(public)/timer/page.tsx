"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicProblemStatementsAction } from "@/server/actions/problem-statements.actions";

function playBuzzer() {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  
  const playBeep = (startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth'; // Harsh buzzer tone
    osc.frequency.setValueAtTime(440, startTime); // A4
    osc.frequency.exponentialRampToValueAtTime(220, startTime + duration); // pitch drop
    
    // Envelope to prevent clicking
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + 0.05);
    gain.gain.setValueAtTime(1, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;
  // 3 quick warning beeps followed by a long final beep
  playBeep(now, 0.2);
  playBeep(now + 0.3, 0.2);
  playBeep(now + 0.6, 0.2);
  playBeep(now + 0.9, 1.0);
}

// Dynamic Aurora Background Component
const BackgroundAurora = () => {
  // Deterministic array of particles (no Math.random to prevent hydration mismatch)
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    top: `${(i * 23) % 100}%`,
    duration: 20 + ((i * 7) % 20),
    delay: (i * 3) % 15,
    size: 2 + ((i * 5) % 4) // 2px to 5px
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50">
      {/* Orb 1: Brand Blue */}
      <motion.div
        animate={{
          x: ["-20%", "20%", "-10%", "-20%"],
          y: ["-20%", "10%", "30%", "-20%"],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#3760F8]/10 blur-[100px] sm:blur-[140px]"
      />
      {/* Orb 2: Light Blue */}
      <motion.div
        animate={{
          x: ["10%", "-20%", "20%", "10%"],
          y: ["20%", "-10%", "10%", "20%"],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] right-[0%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[100px] sm:blur-[140px]"
      />

      {/* Tech Dot-Matrix Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#3760F8 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px"
        }}
      />

      {/* Floating Glowing Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#3760F8] shadow-[0_0_8px_rgba(60,44,218,0.8)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["100px", "-800px"],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Single Digit component with True Split-Flap animation
const Digit = ({ value }: { value: string }) => {
  return (
    <div className="flex flex-col items-center mx-[1px] sm:mx-[2px]">
      <div 
        className="relative w-16 h-24 sm:w-28 sm:h-40 rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.4)] bg-[#3760F8]"
        style={{ perspective: "1000px" }}
      >
        {/* TOP HALVES (Exiting is on top, flipping down) */}
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={value}
            initial={{ zIndex: 1 }}
            animate={{ zIndex: 1, transition: { duration: 0 } }}
            exit={{ zIndex: 2, transition: { duration: 0.3 } }}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ rotateX: 0 }} 
              animate={{ rotateX: 0 }} 
              exit={{ rotateX: -90, transition: { duration: 0.3, ease: "easeIn" } }} 
              style={{ transformOrigin: "center", backfaceVisibility: "hidden", clipPath: "inset(0 0 50% 0)" }}
              className="absolute inset-0 bg-[#3760F8] rounded-sm"
            >
              <div className="absolute inset-0 flex items-center justify-center text-[4rem] sm:text-[7rem] font-dseg text-white tracking-tighter leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {value}
              </div>
              <div className="absolute inset-0 bg-black/10 h-1/2 rounded-t-sm" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM HALVES (Entering is on top, flipping down) */}
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={value}
            initial={{ zIndex: 2 }}
            animate={{ zIndex: 2, transition: { duration: 0.6 } }}
            exit={{ zIndex: 1, transition: { duration: 0.6 } }}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ rotateX: 90 }} 
              animate={{ rotateX: 0, transition: { duration: 0.3, delay: 0.3, ease: "easeOut" } }} 
              exit={{ rotateX: 0, transition: { duration: 0.6 } }}
              style={{ transformOrigin: "center", backfaceVisibility: "hidden", clipPath: "inset(50% 0 0 0)" }}
              className="absolute inset-0 bg-[#3760F8] rounded-sm"
            >
              <div className="absolute inset-0 flex items-center justify-center text-[4rem] sm:text-[7rem] font-dseg text-white tracking-tighter leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {value}
              </div>
              {/* Darker shadow on the bottom half to simulate depth */}
              <div className="absolute inset-0 bg-black/20 mt-1/2 h-1/2 rounded-b-sm pointer-events-none" style={{ clipPath: "inset(50% 0 0 0)" }} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        
        {/* The horizontal split line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] sm:h-[2px] bg-black/40 z-30" />
      </div>
    </div>
  );
};

const DigitGroup = ({ valueStr, label }: { valueStr: string, label: string }) => {
  return (
    <div className="flex flex-col items-center mx-2 sm:mx-4">
      <div className="flex">
        <Digit value={valueStr[0]} />
        <Digit value={valueStr[1]} />
      </div>
      <span className="mt-4 sm:mt-6 text-xs sm:text-[13px] font-bold text-slate-500 uppercase tracking-[0.3em]">{label}</span>
    </div>
  );
};

export default function TimerPage() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerState, setTimerState] = useState<any>(null);
  const [problemStatements, setProblemStatements] = useState<any[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const lastBuzzerTrigger = useRef<string | null>(null);
  const hasTriggeredZeroBuzzer = useRef<boolean>(false);

  const fetchTimerAndStats = async () => {
    try {
      // Fetch Timer
      const res = await fetch('/api/timer');
      const data = await res.json();
      if (data.success && data.timer) {
        setTimerState(data.timer);
      }
      
      // Fetch Problem Statement Slots
      const psRes = await getPublicProblemStatementsAction();
      if (psRes.success && psRes.problemStatements) {
        setProblemStatements(psRes.problemStatements);
      }
    } catch {
      console.error("Failed to fetch state");
    }
  };

  // Poll server state every 3 seconds
  useEffect(() => {
    fetchTimerAndStats();
    const interval = setInterval(fetchTimerAndStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync animation frames locally
  useEffect(() => {
    let animationFrame: number;
    
    const updateTime = () => {
      if (!timerState) return;

      if (timerState.status === 'RUNNING' && timerState.endTime) {
        const end = new Date(timerState.endTime).getTime();
        const diff = Math.max(0, end - Date.now());
        const secondsLeft = Math.ceil(diff / 1000);
        setTimeLeft(secondsLeft);
        
        // Auto Buzzer logic
        const triggerTime = timerState.autoBuzzerTriggerTime || 0;
        if (secondsLeft <= triggerTime && timerState.automaticBuzzer && !hasTriggeredZeroBuzzer.current) {
           if (hasInteracted) playBuzzer();
           hasTriggeredZeroBuzzer.current = true;
        } else if (secondsLeft > triggerTime) {
           hasTriggeredZeroBuzzer.current = false;
        }

      } else {
        setTimeLeft(timerState.durationRemaining);
        // Reset zero buzzer flag if we are paused or stopped above the trigger time
        const triggerTime = timerState.autoBuzzerTriggerTime || 0;
        if (timerState.durationRemaining > triggerTime) {
          hasTriggeredZeroBuzzer.current = false;
        }
      }

      animationFrame = requestAnimationFrame(updateTime);
    };

    animationFrame = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrame);
  }, [timerState, hasInteracted]);

  // Listen for manual buzzer
  useEffect(() => {
    if (timerState?.lastManualBuzzer) {
      if (lastBuzzerTrigger.current && lastBuzzerTrigger.current !== timerState.lastManualBuzzer) {
        // A new manual buzzer was triggered
        if (hasInteracted) playBuzzer();
      }
      lastBuzzerTrigger.current = timerState.lastManualBuzzer;
    }
  }, [timerState?.lastManualBuzzer, hasInteracted]);

  // Format time
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-x-hidden" onClick={() => setHasInteracted(true)}>
      {/* Background depth layers */}
      <BackgroundAurora />

      <style dangerouslySetInnerHTML={{__html: `
        @font-face {
          font-family: 'DSEG7Classic';
          src: url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2') format('woff2');
        }
        .font-dseg {
          font-family: 'DSEG7Classic', monospace;
        }
      `}} />

      {/* TIMER HERO SECTION */}
      <div className="relative min-h-screen flex flex-col items-center pt-32 sm:pt-40 pb-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none" />
        
        {!hasInteracted && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-medium animate-bounce z-50 shadow-[0_10px_20px_rgba(0,0,0,0.2)] cursor-pointer tracking-wide border border-slate-700">
            Click anywhere to enable audio
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="mb-8 sm:mb-12">
            <div className="bg-emerald-500 text-white px-6 py-2 sm:px-8 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md shadow-emerald-500/30">
              Hackathon In Progress
            </div>
          </div>

          <div className="flex items-start justify-center">
            <DigitGroup valueStr={hStr} label="Hours" />
            <div className="flex flex-col gap-4 sm:gap-6 mx-1 sm:mx-2 mt-8 sm:mt-16">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#3760F8]/70 shadow-sm"></div>
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#3760F8]/70 shadow-sm"></div>
            </div>
            <DigitGroup valueStr={mStr} label="Minutes" />
            <div className="flex flex-col gap-4 sm:gap-6 mx-1 sm:mx-2 mt-8 sm:mt-16">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#3760F8]/70 shadow-sm"></div>
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#3760F8]/70 shadow-sm"></div>
            </div>
            <DigitGroup valueStr={sStr} label="Seconds" />
          </div>

          <div className="mt-12 sm:mt-16 text-xs sm:text-[14px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-12">
            Time Remaining
          </div>

          {/* AGGREGATE SLOT COUNTER */}
          {(() => {
            const totalSlots = problemStatements.reduce((sum, ps) => sum + (ps.slotLimit || 0), 0);
            const filledSlots = problemStatements.reduce((sum, ps) => sum + (ps.slotsFilled || 0), 0);
            const slotsLeft = Math.max(0, totalSlots - filledSlots);
            const isSlotsFull = totalSlots > 0 && slotsLeft === 0;
            const fillPercentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
            const isClosingSoon = !isSlotsFull && fillPercentage >= 85 && totalSlots > 0;

            if (totalSlots === 0) return null;

            return (
              <div className="flex flex-col items-center w-full max-w-lg px-8 py-6 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between w-full mb-4">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">
                    Total Registration Slots
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${isSlotsFull ? 'text-rose-500' : 'text-[#3760F8]'}`}>
                      {filledSlots}
                    </span>
                    <span className="text-slate-400 font-bold text-sm">/</span>
                    <span className="text-slate-700 font-bold text-sm">{totalSlots}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full bg-slate-200/80 rounded-full h-3 mb-5 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isSlotsFull ? 'bg-rose-500' : isClosingSoon ? 'bg-amber-500' : 'bg-[#3760F8]'}`}
                  ></motion.div>
                </div>
                
                {/* Status Message */}
                <div className="h-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isSlotsFull ? (
                      <motion.div 
                        key="full"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="bg-rose-100 text-rose-600 px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase border border-rose-200 shadow-sm"
                      >
                        SLOTS CLOSED
                      </motion.div>
                    ) : isClosingSoon ? (
                      <motion.div 
                        key="soon"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="bg-amber-100 text-amber-600 px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase border border-amber-200 shadow-sm flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        HURRY UP! SLOTS CLOSING SOON
                      </motion.div>
                    ) : (
                       <motion.div 
                        key="open"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                      >
                        Registrations Open
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}

          {/* INLINE PROBLEM STATEMENTS GRID */}
          {problemStatements.length > 0 && (
            <div className="w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 mt-16 z-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {problemStatements.map((ps, idx) => {
                  const slotsFilled = ps.slotsFilled || 0;
                  const slotsLeft = Math.max(0, ps.slotLimit - slotsFilled);
                  const isFull = slotsLeft === 0;
                  const fillPercentage = Math.min(100, Math.round((slotsFilled / ps.slotLimit) * 100));
                  
                  return (
                    <div key={`${ps._id}-${idx}`} className={`relative overflow-hidden p-6 rounded-[1.5rem] border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isFull ? 'bg-rose-50/90 border-rose-200' : 'bg-white/80 backdrop-blur-md border-indigo-100/60'}`}>
                      
                      {/* Background gradient hint */}
                      <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl rounded-full pointer-events-none opacity-40 ${isFull ? 'bg-rose-400' : 'bg-[#3760F8]'}`} />

                      <div className="relative z-10 flex justify-between items-start mb-6">
                        <span className="text-[9px] uppercase font-extrabold tracking-widest text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-200/50">
                          {ps.track || 'Track'}
                        </span>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Slots Left</span>
                          <motion.div 
                             key={slotsLeft}
                             initial={{ scale: 1.5, color: '#10b981' }}
                             animate={{ scale: 1, color: isFull ? '#f43f5e' : '#334155' }}
                             transition={{ duration: 0.5, type: "spring" }}
                             className={`text-3xl font-black font-dseg leading-none ${isFull ? 'text-rose-500' : 'text-slate-700'}`}>
                             {slotsLeft.toString().padStart(2, '0')}
                          </motion.div>
                        </div>
                      </div>
                      
                      <h3 className={`relative z-10 text-base sm:text-lg font-extrabold leading-tight mb-6 min-h-[3rem] ${isFull ? 'text-slate-500' : 'text-slate-800'}`}>
                        {ps.title}
                      </h3>
                      
                      {/* Progress Bar */}
                      <div className="relative z-10 w-full bg-slate-200/60 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-[#3760F8]'}`}
                        ></motion.div>
                      </div>
                      
                      <div className="relative z-10 flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className={isFull ? 'text-rose-500' : 'text-[#3760F8]'}>{fillPercentage}% Filled</span>
                        <span className="text-slate-400">{slotsFilled} / {ps.slotLimit}</span>
                      </div>

                      {isFull && (
                        <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-[1.5rem]">
                          <div className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-rose-500/40 rotate-6 flex items-center gap-2 border-2 border-white">
                             <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                             HOUSE FULL
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
