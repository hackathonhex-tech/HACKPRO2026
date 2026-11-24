"use client";

import { useState, useEffect } from 'react';
import { UserManagementBoard } from '@/components/organisms/UserManagementBoard';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { getJudgesAction, createJudgeAction, updateJudgeAction, deleteJudgeAction } from '@/server/actions/judge.actions';
import { getPaginatedTeamsAction, createTeamAction, updateTeamAction, deleteTeamAction } from '@/server/actions/admin.team.actions';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';
import { getMeAction } from '@/server/actions/auth.actions';
import { getSubAdminsAction, createSubAdminAction, updateSubAdminAction, deleteSubAdminAction } from '@/server/actions/subadmin.actions';
import { getRolesAction, createRoleAction, updateRoleAction, deleteRoleAction } from '@/server/actions/role.actions';

export default function UsersPage() {
  const [judges, setJudges] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [distinctPlaces, setDistinctPlaces] = useState<string[]>([]);
  const [conflictingTeamNames, setConflictingTeamNames] = useState<string[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [registrationFieldsConfig, setRegistrationFieldsConfig] = useState<any>(null);

  const fetchUsers = async (initial = false) => {
    if (initial) setLoading(true);
    const [meRes, judgeRes, teamRes, settingsData] = await Promise.all([
      getMeAction(),
      getJudgesAction(),
      getPaginatedTeamsAction({ page: 1, limit: 10 }),
      getPublicSettingsAction()
    ]);

    if (meRes.success && meRes.user) {
      setCurrentUserRole(meRes.user.role as string);
      if (meRes.user.role === 'admin') {
        const [subAdminRes, rolesRes] = await Promise.all([
          getSubAdminsAction(),
          getRolesAction()
        ]);
        if (subAdminRes.success) setSubAdmins((subAdminRes as any).subAdmins);
        if (rolesRes.success) setRoles((rolesRes as any).roles);
      }
    }

    if (judgeRes.success) setJudges((judgeRes as any).judges);
    if (teamRes.success) {
      setTeams((teamRes as any).teams || []);
      setTotalTeams((teamRes as any).total || 0);
      setDistinctPlaces((teamRes as any).distinctPlaces || []);
      setConflictingTeamNames((teamRes as any).conflictingTeamNames || []);
    }
    if (settingsData.success && (settingsData as any).settings) {
      setMaxTeamSize((settingsData as any).settings.maxTeamSize ?? 4);
      if ((settingsData as any).settings.registrationFieldsConfig) {
        setRegistrationFieldsConfig((settingsData as any).settings.registrationFieldsConfig);
      }
    }
    if (initial) setLoading(false);
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  const handleCreateJudge = async (data: any) => {
    const res = await createJudgeAction(data);
    return res;
  };

  const handleCreateTeam = async (data: any) => {
    const res = await createTeamAction(data);
    return res.success;
  };

  const handleDeleteJudge = async (id: string) => {
    const res = await deleteJudgeAction(id);
    if (res.success) {
      setJudges(prev => prev.filter(j => j._id !== id));
    }
    return res.success;
  };

  const handleEditJudge = async (id: string, data: any) => {
    const res = await updateJudgeAction(id, data);
    return res.success;
  };

  const handleDeleteTeam = async (id: string) => {
    const res = await deleteTeamAction(id);
    if (res.success) {
      setTeams(prev => prev.filter(t => t._id !== id));
    }
    return res.success;
  };

  const handleEditTeam = async (id: string, data: any) => {
    const res = await updateTeamAction(id, data);
    return res.success;
  };

  const handleCreateSubAdmin = async (data: any) => {
    const res = await createSubAdminAction(data);
    return res;
  };

  const handleEditSubAdmin = async (id: string, data: any) => {
    const res = await updateSubAdminAction(id, data);
    return res.success;
  };

  const handleDeleteSubAdmin = async (id: string) => {
    const res = await deleteSubAdminAction(id);
    if (res.success) {
      setSubAdmins(prev => prev.filter(s => s._id !== id));
    }
    return res.success;
  };

  const handleCreateRole = async (data: any) => {
    const res = await createRoleAction(data);
    return res.success;
  };

  const handleEditRole = async (id: string, data: any) => {
    const res = await updateRoleAction(id, data);
    return res.success;
  };

  const handleDeleteRole = async (id: string) => {
    const res = await deleteRoleAction(id);
    if (res.success) {
      setRoles(prev => prev.filter(r => r._id !== id));
    }
    return res.success;
  };

  if (loading) {
    return <LoadingScreen variant="table" />;
  }

  return (
    <UserManagementBoard 
      judges={judges}
      teams={teams}
      initialTeamsTotal={totalTeams}
      initialDistinctPlaces={distinctPlaces}
      initialConflictingTeamNames={conflictingTeamNames}
      subAdmins={subAdmins}
      roles={roles}
      currentUserRole={currentUserRole}
      maxTeamSize={maxTeamSize}
      registrationFieldsConfig={registrationFieldsConfig}
      onRefresh={fetchUsers}
      onCreateJudge={handleCreateJudge}
      onDeleteJudge={handleDeleteJudge}
      onEditJudge={handleEditJudge}
      onCreateTeam={handleCreateTeam}
      onDeleteTeam={handleDeleteTeam}
      onEditTeam={handleEditTeam}
      onCreateSubAdmin={handleCreateSubAdmin}
      onEditSubAdmin={handleEditSubAdmin}
      onDeleteSubAdmin={handleDeleteSubAdmin}
      onCreateRole={handleCreateRole}
      onEditRole={handleEditRole}
      onDeleteRole={handleDeleteRole}
    />
  );
}
