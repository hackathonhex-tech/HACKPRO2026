"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, Square, Bell, Settings2, RotateCcw } from "lucide-react";

export function AdminTimerControls() {
  const [timerState, setTimerState] = useState<any>(null);
  
  // Set Timer Form State
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputSeconds, setInputSeconds] = useState(0);

  // Auto Buzzer Form State
  const [autoBuzzerMins, setAutoBuzzerMins] = useState(0);
  const [autoBuzzerSecs, setAutoBuzzerSecs] = useState(0);
  const autoBuzzerInitialized = useRef(false);

  const fetchTimer = async () => {
    try {
      const res = await fetch('/api/timer');
      const data = await res.json();
      if (data.success && data.timer) {
        setTimerState(data.timer);
      }
    } catch {
      console.error("Failed to fetch timer state");
    }
  };

  useEffect(() => {
    fetchTimer();
    const interval = setInterval(fetchTimer, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timerState && timerState.autoBuzzerTriggerTime !== undefined && !autoBuzzerInitialized.current) {
      setAutoBuzzerMins(Math.floor(timerState.autoBuzzerTriggerTime / 60));
      setAutoBuzzerSecs(timerState.autoBuzzerTriggerTime % 60);
      autoBuzzerInitialized.current = true;
    }
  }, [timerState]);

  const sendAction = async (action: string, payload: any = {}) => {
    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      fetchTimer();
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  const handleSetTimer = () => {
    const totalSeconds = (inputHours * 3600) + (inputMinutes * 60) + inputSeconds;
    sendAction('SET', { duration: totalSeconds });
  };

  if (!timerState) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Hackathon Timer Controls</h3>
        <p className="text-sm text-slate-500 mt-1">Manage the synchronized countdown timer displayed to the public.</p>
      </div>

      {/* Current Status Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
        timerState.status === 'RUNNING' ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50' : 
        timerState.status === 'PAUSED' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50'
      }`}>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Current Status</h2>
          <div className="text-3xl font-black text-slate-800 dark:text-white">
            {timerState.status}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => sendAction('START')}
            disabled={timerState.status === 'RUNNING' || timerState.durationRemaining === 0}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors"
          >
            <Play size={20} />
            Start
          </button>
          
          <button 
            onClick={() => sendAction('PAUSE')}
            disabled={timerState.status !== 'RUNNING'}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-bold rounded-xl transition-colors"
          >
            <Pause size={20} />
            Pause
          </button>
          
          <button 
            onClick={() => sendAction('STOP')}
            disabled={timerState.status === 'STOPPED'}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 text-white font-bold rounded-xl transition-colors"
          >
            <Square size={20} />
            Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Set Timer */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings2 size={20} className="text-indigo-600 dark:text-indigo-400" />
            Set Timer Duration
          </h3>
          
          <div className="flex items-end gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hours</label>
              <input 
                type="number" min="0" value={inputHours} onChange={e => setInputHours(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-xl text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-2xl font-light text-slate-300 pb-2">:</div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Minutes</label>
              <input 
                type="number" min="0" max="59" value={inputMinutes} onChange={e => setInputMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-xl text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-2xl font-light text-slate-300 pb-2">:</div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Seconds</label>
              <input 
                type="number" min="0" max="59" value={inputSeconds} onChange={e => setInputSeconds(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSetTimer}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
          >
            <RotateCcw size={18} />
            Set & Reset Timer
          </button>
        </div>

        {/* Buzzer Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-amber-500" />
            Buzzer Controls
          </h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Automatic Buzzer</p>
                  <p className="text-sm text-slate-500">Play buzzer when timer hits a specific time</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={timerState.automaticBuzzer}
                    onChange={(e) => sendAction('TOGGLE_AUTO_BUZZER', { enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {timerState.automaticBuzzer && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Trigger Buzzer At (Time Remaining):</p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Mins</label>
                      <input 
                        type="number" min="0" max="59" 
                        value={autoBuzzerMins} 
                        onChange={e => setAutoBuzzerMins(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="pb-2 text-slate-300">:</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Secs</label>
                      <input 
                        type="number" min="0" max="59" 
                        value={autoBuzzerSecs} 
                        onChange={e => setAutoBuzzerSecs(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const btn = document.getElementById('save-buzzer-btn');
                        if (btn) btn.innerText = 'Saving...';
                        await sendAction('SET_AUTO_BUZZER_TIME', { triggerTime: (autoBuzzerMins * 60) + autoBuzzerSecs });
                        if (btn) {
                          btn.innerText = 'Saved!';
                          btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
                          btn.classList.remove('bg-slate-800', 'hover:bg-slate-900');
                          setTimeout(() => {
                            btn.innerText = 'Save';
                            btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                            btn.classList.add('bg-slate-800', 'hover:bg-slate-900');
                          }, 2000);
                        }
                      }}
                      id="save-buzzer-btn"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg text-sm transition-colors min-w-[80px]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <button 
                onClick={() => sendAction('TRIGGER_BUZZER')}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/20 dark:text-rose-400 font-bold rounded-xl transition-colors"
              >
                <Bell size={20} />
                Play Buzzer Manually
              </button>
              <p className="text-xs text-center text-slate-400 mt-2">This will immediately play the loud buzzer on all public screens.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
