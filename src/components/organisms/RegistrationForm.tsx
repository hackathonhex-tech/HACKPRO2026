"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Card } from '../atoms/Card';
import { registerTeamAction } from '@/server/actions/team.actions';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';

interface MemberForm {
  name: string;
  supersetId: string;
  email: string;
  phone: string;
}

const emptyMember = (): MemberForm => ({ name: '', supersetId: '', email: '', phone: '' });

export const RegistrationForm: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');

  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSupersetId, setLeadSupersetId] = useState('');

  const [members, setMembers] = useState<MemberForm[]>([emptyMember(), emptyMember(), emptyMember()]); // default 3 members
  const [_maxTeamSize, setMaxTeamSize] = useState(4);

  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);

  React.useEffect(() => {
    getPublicSettingsAction()
      .then((data: any) => {
        if (data.success && 'settings' in data && data.settings) {
          const size = data.settings.maxTeamSize ?? 4;
          setMaxTeamSize(size);
          setIsRegistrationOpen(data.settings.isRegistrationOpen ?? true);
          const requiredMembers = Math.max(0, size - 1);
          setMembers(Array.from({ length: requiredMembers }, () => emptyMember()));
        } else {
          setIsRegistrationOpen(true);
        }
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err);
        setIsRegistrationOpen(true);
      });
  }, []);

  if (isRegistrationOpen === false) {
    return (
      <Card className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Registration Closed</h2>
        <p className="text-slate-500 max-w-md mx-auto">We are no longer accepting new team registrations for the hackathon. Please reach out to the organizers if you have any questions.</p>
      </Card>
    );
  }

  if (isRegistrationOpen === null) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const updateMember = (index: number, field: keyof MemberForm, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handlePreviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic validation before preview
    if (!teamName.trim() || !collegeName.trim() || !department.trim()) {
      setMessage({ text: 'Please fill in all team information.', type: 'error' });
      return;
    }
    if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim() || !leadSupersetId.trim()) {
      setMessage({ text: 'Please fill in all team lead details including Superset ID.', type: 'error' });
      return;
    }

    const supersetRegex = /^[0-9]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!supersetRegex.test(leadSupersetId.trim())) {
      setMessage({ text: 'Team Lead Superset ID must be a number.', type: 'error' });
      return;
    }
    if (!phoneRegex.test(leadPhone.trim())) {
      setMessage({ text: 'Team Lead Phone must be exactly 10 digits.', type: 'error' });
      return;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setMessage({ text: `Member ${i + 2}: Name is required.`, type: 'error' });
        return;
      }
      if (!members[i].supersetId.trim()) {
        setMessage({ text: `Member ${i + 2}: Superset ID is required.`, type: 'error' });
        return;
      }
      if (!supersetRegex.test(members[i].supersetId.trim())) {
        setMessage({ text: `Member ${i + 2}: Superset ID must be a number.`, type: 'error' });
        return;
      }
      if (members[i].phone && !phoneRegex.test(members[i].phone.trim())) {
        setMessage({ text: `Member ${i + 2}: Phone must be exactly 10 digits.`, type: 'error' });
        return;
      }
    }

    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage(null);

    const payload = {
      name: teamName,
      collegeName,
      department,
      leadName,
      leadEmail,
      leadPhone,
      leadSupersetId,
      members: members.map(m => ({
        name: m.name,
        supersetId: m.supersetId,
        contact: m.email || m.phone,
        email: m.email,
        phone: m.phone,
        college: collegeName,
        department: department,
      }))
    };

    try {
      const data = await registerTeamAction(payload);
      
      if (data.success && 'team' in data && (data as any).team) {
        setRegisteredTeam((data as any).team);
        setMessage({ text: `Registration successful! Your Team ID is ${data.team.uniqueId}. Redirecting to your dashboard...`, type: 'success' });
        setTimeout(() => {
          router.push('/team/dashboard');
        }, 3000);
      } else {
        setMessage({ text: data.message || 'Registration failed.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (showPreview && !registeredTeam) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Review Registration</h2>
              <p className="text-slate-500 mt-1">Please verify all details before submitting.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center"><div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-2">1</div> Team Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div><span className="text-xs text-slate-500 block mb-1">Team Name</span><span className="font-bold text-slate-900 dark:text-white">{teamName}</span></div>
                <div><span className="text-xs text-slate-500 block mb-1">College</span><span className="font-bold text-slate-900 dark:text-white">{collegeName}</span></div>
                <div><span className="text-xs text-slate-500 block mb-1">Department</span><span className="font-bold text-slate-900 dark:text-white">{department}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center"><div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-2">2</div> Team Lead</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="min-w-0"><span className="text-xs text-slate-500 block mb-1">Full Name</span><span className="font-bold text-slate-900 dark:text-white block truncate" title={leadName}>{leadName}</span></div>
                <div className="min-w-0"><span className="text-xs text-slate-500 block mb-1">Superset ID</span><span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block truncate" title={leadSupersetId}>{leadSupersetId}</span></div>
                <div className="min-w-0"><span className="text-xs text-slate-500 block mb-1">Email</span><span className="font-bold text-slate-900 dark:text-white block truncate" title={leadEmail}>{leadEmail}</span></div>
                <div className="min-w-0"><span className="text-xs text-slate-500 block mb-1">Phone</span><span className="font-bold text-slate-900 dark:text-white block truncate">{leadPhone}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center"><div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-2">3</div> Team Members</h3>
              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 items-center text-sm">
                    <div className="font-bold text-slate-900 dark:text-white min-w-0 truncate"><span className="text-xs text-slate-400 mr-2">#{idx + 2}</span> {member.name}</div>
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-0 truncate">{member.supersetId || '-'}</div>
                    <div className="text-slate-600 dark:text-slate-300 min-w-0 truncate" title={member.email}>{member.email || '-'}</div>
                    <div className="text-slate-600 dark:text-slate-300 min-w-0 truncate">{member.phone || '-'}</div>
                  </div>
                ))}
                {members.length === 0 && <div className="text-sm text-slate-500 italic">No additional team members.</div>}
              </div>
            </div>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-sm font-bold">
              {message.text}
            </motion.div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="button" 
              onClick={() => { setShowPreview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Edit Details
            </button>
            <button 
              type="button" 
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePreviewClick}>
      {/* Section 1: Team Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400 text-sm font-black">1</div>
          Team Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label>Team Name *</Label>
            <Input type="text" required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Code Ninjas" />
          </div>
          <div>
            <Label>College / Institution *</Label>
            <Input type="text" required value={collegeName} onChange={e => setCollegeName(e.target.value)} placeholder="e.g. MIT Chennai" />
          </div>
          <div>
            <Label>Department *</Label>
            <Input type="text" required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
        </div>
      </Card>

      {/* Section 2: Team Lead */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400 text-sm font-black">2</div>
          Team Lead Details (Member 1)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <Label>Full Name *</Label>
            <Input type="text" required value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="e.g. John Doe" />
          </div>
          <div>
            <Label>Superset ID *</Label>
            <Input type="text" required value={leadSupersetId} onChange={e => setLeadSupersetId(e.target.value.replace(/\D/g, ''))} pattern="^[0-9]+$" title="Must be a number" placeholder="e.g. 123456" />
          </div>
          <div>
            <Label>Email ID *</Label>
            <Input type="email" required value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="e.g. john@college.edu" />
          </div>
          <div>
            <Label>Phone Number *</Label>
            <Input type="tel" required value={leadPhone} onChange={e => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} pattern="^[0-9]{10}$" title="Must be exactly 10 digits" placeholder="e.g. 9876543210" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4 ml-1">📧 Your email will be your login ID. Your Team ID will be your password.</p>
      </Card>

      {/* Section 3: Team Members */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400 text-sm font-black">3</div>
            Team Members
          </h2>
          {members.length < (_maxTeamSize - 1) && (
            <Button type="button" variant="outline" onClick={() => setMembers([...members, emptyMember()])} className="text-sm py-1.5 px-3 border-dashed border-2 text-indigo-600 dark:text-indigo-400">
              <Plus className="w-4 h-4 mr-1" /> Add Member
            </Button>
          )}
        </div>
        
        <div className="space-y-6">
          {members.map((member, index) => (
            <div key={index} className="relative p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Users className="w-4 h-4 mr-1.5" /> Member {index + 2}
                </span>
                <button 
                  type="button" 
                  onClick={() => setMembers(members.filter((_, i) => i !== index))}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input type="text" required value={member.name} onChange={e => updateMember(index, 'name', e.target.value)} placeholder="Member name" />
                </div>
                <div>
                  <Label>Superset ID *</Label>
                  <Input type="text" required value={member.supersetId} onChange={e => updateMember(index, 'supersetId', e.target.value.replace(/\D/g, ''))} pattern="^[0-9]+$" title="Must be a number" placeholder="e.g. 987654" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={member.email} onChange={e => updateMember(index, 'email', e.target.value)} placeholder="Email address" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="tel" value={member.phone} onChange={e => updateMember(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))} pattern="^[0-9]{10}$" title="Must be exactly 10 digits" placeholder="Phone number" />
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && <div className="text-sm text-slate-500 text-center py-4 italic">No additional members added. Your team size will be 1 (Lead only).</div>}
        </div>
      </Card>

      {/* Messages & Submit */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-bold flex items-center mb-6 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
          {message.text}
        </motion.div>
      )}

      {registeredTeam && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">Your credentials for login:</p>
          <p className="text-slate-800 dark:text-white font-mono text-lg"><span className="text-slate-500 font-sans text-sm">Email:</span> {leadEmail}</p>
          <p className="text-slate-800 dark:text-white font-mono text-lg"><span className="text-slate-500 font-sans text-sm">Password (Team ID):</span> {registeredTeam.uniqueId}</p>
        </motion.div>
      )}

      <Button
        type="submit"
        className="w-full text-lg py-6"
      >
        <UserPlus className="w-5 h-5 mr-2" /> Preview Details
      </Button>
    </form>
  );
};

