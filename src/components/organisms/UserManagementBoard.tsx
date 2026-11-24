"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Copy, CheckCircle, Trash2, Edit3, X, Save, Download, FileText, Eye, Users, User, Mail, Building, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import { resendTeamEmailAction, getPaginatedTeamsAction, getAllFilteredTeamsAction } from '@/server/actions/admin.team.actions';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';
import { FormFieldConfig, RegistrationFieldsConfig } from './RegistrationFieldConfigBoard';
import { Button } from '../atoms/Button';
import { IconButton } from '../atoms/IconButton';
import { Input } from '../atoms/Input';
import { Modal } from '../molecules/Modal';
import { Tabs } from '../molecules/Tabs';
import { Pagination } from '../molecules/Pagination';

const DEFAULT_TEAM_FIELDS: FormFieldConfig[] = [
  { id: 'name', key: 'name', label: 'Team Name', type: 'text', placeholder: 'e.g. Code Ninjas', required: true, enabled: true, isCustom: false },
  { id: 'collegeName', key: 'collegeName', label: 'College / Institution', type: 'text', placeholder: 'e.g. MIT Chennai', required: true, enabled: true, isCustom: false },
  { id: 'department', key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Computer Science', required: true, enabled: true, isCustom: false }
];

const DEFAULT_MEMBER_FIELDS: FormFieldConfig[] = [
  { id: 'name', key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. John Doe', required: true, enabled: true, isCustom: false },
  { id: 'supersetId', key: 'supersetId', label: 'Superset ID / Roll No', type: 'text', placeholder: 'e.g. 123456', required: true, enabled: true, isCustom: false },
  { id: 'email', key: 'email', label: 'Email ID', type: 'email', placeholder: 'e.g. john@college.edu', required: true, enabled: true, isCustom: false },
  { id: 'phone', key: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true, enabled: true, isCustom: false }
];

export interface UserManagementBoardProps {
  judges: any[];
  teams: any[];
  initialTeamsTotal?: number;
  initialDistinctPlaces?: string[];
  initialConflictingTeamNames?: string[];
  maxTeamSize: number;
  onRefresh: () => void;
  onCreateJudge: (data: any) => Promise<any>;
  onDeleteJudge: (id: string) => Promise<boolean>;
  onEditJudge: (id: string, data: any) => Promise<boolean>;
  onCreateTeam: (data: any) => Promise<boolean>;
  onDeleteTeam: (id: string) => Promise<boolean>;
  onEditTeam: (id: string, data: any) => Promise<boolean>;
  subAdmins?: any[];
  currentUserRole?: string;
  onCreateSubAdmin?: (data: any) => Promise<any>;
  onDeleteSubAdmin?: (id: string) => Promise<boolean>;
  onEditSubAdmin?: (id: string, data: any) => Promise<boolean>;
  roles?: any[];
  onCreateRole?: (data: any) => Promise<boolean>;
  onDeleteRole?: (id: string) => Promise<boolean>;
  onEditRole?: (id: string, data: any) => Promise<boolean>;
  registrationFieldsConfig?: RegistrationFieldsConfig;
}

export function UserManagementBoard({
  judges,
  teams,
  initialTeamsTotal,
  initialDistinctPlaces,
  initialConflictingTeamNames,
  maxTeamSize,
  onRefresh,
  onCreateJudge,
  onDeleteJudge,
  onEditJudge,
  onCreateTeam,
  onDeleteTeam,
  onEditTeam,
  subAdmins = [],
  currentUserRole = 'admin',
  onCreateSubAdmin,
  onDeleteSubAdmin,
  onEditSubAdmin,
  roles = [],
  onCreateRole,
  onDeleteRole,
  onEditRole,
  registrationFieldsConfig
}: UserManagementBoardProps) {
  const [activeTab, setActiveTabState] = useState<'judges' | 'teams' | 'subadmins' | 'roles'>('judges');
  const [fieldsConfig, setFieldsConfig] = useState<RegistrationFieldsConfig | null>(registrationFieldsConfig || null);

  useEffect(() => {
    if (registrationFieldsConfig) {
      setFieldsConfig(registrationFieldsConfig);
    } else {
      getPublicSettingsAction().then((res: any) => {
        if (res.success && res.settings?.registrationFieldsConfig) {
          setFieldsConfig(res.settings.registrationFieldsConfig);
        }
      });
    }
  }, [registrationFieldsConfig]);

  const activeTeamFields = useMemo(() => {
    const list = fieldsConfig?.teamFields && fieldsConfig.teamFields.length > 0
      ? fieldsConfig.teamFields
      : DEFAULT_TEAM_FIELDS;
    return list.filter(f => f.enabled !== false);
  }, [fieldsConfig]);

  const activeMemberFields = useMemo(() => {
    const list = fieldsConfig?.memberFields && fieldsConfig.memberFields.length > 0
      ? fieldsConfig.memberFields
      : DEFAULT_MEMBER_FIELDS;
    return list.filter(f => f.enabled !== false);
  }, [fieldsConfig]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_user_mgmt_tab') as any;
      if (saved && ['judges', 'teams', 'subadmins', 'roles'].includes(saved)) {
        setActiveTabState(saved);
      }
    } catch {}
  }, []);

  const setActiveTab = (tab: 'judges' | 'teams' | 'subadmins' | 'roles') => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('admin_user_mgmt_tab', tab);
    } catch {}
  };
  const router = useRouter();

  // Server-side team pagination & filter states
  const [currentTeams, setCurrentTeams] = useState<any[]>(teams);
  const [totalTeamsCount, setTotalTeamsCount] = useState<number>(initialTeamsTotal ?? teams.length);
  const [distinctPlacesList, setDistinctPlacesList] = useState<string[]>(initialDistinctPlaces ?? []);
  const [conflictTeamNamesList, setConflictTeamNamesList] = useState<string[]>(initialConflictingTeamNames ?? []);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    setCurrentTeams(teams);
  }, [teams]);

  useEffect(() => {
    if (initialTeamsTotal !== undefined) setTotalTeamsCount(initialTeamsTotal);
  }, [initialTeamsTotal]);

  useEffect(() => {
    if (initialDistinctPlaces) setDistinctPlacesList(initialDistinctPlaces);
  }, [initialDistinctPlaces]);

  useEffect(() => {
    if (initialConflictingTeamNames) setConflictTeamNamesList(initialConflictingTeamNames);
  }, [initialConflictingTeamNames]);

  // Cross-team duplicate member detection strictly by Emp_id
  const { teamConflictMap, memberConflictMap } = useMemo(() => {
    const empIdMap = new Map<string, string[]>();

    currentTeams.forEach(team => {
      const tName = team.name || 'Unnamed Team';
      // Lead checks
      const leadEmp = (team.leadEmpId || team.leadSupersetId || team.supersetId || team.members?.[0]?.empId || team.members?.[0]?.supersetId || '').trim().toLowerCase();
      if (leadEmp) {
        if (!empIdMap.has(leadEmp)) empIdMap.set(leadEmp, []);
        if (!empIdMap.get(leadEmp)!.includes(tName)) empIdMap.get(leadEmp)!.push(tName);
      }

      // Member checks
      (team.members || []).forEach((m: any) => {
        const mEmp = (m.empId || m.supersetId || '').trim().toLowerCase();
        if (mEmp) {
          if (!empIdMap.has(mEmp)) empIdMap.set(mEmp, []);
          if (!empIdMap.get(mEmp)!.includes(tName)) empIdMap.get(mEmp)!.push(tName);
        }
      });
    });

    const memberConflictMap = new Map<string, string[]>();
    const teamConflictMap = new Map<string, { count: number; otherTeams: string[] }>();

    empIdMap.forEach((teamList, emp) => {
      if (teamList.length > 1) {
        memberConflictMap.set(emp, teamList);
        teamList.forEach(tName => {
          if (!teamConflictMap.has(tName)) teamConflictMap.set(tName, { count: 0, otherTeams: [] });
          const entry = teamConflictMap.get(tName)!;
          entry.count++;
          teamList.filter(t => t !== tName).forEach(other => {
            if (!entry.otherTeams.includes(other)) entry.otherTeams.push(other);
          });
        });
      }
    });

    // Also include global conflicting team names detected across the entire database
    conflictTeamNamesList.forEach(tName => {
      if (!teamConflictMap.has(tName)) {
        teamConflictMap.set(tName, { count: 1, otherTeams: ['Another registered team'] });
      }
    });

    return { teamConflictMap, memberConflictMap };
  }, [currentTeams, conflictTeamNamesList]);

  // New Judge Form
  const [judgeName, setJudgeName] = useState('');
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgePassword, setJudgePassword] = useState('');
  const [judgeAssessmentMode, setJudgeAssessmentMode] = useState<'virtual' | 'offline'>('virtual');
  const [isCreating, setIsCreating] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter and Search
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamCollegeFilter, setTeamCollegeFilter] = useState('');
  const [teamSizeFilter, setTeamSizeFilter] = useState('');

  // New Team Form (Dynamic from Registration Setup)
  const [teamFormData, setTeamFormData] = useState<Record<string, any>>({});
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamMembers, setNewTeamMembers] = useState<Record<string, any>[]>([]);

  const updateTeamField = (key: string, value: any) => {
    setTeamFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateMemberField = (index: number, field: string, value: any) => {
    setNewTeamMembers(prev => {
      const copy = [...prev];
      if (!copy[index]) copy[index] = {};
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Dynamic input renderer for configured fields
  const renderDynamicFieldInput = (
    field: FormFieldConfig,
    value: any,
    onChange: (val: any) => void
  ) => {
    if (field.type === 'select') {
      return (
        <div key={field.key} className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <select
            required={field.required}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1.5 col-span-full">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            required={field.required}
            rows={2}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || field.label}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        <Input
          label={field.label}
          type={field.type}
          required={field.required}
          value={value || ''}
          onChange={e => {
            let v = e.target.value;
            if (field.type === 'tel' || field.key === 'phone') {
              v = v.replace(/\D/g, '').slice(0, 10);
            }
            onChange(v);
          }}
          placeholder={field.placeholder || field.label}
        />
      </div>
    );
  };

  // Edit state
  const [editingJudge, setEditingJudge] = useState<any>(null);
  const [editingFullTeam, setEditingFullTeam] = useState<any>(null);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [sendingEmailTeamId, setSendingEmailTeamId] = useState<string | null>(null);

  const handleResendEmail = async (team: any) => {
    if (!confirm(`Resend official ticket and login credentials email to ${team.leadEmail || team.name}?`)) return;
    
    setSendingEmailTeamId(team._id);
    const res = await resendTeamEmailAction(team._id);
    setSendingEmailTeamId(null);

    if (res.success) {
      alert(`Ticket email successfully sent to ${team.leadEmail || team.name}!`);
    } else {
      alert(`Failed to send email: ${res.message}`);
    }
  };

  // Sub-Admin State
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminRoleId, setSubAdminRoleId] = useState('');
  const [isCreatingSubAdmin, setIsCreatingSubAdmin] = useState(false);
  const [isSubAdminModalOpen, setIsSubAdminModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<any>(null);

  // Role State
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'scanner', label: 'QR Scanner' },
    { id: 'manage_users', label: 'User Management' },
    { id: 'registration_fields', label: 'Registration Setup' },
    { id: 'assign_judges', label: 'Assign Judges' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'round_selection', label: 'Round Selection' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'manage_evaluations', label: 'Evaluations' },
    { id: 'manage_rubric', label: 'Rubric Config' },
    { id: 'hackathon_setup', label: 'Hackathon Setup' },
    { id: 'manage_settings', label: 'Global Settings' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  // Pagination states
  const [judgePage, setJudgePage] = useState(1);
  const [judgePageSize, setJudgePageSize] = useState(10);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState(10);
  const [subAdminPage, setSubAdminPage] = useState(1);
  const [subAdminPageSize, setSubAdminPageSize] = useState(10);
  const [rolePage, setRolePage] = useState(1);
  const [rolePageSize, setRolePageSize] = useState(10);

  const paginatedJudges = judges.slice((judgePage - 1) * judgePageSize, judgePage * judgePageSize);
  const paginatedSubAdmins = subAdmins.slice((subAdminPage - 1) * subAdminPageSize, subAdminPage * subAdminPageSize);
  const paginatedRoles = roles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize);

  const fetchPaginatedTeams = async (
    page: number,
    limit: number,
    search: string,
    place: string,
    size: string
  ) => {
    setIsTeamsLoading(true);
    try {
      const res = await getPaginatedTeamsAction({
        page,
        limit,
        search,
        place,
        size
      });
      if (res.success) {
        setCurrentTeams(res.teams || []);
        setTotalTeamsCount(res.total || 0);
        if (res.distinctPlaces) setDistinctPlacesList(res.distinctPlaces);
        if (res.conflictingTeamNames) setConflictTeamNamesList(res.conflictingTeamNames);
      }
    } catch (err) {
      console.error('Failed to load paginated teams:', err);
    } finally {
      setIsTeamsLoading(false);
    }
  };

  const isFirstTeamRender = useRef(true);
  useEffect(() => {
    if (isFirstTeamRender.current) {
      isFirstTeamRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      fetchPaginatedTeams(teamPage, teamPageSize, teamSearchQuery, teamCollegeFilter, teamSizeFilter);
    }, 300);

    return () => clearTimeout(handler);
  }, [teamPage, teamPageSize, teamSearchQuery, teamCollegeFilter, teamSizeFilter]);

  const handleSearchChange = (val: string) => {
    setTeamSearchQuery(val);
    setTeamPage(1);
  };

  const handlePlaceChange = (val: string) => {
    setTeamCollegeFilter(val);
    setTeamPage(1);
  };

  const handleSizeChange = (val: string) => {
    setTeamSizeFilter(val);
    setTeamPage(1);
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const res = await onCreateJudge({
      name: judgeName,
      email: judgeEmail,
      password: judgePassword,
      assessmentMode: judgeAssessmentMode
    });
    const isSuccess = typeof res === 'boolean' ? res : res?.success;
    if (isSuccess) {
      setJudgeName('');
      setJudgeEmail('');
      setJudgePassword('');
      setJudgeAssessmentMode('virtual');
      setIsJudgeModalOpen(false);
      onRefresh();
    } else {
      const errorMsg = (typeof res === 'object' && res?.message) ? res.message : 'Failed to create judge.';
      alert(errorMsg);
    }
    setIsCreating(false);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTeam(true);

    const teamName = (teamFormData.name || teamFormData.team_name || teamFormData.teamName || '').trim();
    if (!teamName) {
      alert('Team Name is required.');
      setIsCreatingTeam(false);
      return;
    }

    const collegeName = (teamFormData.collegeName || teamFormData.college || '').trim();
    const department = (teamFormData.department || '').trim();
    const place = (teamFormData.place || teamFormData.location || '').trim();

    // Extract custom fields from team form
    const customFields: Record<string, any> = {};
    Object.entries(teamFormData).forEach(([k, v]) => {
      if (!['name', 'teamName', 'team_name', 'collegeName', 'college', 'department', 'place', 'location'].includes(k)) {
        customFields[k] = v;
      }
    });

    const lead = newTeamMembers[0] || {};
    const leadName = (lead.name || lead.emp_name || lead.leadName || '').trim();
    const leadEmail = (lead.email || lead.email_id || lead.leadEmail || '').trim();
    const leadPhone = (lead.phone || lead.contact || lead.leadPhone || '').trim();
    const leadEmpId = (lead.empId || lead.Emp_id || lead.emp_id || lead.supersetId || '').trim();
    const leadPlace = (lead.place || lead.location || place).trim();
    const leadCollege = (lead.college || collegeName).trim();
    const leadDept = (lead.department || department).trim();

    const membersPayload = newTeamMembers.map((m) => {
      const mName = (m.name || m.emp_name || '').trim();
      const mEmail = (m.email || m.email_id || '').trim();
      const mPhone = (m.phone || m.contact || '').trim();
      const mEmpId = (m.empId || m.Emp_id || m.emp_id || m.supersetId || '').trim();
      const mPlace = (m.place || m.location || leadPlace || place).trim();
      const mCollege = (m.college || leadCollege || collegeName).trim();
      const mDept = (m.department || leadDept || department).trim();

      const mCustom: Record<string, any> = {};
      Object.entries(m).forEach(([k, v]) => {
        if (!['name', 'emp_name', 'empId', 'Emp_id', 'emp_id', 'supersetId', 'email', 'email_id', 'phone', 'contact', 'place', 'location', 'college', 'department', 'attendance'].includes(k)) {
          mCustom[k] = v;
        }
      });

      return {
        ...m,
        name: mName,
        empId: mEmpId,
        supersetId: mEmpId,
        email: mEmail,
        contact: mPhone || mEmail,
        phone: mPhone,
        place: mPlace,
        college: mCollege,
        department: mDept,
        attendance: false,
        customFields: mCustom
      };
    });

    const success = await onCreateTeam({
      name: teamName,
      leadName: leadName || teamName,
      leadEmail,
      leadPhone,
      leadEmpId,
      leadSupersetId: leadEmpId,
      supersetId: leadEmpId,
      place: leadPlace || place,
      collegeName: leadCollege || collegeName,
      department: leadDept || department,
      customFields,
      members: membersPayload
    });

    if (success) {
      setTeamFormData({});
      setNewTeamMembers([]);
      setIsTeamModalOpen(false);
      onRefresh();
      fetchPaginatedTeams(teamPage, teamPageSize, teamSearchQuery, teamCollegeFilter, teamSizeFilter);
    } else {
      alert('Failed to create team.');
    }
    setIsCreatingTeam(false);
  };

  const deleteJudge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this judge?')) return;
    const success = await onDeleteJudge(id);
    if (success) onRefresh();
  };

  const saveJudgeEdit = async () => {
    if (!editingJudge) return;
    const success = await onEditJudge(editingJudge._id, {
      name: editingJudge.name,
      email: editingJudge.email,
      password: editingJudge.password,
      assessmentMode: editingJudge.assessmentMode || 'virtual'
    });
    if (success) {
      setEditingJudge(null);
      onRefresh();
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    const success = await onDeleteTeam(id);
    if (success) {
      setActiveTab('teams');
      onRefresh();
      fetchPaginatedTeams(teamPage, teamPageSize, teamSearchQuery, teamCollegeFilter, teamSizeFilter);
    }
  };

  const saveFullTeamEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFullTeam) return;
    
    const teamToSave = { ...editingFullTeam };
    if (teamToSave.members && teamToSave.members.length > 0) {
      const lead = teamToSave.members[0];
      teamToSave.leadName = lead.name || teamToSave.leadName;
      teamToSave.leadEmail = lead.email || teamToSave.leadEmail;
      const empId = lead.empId || lead.supersetId || teamToSave.leadEmpId || teamToSave.leadSupersetId || '';
      teamToSave.leadEmpId = empId;
      teamToSave.leadSupersetId = empId;
      teamToSave.supersetId = empId;
      teamToSave.leadPhone = lead.phone || lead.contact || teamToSave.leadPhone;
      teamToSave.department = lead.department || teamToSave.department;
      teamToSave.place = lead.place || teamToSave.place;
    }

    const success = await onEditTeam(teamToSave._id, teamToSave);
    if (success) {
      setEditingFullTeam(null);
      onRefresh();
      fetchPaginatedTeams(teamPage, teamPageSize, teamSearchQuery, teamCollegeFilter, teamSizeFilter);
    } else {
      alert('Failed to update team.');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateSubAdmin) return;
    setIsCreatingSubAdmin(true);
    const res = await onCreateSubAdmin({
      name: subAdminName,
      email: subAdminEmail,
      password: subAdminPassword,
      customRoleId: subAdminRoleId
    });
    const isSuccess = typeof res === 'boolean' ? res : res?.success;
    if (isSuccess) {
      setSubAdminName('');
      setSubAdminEmail('');
      setSubAdminPassword('');
      setSubAdminRoleId('');
      setIsSubAdminModalOpen(false);
      onRefresh();
    } else {
      const errorMsg = (typeof res === 'object' && res?.message) ? res.message : 'Failed to create sub-admin.';
      alert(errorMsg);
    }
    setIsCreatingSubAdmin(false);
  };

  const deleteSubAdmin = async (id: string) => {
    if (!onDeleteSubAdmin) return;
    if (!confirm('Are you sure you want to delete this sub-admin?')) return;
    const success = await onDeleteSubAdmin(id);
    if (success) onRefresh();
  };

  const saveSubAdminEdit = async () => {
    if (!editingSubAdmin || !onEditSubAdmin) return;
    const success = await onEditSubAdmin(editingSubAdmin._id, {
      name: editingSubAdmin.name,
      email: editingSubAdmin.email,
      customRoleId: editingSubAdmin.customRoleId,
      password: editingSubAdmin.password
    });
    if (success) {
      setEditingSubAdmin(null);
      onRefresh();
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateRole) return;
    setIsCreatingRole(true);
    const success = await onCreateRole({
      name: roleName,
      permissions: rolePermissions
    });
    if (success) {
      setRoleName('');
      setRolePermissions([]);
      setIsRoleModalOpen(false);
      onRefresh();
    } else {
      alert('Failed to create role.');
    }
    setIsCreatingRole(false);
  };

  const deleteRole = async (id: string) => {
    if (!onDeleteRole) return;
    if (!confirm('Are you sure you want to delete this role? Any users with this role might lose access.')) return;
    const success = await onDeleteRole(id);
    if (success) onRefresh();
  };

  const saveRoleEdit = async () => {
    if (!editingRole || !onEditRole) return;
    const success = await onEditRole(editingRole._id, {
      name: editingRole.name,
      permissions: editingRole.permissions
    });
    if (success) {
      setEditingRole(null);
      onRefresh();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportTeamsCSV = async () => {
    setIsExportingCSV(true);
    try {
      const res = await getAllFilteredTeamsAction({
        search: teamSearchQuery,
        place: teamCollegeFilter,
        size: teamSizeFilter
      });
      const exportList: any[] = (res.success && res.teams) ? res.teams : currentTeams;

      const headers = [
        'Team ID',
        'Team Name',
        'Place',
        'Department',
        'Problem Statement Title',
        'Problem Statement Track',
        'Selected Stack',
        'Member Role',
        'Member Name',
        'Superset ID',
        'Email',
        'Phone',
        'Member Dept',
        'Attendance'
      ];

      const rows: string[] = [];

      exportList.forEach(t => {
        const psTitle = t.problemStatementId?.title || 'Not Selected';
        const psTrack = t.problemStatementId?.track || 'N/A';
        const stack = t.selectedStack || 'N/A';
        const place = t.place || t.collegeName || '';

        if (t.members && t.members.length > 0) {
          t.members.forEach((m: any, idx: number) => {
            const isLead = (m.email && m.email === t.leadEmail) || (m.name === t.leadName && idx === 0);
            const role = isLead ? 'Team Lead' : `Member ${idx + 1}`;
            const supersetId = m.supersetId || (isLead ? (t.leadSupersetId || t.supersetId || '') : '');
            
            rows.push([
              t.uniqueId,
              `"${(t.name || '').replace(/"/g, '""')}"`,
              `"${place.replace(/"/g, '""')}"`,
              `"${(t.department || '').replace(/"/g, '""')}"`,
              `"${(psTitle || '').replace(/"/g, '""')}"`,
              `"${(psTrack || '').replace(/"/g, '""')}"`,
              `"${(stack || '').replace(/"/g, '""')}"`,
              `"${role}"`,
              `"${(m.name || '').replace(/"/g, '""')}"`,
              `"${(supersetId || '').replace(/"/g, '""')}"`,
              `"${(m.email || '').replace(/"/g, '""')}"`,
              `"${(m.phone || m.contact || '').replace(/"/g, '""')}"`,
              `"${(m.department || t.department || '').replace(/"/g, '""')}"`,
              m.attendance ? 'Present' : 'Absent'
            ].join(','));
          });
        } else {
          rows.push([
            t.uniqueId,
            `"${(t.name || '').replace(/"/g, '""')}"`,
            `"${place.replace(/"/g, '""')}"`,
            `"${(t.department || '').replace(/"/g, '""')}"`,
            `"${(psTitle || '').replace(/"/g, '""')}"`,
            `"${(psTrack || '').replace(/"/g, '""')}"`,
            `"${(stack || '').replace(/"/g, '""')}"`,
            '"Team Lead"',
            `"${(t.leadName || '').replace(/"/g, '""')}"`,
            `"${(t.leadSupersetId || t.supersetId || '').replace(/"/g, '""')}"`,
            `"${(t.leadEmail || '').replace(/"/g, '""')}"`,
            `"${(t.leadPhone || '').replace(/"/g, '""')}"`,
            `"${(t.department || '').replace(/"/g, '""')}"`,
            t.attendance ? 'Present' : 'Absent'
          ].join(','));
        }
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hackathon_teams_members.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error:', err);
      alert('Failed to export CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const exportTeamsPDF = async () => {
    setIsExportingPDF(true);
    try {
      const res = await getAllFilteredTeamsAction({
        search: teamSearchQuery,
        place: teamCollegeFilter,
        size: teamSizeFilter
      });
      const exportList: any[] = (res.success && res.teams) ? res.teams : currentTeams;

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('landscape');
      doc.setFontSize(14);
      doc.text("Hackathon Teams & Member Superset Details", 14, 15);
      
      const rows: any[] = [];
      exportList.forEach(t => {
        const psTitle = t.problemStatementId ? `${t.problemStatementId.title} (${t.problemStatementId.track || 'Track N/A'})` : 'Not Selected';
        if (t.members && t.members.length > 0) {
          t.members.forEach((m: any, idx: number) => {
            const isLead = (m.email && m.email === t.leadEmail) || (m.name === t.leadName && idx === 0);
            rows.push([
              t.uniqueId,
              t.name,
              t.place || t.collegeName || '-',
              isLead ? 'Lead' : `Member ${idx + 1}`,
              m.name || '-',
              m.supersetId || (isLead ? (t.leadSupersetId || t.supersetId || '-') : '-'),
              m.email || m.contact || '-',
              psTitle
            ]);
          });
        } else {
          rows.push([
            t.uniqueId,
            t.name,
            t.place || t.collegeName || '-',
            'Lead',
            t.leadName || '-',
            t.leadSupersetId || t.supersetId || '-',
            t.leadEmail || '-',
            psTitle
          ]);
        }
      });

      autoTable(doc, {
        startY: 20,
        head: [['Team ID', 'Team Name', 'Place', 'Role', 'Member Name', 'Superset ID', 'Email', 'Problem Statement']],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      doc.save('hackathon_teams_members.pdf');
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">User Management</h2>
          <p className="text-slate-500 mt-1">Manage judges and registered teams.</p>
        </div>

        <div className="w-fit">
          <Tabs
            options={[
              { id: 'judges', label: 'Judges' },
              { id: 'teams', label: 'Teams' },
              ...(currentUserRole === 'admin' ? [{ id: 'roles', label: 'Roles & Permissions' }, { id: 'subadmins', label: 'Users' }] : [])
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'judges' | 'teams' | 'subadmins' | 'roles')}
          />
        </div>
      </div>

      {activeTab === 'judges' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Judges ({judges.length})</h3>
            <Button size="sm" onClick={() => setIsJudgeModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Judge
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Judge ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Mode</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Password</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No judges created yet.</td></tr>
                  ) : (
                    paginatedJudges.map(judge => (
                      <tr key={judge._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {editingJudge?._id === judge._id ? (
                            <Input type="text" value={editingJudge.name} onChange={e => setEditingJudge({ ...editingJudge, name: e.target.value })} />
                          ) : judge.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{judge.uniqueId}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {editingJudge?._id === judge._id ? (
                            <Input type="email" value={editingJudge.email} onChange={e => setEditingJudge({ ...editingJudge, email: e.target.value })} />
                          ) : (judge.email || '—')}
                        </td>
                        <td className="px-6 py-4">
                          {editingJudge?._id === judge._id ? (
                            <select
                              value={editingJudge.assessmentMode || 'virtual'}
                              onChange={e => setEditingJudge({ ...editingJudge, assessmentMode: e.target.value })}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="virtual">Virtual Assessment</option>
                              <option value="offline">Offline</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              judge.assessmentMode === 'offline'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}>
                              {judge.assessmentMode === 'offline' ? 'Offline' : 'Virtual Assessment'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                          {editingJudge?._id === judge._id ? (
                            <Input type="text" placeholder="New password" value={editingJudge.password || ''} onChange={e => setEditingJudge({ ...editingJudge, password: e.target.value })} />
                          ) : '••••••••'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {editingJudge?._id === judge._id ? (
                              <>
                                <IconButton variant="success" icon={<Save className="w-4 h-4" />} onClick={saveJudgeEdit} />
                                <IconButton variant="ghost" icon={<X className="w-4 h-4" />} onClick={() => setEditingJudge(null)} />
                              </>
                            ) : (
                              <>
                                <IconButton variant="primary" icon={<Edit3 className="w-4 h-4" />} onClick={() => setEditingJudge({ ...judge })} />
                                <IconButton variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteJudge(judge._id)} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {judges.length > 0 && (
              <Pagination
                currentPage={judgePage}
                totalItems={judges.length}
                pageSize={judgePageSize}
                onPageChange={setJudgePage}
                onPageSizeChange={(newSize) => {
                  setJudgePageSize(newSize);
                  setJudgePage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registered Teams ({totalTeamsCount})</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Input 
                type="text" 
                placeholder="Search teams, IDs, leads..." 
                value={teamSearchQuery} 
                onChange={e => handleSearchChange(e.target.value)}
              />
              <select
                className="p-2.5 text-sm border border-slate-300 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={teamSizeFilter}
                onChange={e => handleSizeChange(e.target.value)}
              >
                <option value="">All Sizes</option>
                {[1, 2, 3, 4].map(size => (
                  <option key={size} value={size}>{size} Member{size > 1 ? 's' : ''}</option>
                ))}
              </select>
              <select
                className="p-2.5 text-sm border border-slate-300 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={teamCollegeFilter}
                onChange={e => handlePlaceChange(e.target.value)}
              >
                <option value="">All Places</option>
                {distinctPlacesList.map(place => (
                  <option key={String(place)} value={String(place)}>{place}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => {
                const defaultCount = Math.max(1, maxTeamSize || 3);
                setTeamFormData({});
                setNewTeamMembers(Array.from({ length: defaultCount }, () => ({})));
                setIsTeamModalOpen(true);
              }} leftIcon={<Plus className="w-4 h-4" />}>
                Add Team
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push('/admin/import-teams')} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
                Import CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportTeamsCSV} disabled={isExportingCSV} leftIcon={isExportingCSV ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}>
                {isExportingCSV ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button size="sm" variant="outline" onClick={exportTeamsPDF} disabled={isExportingPDF} leftIcon={isExportingPDF ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}>
                {isExportingPDF ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Place</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                        {isTeamsLoading ? 'Loading teams...' : 'No teams found matching the criteria.'}
                      </td>
                    </tr>
                  ) : (
                    currentTeams.map(team => {
                      const hasConflict = teamConflictMap.has(team.name);
                      const conflictInfo = teamConflictMap.get(team.name);
                      return (
                      <tr 
                        key={team._id} 
                        className={`border-b transition-colors ${
                          hasConflict
                            ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30'
                            : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20'
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{team.name}</span>
                            {hasConflict && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs"
                                title={`Duplicate member in: ${conflictInfo?.otherTeams.join(', ')}`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Duplicate Member
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{team.uniqueId}</span>
                            <button onClick={() => copyToClipboard(team.uniqueId, team._id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                              {copiedId === team._id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{team.leadName || '—'}</p>
                          <p className="text-xs text-slate-500">{team.leadEmail || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {team.place || team.collegeName || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                            {team.members?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <IconButton variant="primary" icon={<Eye className="w-4 h-4" />} onClick={() => setViewingTeam(team)} title="View Full Details" />
                            <IconButton 
                              variant="ghost" 
                              icon={sendingEmailTeamId === team._id ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />} 
                              onClick={() => handleResendEmail(team)} 
                              title="Send Ticket Email to Team Lead"
                            />
                            <IconButton variant="primary" icon={<Edit3 className="w-4 h-4" />} onClick={() => setEditingFullTeam(JSON.parse(JSON.stringify(team)))} title="Edit Team" />
                            <IconButton variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteTeam(team._id)} title="Delete Team" />
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalTeamsCount > 0 && (
              <Pagination
                currentPage={teamPage}
                totalItems={totalTeamsCount}
                pageSize={teamPageSize}
                onPageChange={setTeamPage}
                onPageSizeChange={(newSize) => {
                  setTeamPageSize(newSize);
                  setTeamPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'subadmins' && currentUserRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Users ({subAdmins.length})</h3>
            <Button size="sm" onClick={() => setIsSubAdminModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Sub-Admin
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID / Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Password</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subAdmins.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No sub-admins created yet.</td></tr>
                  ) : (
                    paginatedSubAdmins.map(admin => (
                      <tr key={admin._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {editingSubAdmin?._id === admin._id ? (
                            <Input type="text" value={editingSubAdmin.name} onChange={e => setEditingSubAdmin({ ...editingSubAdmin, name: e.target.value })} />
                          ) : admin.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded block mb-1">{admin.uniqueId}</span>
                          {editingSubAdmin?._id === admin._id ? (
                            <Input type="email" value={editingSubAdmin.email} onChange={e => setEditingSubAdmin({ ...editingSubAdmin, email: e.target.value })} />
                          ) : (
                            <span className="text-xs text-slate-500">{admin.email}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                          {editingSubAdmin?._id === admin._id ? (
                            <Input type="text" placeholder="New password" value={editingSubAdmin.password || ''} onChange={e => setEditingSubAdmin({ ...editingSubAdmin, password: e.target.value })} />
                          ) : '••••••••'}
                        </td>
                        <td className="px-6 py-4">
                          {editingSubAdmin?._id === admin._id ? (
                            <select
                              className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                              value={editingSubAdmin.customRoleId || ''}
                              onChange={(e) => setEditingSubAdmin({ ...editingSubAdmin, customRoleId: e.target.value })}
                            >
                              <option value="">Select a Role</option>
                              {roles.map(r => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 rounded">
                              {admin.customRoleId?.name || 'No Role Assigned'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {editingSubAdmin?._id === admin._id ? (
                              <>
                                <IconButton variant="success" icon={<Save className="w-4 h-4" />} onClick={saveSubAdminEdit} />
                                <IconButton variant="ghost" icon={<X className="w-4 h-4" />} onClick={() => setEditingSubAdmin(null)} />
                              </>
                            ) : (
                              <>
                                <IconButton variant="primary" icon={<Edit3 className="w-4 h-4" />} onClick={() => setEditingSubAdmin({ ...admin, customRoleId: admin.customRoleId?._id || '' })} />
                                <IconButton variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteSubAdmin(admin._id)} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {subAdmins.length > 0 && (
              <Pagination
                currentPage={subAdminPage}
                totalItems={subAdmins.length}
                pageSize={subAdminPageSize}
                onPageChange={setSubAdminPage}
                onPageSizeChange={(newSize) => {
                  setSubAdminPageSize(newSize);
                  setSubAdminPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'roles' && currentUserRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Custom Roles ({roles.length})</h3>
            <Button size="sm" onClick={() => setIsRoleModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Role
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Role Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No roles created yet.</td></tr>
                  ) : (
                    paginatedRoles.map(role => (
                      <tr key={role._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white align-top">
                          {editingRole?._id === role._id ? (
                            <Input type="text" value={editingRole.name} onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} />
                          ) : role.name}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {editingRole?._id === role._id ? (
                            <div className="space-y-2">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = editingRole.permissions || [];
                                    const all = availablePermissions.map(p => p.id);
                                    setEditingRole({
                                      ...editingRole,
                                      permissions: current.length === all.length ? [] : all
                                    });
                                  }}
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                >
                                  {(editingRole.permissions || []).length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {availablePermissions.map(perm => {
                                  const isChecked = editingRole.permissions?.includes(perm.id);
                                  return (
                                    <label
                                      key={perm.id}
                                      className={`flex items-center space-x-2 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                                        isChecked
                                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold'
                                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const perms = editingRole.permissions || [];
                                          setEditingRole({
                                            ...editingRole,
                                            permissions: e.target.checked ? [...perms, perm.id] : perms.filter((p: string) => p !== perm.id)
                                          });
                                        }}
                                      />
                                      <span className="select-none">{perm.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {role.permissions?.map((p: string) => {
                                const permObj = availablePermissions.find(ap => ap.id === p);
                                const label = permObj?.label || (p === 'manage_problems' ? 'Hackathon Setup' : p);
                                return (
                                  <span key={p} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 rounded">
                                    {label}
                                  </span>
                                );
                              })}
                              {(!role.permissions || role.permissions.length === 0) && (
                                <span className="text-xs text-slate-400 italic">No permissions assigned</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex items-center justify-end space-x-2">
                            {editingRole?._id === role._id ? (
                              <>
                                <IconButton variant="success" icon={<Save className="w-4 h-4" />} onClick={saveRoleEdit} />
                                <IconButton variant="ghost" icon={<X className="w-4 h-4" />} onClick={() => setEditingRole(null)} />
                              </>
                            ) : (
                              <>
                                <IconButton variant="primary" icon={<Edit3 className="w-4 h-4" />} onClick={() => setEditingRole({ ...role, permissions: role.permissions || [] })} />
                                <IconButton variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => deleteRole(role._id)} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {roles.length > 0 && (
              <Pagination
                currentPage={rolePage}
                totalItems={roles.length}
                pageSize={rolePageSize}
                onPageChange={setRolePage}
                onPageSizeChange={(newSize) => {
                  setRolePageSize(newSize);
                  setRolePage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Judge Modal */}
      <Modal isOpen={isJudgeModalOpen} onClose={() => setIsJudgeModalOpen(false)} title="Add Judge Account">
        <form onSubmit={handleCreateJudge} className="space-y-5">
          <Input
            label="Name"
            type="text"
            required
            value={judgeName}
            onChange={e => setJudgeName(e.target.value)}
            placeholder="Judge full name"
          />
          <Input
            label="Email"
            type="email"
            required
            value={judgeEmail}
            onChange={e => setJudgeEmail(e.target.value)}
            placeholder="judge@hackathon.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={judgePassword}
            onChange={e => setJudgePassword(e.target.value)}
            placeholder="••••••••"
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Assessment Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setJudgeAssessmentMode('virtual')}
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all select-none ${
                  judgeAssessmentMode === 'virtual'
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Virtual Assessment</span>
                  <input
                    type="radio"
                    name="modalAssessmentMode"
                    value="virtual"
                    checked={judgeAssessmentMode === 'virtual'}
                    onChange={() => setJudgeAssessmentMode('virtual')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Shows QR Scanner & attendance page
                </span>
              </div>

              <div
                onClick={() => setJudgeAssessmentMode('offline')}
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all select-none ${
                  judgeAssessmentMode === 'offline'
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Offline</span>
                  <input
                    type="radio"
                    name="modalAssessmentMode"
                    value="offline"
                    checked={judgeAssessmentMode === 'offline'}
                    onChange={() => setJudgeAssessmentMode('offline')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Hides QR Scanner page for in-person evaluations
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isCreating} fullWidth leftIcon={<Plus className="w-4 h-4" />}>
            {isCreating ? 'Creating...' : 'Create Judge'}
          </Button>
        </form>
      </Modal>

      {/* Add Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Register New Team" maxWidth="2xl">
        <form onSubmit={handleCreateTeam} className="space-y-6">
          {/* General Team Info (Configured in Registration Setup) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Team Details
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Configured via Registration Setup
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTeamFields.map(field => 
                renderDynamicFieldInput(
                  field, 
                  teamFormData[field.key] || '', 
                  (val) => updateTeamField(field.key, val)
                )
              )}
            </div>
          </div>

          {/* Dynamic Members Section (Configured in Registration Setup) */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  Team Members ({newTeamMembers.length})
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Member 1 will be designated as the Team Lead.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setNewTeamMembers(prev => [...prev, {}])} 
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {newTeamMembers.map((member, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Member {idx + 1} {idx === 0 && <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">(Team Lead)</span>}
                    </h4>
                    {idx > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setNewTeamMembers(prev => prev.filter((_, i) => i !== idx))} 
                        className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors" 
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMemberFields.map(field => 
                      renderDynamicFieldInput(
                        field, 
                        member[field.key] ?? member.customFields?.[field.key] ?? '', 
                        (val) => updateMemberField(idx, field.key, val)
                      )
                    )}
                  </div>
                </div>
              ))}
              {newTeamMembers.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-sm text-slate-500">No members added. Click &quot;Add Member&quot; above to add members.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="submit" disabled={isCreatingTeam} fullWidth leftIcon={<Plus className="w-5 h-5" />}>
              {isCreatingTeam ? 'Creating Team...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Full Team Modal */}
      <Modal isOpen={!!editingFullTeam} onClose={() => setEditingFullTeam(null)} title="Edit Team Details" maxWidth="2xl">
        {editingFullTeam && (
          <form onSubmit={saveFullTeamEdit} className="space-y-6">
            {/* General Team Info (Configured in Registration Setup) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Team Details
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Configured via Registration Setup
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTeamFields.map(field => 
                  renderDynamicFieldInput(
                    field, 
                    editingFullTeam[field.key] ?? editingFullTeam.customFields?.[field.key] ?? '', 
                    (val) => setEditingFullTeam((prev: any) => ({
                      ...prev,
                      [field.key]: val,
                      customFields: { ...(prev.customFields || {}), [field.key]: val }
                    }))
                  )
                )}
              </div>
            </div>

            {/* Dynamic Members Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-slate-800 dark:text-white ml-1">
                  Team Members ({(editingFullTeam.members || []).length})
                </label>
                <button 
                  type="button" 
                  onClick={() => setEditingFullTeam((prev: any) => ({
                    ...prev,
                    members: [...(prev.members || []), { name: '', attendance: false }]
                  }))} 
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Member
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {(editingFullTeam.members || []).map((member: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Member {idx + 1} {idx === 0 && <span className="text-indigo-500">(Team Lead)</span>}
                      </h4>
                      {idx > 0 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const newMembers = [...editingFullTeam.members];
                            newMembers.splice(idx, 1);
                            setEditingFullTeam({ ...editingFullTeam, members: newMembers });
                          }} 
                          className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1" 
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeMemberFields.map(field => 
                        renderDynamicFieldInput(
                          field, 
                          member[field.key] ?? member.customFields?.[field.key] ?? '', 
                          (val) => {
                            const newMembers = [...editingFullTeam.members];
                            newMembers[idx] = {
                              ...newMembers[idx],
                              [field.key]: val,
                              customFields: { ...(newMembers[idx].customFields || {}), [field.key]: val }
                            };
                            setEditingFullTeam({ ...editingFullTeam, members: newMembers });
                          }
                        )
                      )}
                    </div>
                  </div>
                ))}
                {(!editingFullTeam.members || editingFullTeam.members.length === 0) && (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-500">No members added.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-700">
              <Button type="submit" fullWidth leftIcon={<Save className="w-5 h-5" />}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Team Modal */}
      <Modal isOpen={!!viewingTeam} onClose={() => setViewingTeam(null)} title={viewingTeam?.name} maxWidth="3xl">
        {viewingTeam && (
          <div className="space-y-6 pb-6">
            {/* Cross-Team Conflict Team Banner */}
            {teamConflictMap.has(viewingTeam.name) && (
              <div className="p-4 rounded-2xl bg-amber-500 text-white text-xs font-black flex items-center gap-2.5 shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  WARNING: CROSS-TEAM CONFLICT DETECTED. One or more members of this team are also registered in: {teamConflictMap.get(viewingTeam.name)?.otherTeams.join(', ')}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">ID: {viewingTeam.uniqueId}</span>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-500/20">Track: {viewingTeam.problemStatementId?.track || 'N/A'}</span>
              {viewingTeam.problemStatementId?.title && (
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 truncate max-w-xs" title={viewingTeam.problemStatementId.title}>
                  PS: {viewingTeam.problemStatementId.title}
                </span>
              )}
            </div>

            {/* Team Lead Section */}
            {(() => {
              const leadEmp = (viewingTeam.leadEmpId || viewingTeam.leadSupersetId || viewingTeam.supersetId || viewingTeam.members?.[0]?.empId || viewingTeam.members?.[0]?.supersetId || '').trim().toLowerCase();
              const leadConflicts = (leadEmp && memberConflictMap.get(leadEmp) ? memberConflictMap.get(leadEmp)! : []).filter((t: string) => t !== viewingTeam.name);

              return (
                <div className={`rounded-2xl p-6 border shadow-xs transition-all ${
                  leadConflicts.length > 0
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600'
                    : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <User className="w-4 h-4 mr-2 text-indigo-500" /> TEAM LEAD
                    </h4>
                    {leadConflicts.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Duplicate Lead
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Employee Name</p>
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{viewingTeam.leadName || 'Not provided'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Employee ID</p>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{viewingTeam.leadEmpId || viewingTeam.leadSupersetId || viewingTeam.supersetId || viewingTeam.members?.[0]?.empId || viewingTeam.members?.[0]?.supersetId || 'Not provided'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Email Address</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center min-w-0">
                        <Mail className="w-3.5 h-3.5 mr-1.5 opacity-50 flex-shrink-0" />
                        <span className="break-all text-xs sm:text-sm">{viewingTeam.leadEmail || 'Not provided'}</span>
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Location / Place</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center min-w-0">
                        <Building className="w-3.5 h-3.5 mr-1.5 opacity-50 flex-shrink-0" />
                        <span className="truncate" title={viewingTeam.place || viewingTeam.collegeName}>{viewingTeam.place || viewingTeam.collegeName || 'Not provided'}</span>
                      </p>
                    </div>
                  </div>

                  {leadConflicts.length > 0 && (
                    <div className="mt-4 p-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>⚠️ Lead is also registered in team: {leadConflicts.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Team Members Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-500" /> TEAM MEMBERS ({viewingTeam.members ? viewingTeam.members.filter((m: any, idx: number) => !((m.email && m.email === viewingTeam.leadEmail) || (m.name === viewingTeam.leadName && idx === 0))).length : 0})
              </h4>

              {(!viewingTeam.members || viewingTeam.members.filter((m: any, idx: number) => !((m.email && m.email === viewingTeam.leadEmail) || (m.name === viewingTeam.leadName && idx === 0))).length === 0) ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 text-sm">No additional members added.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewingTeam.members.filter((m: any, idx: number) => !((m.email && m.email === viewingTeam.leadEmail) || (m.name === viewingTeam.leadName && idx === 0))).map((m: any, idx: number) => {
                    const mEmp = (m.empId || m.supersetId || '').trim().toLowerCase();
                    const memberConflicts = (mEmp && memberConflictMap.get(mEmp) ? memberConflictMap.get(mEmp)! : []).filter((t: string) => t !== viewingTeam.name);
                    const isDuplicateMember = memberConflicts.length > 0;

                    return (
                    <div 
                      key={idx} 
                      className={`rounded-2xl p-6 border transition-all shadow-xs ${
                        isDuplicateMember
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mr-2">
                            {idx + 1}
                          </span>
                          MEMBER {idx + 1}
                        </h5>
                        <div className="flex items-center gap-2">
                          {isDuplicateMember && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Duplicate Member
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Employee Name</p>
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{m.name || 'Not provided'}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Employee ID</p>
                          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{m.empId || m.supersetId || 'Not provided'}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Email Address</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center min-w-0">
                            <Mail className="w-3.5 h-3.5 mr-1.5 opacity-50 flex-shrink-0" />
                            <span className="break-all text-xs sm:text-sm">{m.email || 'Not provided'}</span>
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Location / Place</p>
                          <p className="font-medium text-slate-900 dark:text-white flex items-center min-w-0">
                            <Building className="w-3.5 h-3.5 mr-1.5 opacity-50 flex-shrink-0" />
                            <span className="truncate" title={m.place || m.college || viewingTeam.place || viewingTeam.collegeName}>{m.place || m.college || viewingTeam.place || viewingTeam.collegeName || 'Not provided'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Duplicate Conflict Warning Box */}
                      {isDuplicateMember && (
                        <div className="mt-4 p-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>⚠️ Also registered in team: {memberConflicts.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* Add Sub-Admin Modal */}
      <Modal isOpen={isSubAdminModalOpen} onClose={() => setIsSubAdminModalOpen(false)} title="Add Sub-Admin">
        <form onSubmit={handleCreateSubAdmin} className="space-y-5">
          <Input label="Name" type="text" required value={subAdminName} onChange={e => setSubAdminName(e.target.value)} placeholder="Sub-Admin Name" />
          <Input label="Email" type="email" required value={subAdminEmail} onChange={e => setSubAdminEmail(e.target.value)} placeholder="admin@hackathon.com" />
          <Input label="Password" type="password" required value={subAdminPassword} onChange={e => setSubAdminPassword(e.target.value)} placeholder="••••••••" />

          <div className="pt-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Role</h4>
            <select
              required
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={subAdminRoleId}
              onChange={(e) => setSubAdminRoleId(e.target.value)}
            >
              <option value="" disabled>Select a Role</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isCreatingSubAdmin} fullWidth leftIcon={<Plus className="w-4 h-4" />}>
            {isCreatingSubAdmin ? 'Creating...' : 'Create Sub-Admin'}
          </Button>
        </form>
      </Modal>

      {/* Add Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Create Custom Role">
        <form onSubmit={handleCreateRole} className="space-y-5">
          <Input label="Role Name" type="text" required value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Scanner Staff" />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Permissions ({rolePermissions.length}/{availablePermissions.length})</h4>
              <button
                type="button"
                onClick={() => {
                  if (rolePermissions.length === availablePermissions.length) {
                    setRolePermissions([]);
                  } else {
                    setRolePermissions(availablePermissions.map(p => p.id));
                  }
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                {rolePermissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
              {availablePermissions.map(perm => {
                const isChecked = rolePermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) setRolePermissions([...rolePermissions, perm.id]);
                        else setRolePermissions(rolePermissions.filter(p => p !== perm.id));
                      }}
                    />
                    <span className="text-xs font-semibold select-none">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={isCreatingRole} fullWidth leftIcon={<Plus className="w-4 h-4" />}>
            {isCreatingRole ? 'Creating...' : 'Save Role'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
