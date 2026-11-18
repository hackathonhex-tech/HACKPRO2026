"use client";

import { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileText, Download, User, Building, Phone, Mail, MessageSquare } from 'lucide-react';

export interface TeamDashboardBoardProps {
  team: any;
  feedbacks: any[];
}

export function TeamDashboardBoard({ team, feedbacks }: TeamDashboardBoardProps) {
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const getQRDataUrl = (): string => {
    if (qrCanvasRef.current) {
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (canvas) {
        return canvas.toDataURL('image/png');
      }
    }
    return '';
  };

  const downloadTicketPDF = () => {
    if (!team) return;
    
    const qrDataUrl = getQRDataUrl();
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 660;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Outer Card Fill & Border
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(0, 0, width, height, 24);
    } else {
      ctx.rect(0, 0, width, height);
    }
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#a7f3d0';
    ctx.stroke();

    // Left Stub Linear Gradient
    const grad = ctx.createLinearGradient(0, 0, 380, height);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#047857');
    grad.addColorStop(1, '#059669');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(0, 0, 380, height, [24, 0, 0, 24]);
    } else {
      ctx.rect(0, 0, 380, height);
    }
    ctx.fill();

    // Header Badge on Left Stub
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(50, 30, 280, 36, 18);
    } else {
      ctx.rect(50, 30, 280, 36);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL TICKET PASS', 190, 53);

    // QR Image Load
    const finishDownload = (imgLoaded: boolean, imgObj?: HTMLImageElement) => {
      // QR White Container Box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(50, 85, 280, 280, 20);
      } else {
        ctx.rect(50, 85, 280, 280);
      }
      ctx.fill();

      if (imgLoaded && imgObj) {
        ctx.drawImage(imgObj, 65, 100, 250, 250);
      }

      // Unique ID Badge
      ctx.fillStyle = '#042f22';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(50, 390, 280, 54, 14);
      } else {
        ctx.rect(50, 390, 280, 54);
      }
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(team.uniqueId || '', 190, 425);

      // Right Content
      // Team Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 36px sans-serif';
      const nameText = team.name || 'Team';
      ctx.fillText(nameText.length > 25 ? nameText.substring(0, 23) + '...' : nameText, 420, 60);

      // College/Department
      if (team.collegeName || team.department) {
        ctx.fillStyle = '#047857';
        ctx.font = '600 13px sans-serif';
        const sub = `${team.collegeName || ''} ${team.department ? '· ' + team.department : ''}`;
        ctx.fillText(sub.length > 50 ? sub.substring(0, 47) + '...' : sub, 420, 82);
      }

      // Participant Pass Badge
      ctx.fillStyle = '#d1fae5';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(980, 30, 180, 34, 8);
      } else {
        ctx.rect(980, 30, 180, 34);
      }
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARTICIPANT PASS', 1070, 52);

      // Team Lead Box
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(420, 105, 740, 115, 16);
      } else {
        ctx.rect(420, 105, 740, 115);
      }
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('TEAM LEAD DETAILS', 440, 128);

      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(team.leadName || '—', 440, 158);

      ctx.fillStyle = '#047857';
      ctx.font = '13px sans-serif';
      const leadSuperset = team.leadSupersetId || team.supersetId || team.members?.[0]?.supersetId || '—';
      ctx.fillText(`Email: ${team.leadEmail || '—'}  |  Phone: ${team.leadPhone || '—'}  |  Superset ID: ${leadSuperset}`, 440, 190);

      // Problem Statement Box
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(420, 235, 740, 100, 16);
      } else {
        ctx.rect(420, 235, 740, 100);
      }
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.stroke();

      const psTrack = team.problemStatementId?.track || '';
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`SELECTED PROBLEM STATEMENT ${psTrack ? `(${psTrack.toUpperCase()})` : ''}`, 440, 258);

      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 16px sans-serif';
      const psTitle = team.problemStatementId?.title || 'Not Selected Yet';
      ctx.fillText(psTitle.length > 70 ? psTitle.substring(0, 67) + '...' : psTitle, 440, 292);

      // Team Members Section
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`TEAM MEMBERS (${team.members?.length || 0})`, 420, 362);

      const members = team.members || [];
      const startX = 420;
      const startY = 378;
      const cardWidth = 355;
      const cardHeight = 70;

      members.slice(0, 4).forEach((m: any, idx: number) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = startX + col * (cardWidth + 30);
        const y = startY + row * (cardHeight + 14);

        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, cardWidth, cardHeight, 12);
        } else {
          ctx.rect(x, y, cardWidth, cardHeight);
        }
        ctx.fill();
        ctx.strokeStyle = '#a7f3d0';
        ctx.stroke();

        ctx.fillStyle = '#064e3b';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`#${idx + 1} ${m.name || 'Member'}`, x + 14, y + 28);

        ctx.fillStyle = '#047857';
        ctx.font = '12px sans-serif';
        const detail = m.email || m.phone || m.supersetId || '—';
        ctx.fillText(detail.length > 35 ? detail.substring(0, 32) + '...' : detail, x + 14, y + 50);
      });

      // Footer Notice
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Present this ticket pass at check-in scanner  ·  Credentials: ${team.leadEmail} / ${team.uniqueId}`, 790, 630);

      // Download directly to client machine!
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${(team.name || 'Team').replace(/[^a-z0-9]/gi, '_')}_Ticket_Pass.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => finishDownload(true, qrImg);
      qrImg.onerror = () => finishDownload(false);
      qrImg.src = qrDataUrl;
    } else {
      finishDownload(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Team Dashboard</h2>
        <p className="text-slate-500 mt-1">Your event ticket, team details, and status.</p>
      </div>

      {/* Hidden canvas QR for PDF export */}
      <div ref={qrCanvasRef} className="hidden">
        <QRCodeCanvas value={team.qrCodeString || team.uniqueId} size={400} level="H" includeMargin={true} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ticket Section */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-32 bg-[#3c2cda]"></div>
            
            <div className="pt-16 px-8 pb-8 relative z-10 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-2xl shadow-2xl mb-6 border-4 border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300">
                <QRCodeSVG value={team.qrCodeString || team.uniqueId} size={200} level="H" includeMargin={false} />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{team.name}</h3>
              <p className="text-sm font-bold font-mono tracking-widest text-[#3c2cda] bg-[#3c2cda]/10 border border-[#3c2cda]/20 inline-block px-4 py-1.5 rounded-lg">{team.uniqueId}</p>
              
              {/* Lead Info */}
              {team.leadName && (
                <div className="w-full mt-6 text-left bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Team Lead</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4 mr-2 text-slate-400" /> <span className="font-bold">{team.leadName}</span>
                    </div>
                    {team.leadEmail && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400 min-w-0">
                        <Mail className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span className="truncate" title={team.leadEmail}>{team.leadEmail}</span>
                      </div>
                    )}
                    {team.leadPhone && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400 min-w-0">
                        <Phone className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" /> {team.leadPhone}
                      </div>
                    )}
                    {team.collegeName && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400 min-w-0">
                        <Building className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" /> <span className="truncate">{team.collegeName} {team.department && `· ${team.department}`}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="w-full mt-6 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700/50 pb-2">Team Members ({team.members?.length || 0})</p>
                <div className="space-y-2">
                  {team.members?.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 min-w-0">
                      <div className="min-w-0 truncate mr-2">
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{m.name}</span>
                        {m.college && <span className="text-xs text-slate-400 ml-2">{m.college}</span>}
                      </div>
                      <span className="text-xs text-slate-500 min-w-0 truncate" title={m.email || m.contact || ''}>{m.email || m.contact || ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={downloadTicketPDF}
                className="mt-8 w-full flex items-center justify-center text-sm font-bold bg-[#3c2cda] text-white hover:bg-[#2e21ad] py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#3c2cda]/30"
              >
                <Download className="w-4 h-4 mr-2" /> Download Ticket as PDF
              </button>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Login Credentials Card */}
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 p-6">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Your Login Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 min-w-0 overflow-hidden">
                <p className="text-xs text-slate-500 mb-1">Login ID (Lead Email)</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base break-all" title={team.leadEmail}>{team.leadEmail || '—'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 min-w-0 overflow-hidden">
                <p className="text-xs text-slate-500 mb-1">Password (Team ID)</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base break-all">{team.uniqueId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Event Progress</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl mr-4 ${team.attendance ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                    {team.attendance ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Check-in Status</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Event attendance</p>
                  </div>
                </div>
                {team.attendance ? (
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">Present</span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">Pending</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl mr-4 ${team.problemStatementId ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                    {team.problemStatementId ? <FileText className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Problem Statement</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Selection for the hackathon</p>
                  </div>
                </div>
                {team.problemStatementId ? (
                  <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">Selected</span>
                ) : (
                  <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">Not Selected</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Assigned Judges</h3>
            {(!team.assignedJudges || team.assignedJudges.length === 0) ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 text-center">
                <p className="text-sm font-medium text-slate-500">No judges assigned to your team yet.</p>
                <p className="text-xs text-slate-400 mt-2">Check back closer to the evaluation rounds.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.assignedJudges.map((judge: any) => (
                  <div key={judge._id} className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mr-4">
                      {judge.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{judge.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{judge.uniqueId}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Latest Feedback</h3>
            
            {feedbacks.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 text-center">
                <p className="text-sm font-medium text-slate-500">No public feedback released for your team yet.</p>
                <p className="text-xs text-slate-400 mt-2">Check back after judging rounds are complete.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((item: any, idx: number) => (
                  <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex items-center mb-2 text-indigo-700 dark:text-indigo-400">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Feedback from {item.judgeName}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.feedback}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
