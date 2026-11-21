"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Check, Camera, RefreshCw, Search, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { IconButton } from '../atoms/IconButton';
import { Tabs } from '../molecules/Tabs';

export interface ScannerBoardProps {
  onScanResult: (result: string) => void;
  teamInfo: any | null;
  message: { text: string; type: 'error' | 'success' | 'info' } | null;
  onToggleAttendance: (memberIndex: number, currentStatus: boolean) => Promise<void>;
  onToggleTeamAttendance?: (currentStatus: boolean) => Promise<void>;
  onReset: () => void;
  loading: boolean;
}

export function ScannerBoard({ onScanResult, teamInfo, message, onToggleAttendance, onToggleTeamAttendance, onReset, loading }: ScannerBoardProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Suppress unhandled play() interruption errors and camera abort throws
  useEffect(() => {
    isMountedRef.current = true;
    const isBenignCameraAbort = (msg: string, name?: string) => {
      return (
        name === 'AbortError' ||
        msg.includes('play()') ||
        msg.includes('interrupted') ||
        msg.includes('media was removed') ||
        msg.includes('RenderedCameraImpl') ||
        msg.includes('onabort') ||
        msg.includes('onerror')
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || '';
      if (isBenignCameraAbort(message, reason?.name)) {
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      const message = event.message || (typeof error === 'string' ? error : error?.message || '');
      if (isBenignCameraAbort(message, error?.name)) {
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError, true);
    return () => {
      isMountedRef.current = false;
      try {
        const qrEl = document.getElementById("qr-reader");
        if (qrEl) {
          const videos = qrEl.getElementsByTagName("video");
          for (let i = 0; i < videos.length; i++) {
            (videos[i] as any).onabort = null;
            (videos[i] as any).onerror = null;
          }
        }
      } catch {}
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (isStartingRef.current) {
      isStartingRef.current = false;
    }

    if (html5QrCodeRef.current) {
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;

      // Safely detach video elements to prevent play() interruption & onabort throws
      try {
        const qrEl = document.getElementById("qr-reader");
        if (qrEl) {
          const videos = qrEl.getElementsByTagName("video");
          for (let i = 0; i < videos.length; i++) {
            const vid = videos[i] as any;
            try {
              vid.onabort = null;
              vid.onerror = null;
              vid.pause();
              if (vid.srcObject && typeof vid.srcObject.getTracks === 'function') {
                vid.srcObject.getTracks().forEach((track: any) => track.stop());
              }
              vid.srcObject = null;
            } catch {}
          }
        }
      } catch {}

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // Silently handle expected stop errors when stopping
      }
    }
    if (isMountedRef.current) {
      setScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isStartingRef.current || !isMountedRef.current) return;
    
    try {
      const qrElement = document.getElementById("qr-reader");
      if (!qrElement) return;

      // Clean up previous scanner instance if any
      if (html5QrCodeRef.current) {
        try {
          const qrEl = document.getElementById("qr-reader");
          if (qrEl) {
            const videos = qrEl.getElementsByTagName("video");
            for (let i = 0; i < videos.length; i++) {
              (videos[i] as any).onabort = null;
              (videos[i] as any).onerror = null;
            }
          }
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch {}
        html5QrCodeRef.current = null;
      }

      isStartingRef.current = true;
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Success
          if (!isMountedRef.current) return;
          setScanning(false);
          try {
            const qrEl = document.getElementById("qr-reader");
            if (qrEl) {
              const videos = qrEl.getElementsByTagName("video");
              for (let i = 0; i < videos.length; i++) {
                (videos[i] as any).onabort = null;
                (videos[i] as any).onerror = null;
              }
            }
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
          } catch {}
          
          setScanResult(decodedText);
          onScanResult(decodedText);
        },
        () => {
          // Frame error - ignore, fires every frame without QR
        }
      );

      // If unmounted or cancelled while starting, stop cleanly
      if (!isMountedRef.current || !isStartingRef.current) {
        try {
          const qrEl = document.getElementById("qr-reader");
          if (qrEl) {
            const videos = qrEl.getElementsByTagName("video");
            for (let i = 0; i < videos.length; i++) {
              (videos[i] as any).onabort = null;
              (videos[i] as any).onerror = null;
            }
          }
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
          html5QrCode.clear();
        } catch {}
        html5QrCodeRef.current = null;
        return;
      }

      setScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        msg.includes('play()') ||
        msg.includes('interrupted') ||
        msg.includes('AbortError') ||
        msg.includes('RenderedCameraImpl') ||
        msg.includes('onabort')
      ) {
        // Benign error from media element cleanup or camera abort
      } else {
        console.error("Camera error:", err);
        if (isMountedRef.current) {
          setShowManual(true);
        }
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [onScanResult]);

  const stopScannerRef = useRef(stopScanner);
  useEffect(() => {
    stopScannerRef.current = stopScanner;
  }, [stopScanner]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!scanResult && !teamInfo && !showManual) {
      timer = setTimeout(() => {
        if (isMountedRef.current && !showManual && !scanResult && !teamInfo) {
          startScanner();
        }
      }, 250);
    } else {
      stopScannerRef.current();
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopScannerRef.current();
    };
  }, [scanResult, showManual, teamInfo, startScanner]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      setScanResult(manualId.trim());
      onScanResult(manualId.trim());
    }
  };

  const resetScanner = useCallback(() => {
    stopScanner();
    setScanResult(null);
    setManualId('');
    setShowManual(false);
    onReset();
  }, [stopScanner, onReset]);

  useEffect(() => {
    if (teamInfo && teamInfo.attendance) {
      const timer = setTimeout(() => {
        resetScanner();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [teamInfo, resetScanner]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto pb-10 pt-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-4">
          <Camera className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">QR Check-in Scanner</h2>
        <p className="text-slate-500 mt-2">Scan participant tickets or enter Team ID manually.</p>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key="scanner"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={scanResult || teamInfo ? 'hidden' : 'block'}
        >
          <div className="flex justify-center mb-6">
            <Tabs
              options={[
                { id: 'camera', label: 'Camera Scan' },
                { id: 'manual', label: 'Manual Entry' }
              ]}
              activeTab={showManual ? 'manual' : 'camera'}
              onChange={(tabId) => {
                if (tabId === 'manual') {
                  stopScanner();
                  setShowManual(true);
                } else {
                  setShowManual(false);
                }
              }}
            />
          </div>

          {/* Keep both views mounted in DOM so #qr-reader is not abruptly removed */}
          <div className={showManual ? 'block' : 'hidden'}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8">
              <form onSubmit={handleManualSearch} className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter Team ID</label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={manualId}
                    onChange={e => setManualId(e.target.value)}
                    placeholder="e.g. TM-C5D255"
                    className="text-lg font-mono font-bold tracking-wider text-center uppercase"
                  />
                  <IconButton type="submit" variant="primary" icon={<Search className="w-5 h-5" />} />
                </div>
              </form>
            </div>
          </div>

          <div className={showManual ? 'hidden' : 'block'}>
            <div className={`bg-black rounded-3xl shadow-xl overflow-hidden relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-center' : 'border border-slate-100 dark:border-slate-700/50'}`}>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              <div id="qr-reader" className="w-full" style={{ minHeight: isFullscreen ? '100vh' : '350px' }}></div>
              
              {!isFullscreen && (
                <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-white/80 py-3 bg-black/50 backdrop-blur-md">
                  {scanning ? '📷 Scanning... Point camera at the QR code' : 'Starting camera...'}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {message && (
          <motion.div 
            key="message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl text-center font-bold shadow-sm mx-auto w-full max-w-lg mb-6 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
              message.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20' :
              'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {teamInfo && (
          <motion.div 
            key="team-info"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 md:p-10 border border-slate-100 dark:border-slate-700/50"
          >
            <div className="text-center mb-8 pb-8 border-b border-slate-100 dark:border-slate-700/50">
              <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Match Found</span>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-3">{teamInfo.name}</h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 inline-block px-4 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">{teamInfo.uniqueId}</p>
            </div>
            
            {teamInfo.attendance && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 mb-8 text-center flex flex-col items-center">
                <Check className="w-12 h-12 text-emerald-500 mb-3" />
                <h4 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Team Already Scanned!</h4>
                <p className="text-emerald-600/80 dark:text-emerald-500/80 text-sm mt-1 mb-4">Automatically scanning next team in 2 seconds...</p>
              </div>
            )}


            <div className="mb-10">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs mb-4 text-center">All Members (Including Lead)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamInfo.members.map((m: any, i: number) => {
                  const isLead = m.email === teamInfo.leadEmail;
                  return (
                    <div key={i} className={`flex flex-col p-4 rounded-xl border ${isLead ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-bold text-slate-800 dark:text-white">{m.name}</span>
                          {isLead && <span className="ml-2 text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded tracking-wide">TEAM LEAD</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 mb-3">{m.email || m.contact || '—'} {m.college && `· ${m.college}`}</span>
                      
                      <Button
                        onClick={() => onToggleAttendance(i, m.attendance)}
                        disabled={loading}
                        variant={m.attendance ? 'success' : 'outline'}
                        fullWidth
                        leftIcon={m.attendance ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-400 dark:border-slate-500" />}
                      >
                        {m.attendance ? 'Marked Present' : 'Mark Present'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {!teamInfo.attendance && (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={async () => {
                      if (onToggleTeamAttendance) {
                        await onToggleTeamAttendance(false);
                        resetScanner();
                      }
                    }}
                    disabled={loading}
                    leftIcon={<Check className="w-5 h-5" />}
                  >
                    Submit & Scan Next
                  </Button>
                </div>
                
                <div className="mt-8 text-center">
                  <Button variant="ghost" onClick={resetScanner} leftIcon={<RefreshCw className="w-4 h-4" />}>
                    Cancel / Scan Another Ticket
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
