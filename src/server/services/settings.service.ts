import { getSettings, createSettings, updateSettings, updateRegistrationFieldsConfig as updateFieldsConfigRepo, getLockedEvaluations, DEFAULT_REGISTRATION_FIELDS_CONFIG } from '../repositories/settings.repository';

export async function getPublicSettings() {
  const settings = await getSettings();
  
  const result = {
    isLeaderboardVisible: settings?.isLeaderboardVisible ?? true,
    isPublicLeaderboardVisible: settings?.isPublicLeaderboardVisible ?? true,
    isTeamLeaderboardVisible: settings?.isTeamLeaderboardVisible ?? true,
    hideTeamDetailsOnLeaderboard: settings?.hideTeamDetailsOnLeaderboard ?? false,
    isRegistrationOpen: settings?.isRegistrationOpen ?? true,
    maxTeamSize: settings?.maxTeamSize ?? 4,
    leaderboardFilters: settings?.leaderboardFilters || { round: true, judge: true, problemStatement: true },
    registrationFieldsConfig: settings?.registrationFieldsConfig || DEFAULT_REGISTRATION_FIELDS_CONFIG
  };

  return { success: true, settings: result };
}

export async function getAdminSettings() {
  let settings = await getSettings();
  if (!settings) {
    settings = await createSettings({ 
      isPublicLeaderboardVisible: true,
      isTeamLeaderboardVisible: true,
      hideTeamDetailsOnLeaderboard: false,
      leaderboardFilters: { round: true, judge: true, problemStatement: true },
      registrationFieldsConfig: DEFAULT_REGISTRATION_FIELDS_CONFIG
    });
  }
  return { success: true, settings };
}

export async function updateAdminSettings(body: any) {
  const settings = await updateSettings(body);
  return { success: true, settings };
}

export async function updateRegistrationFieldsConfig(config: any) {
  const settings = await updateFieldsConfigRepo(config);
  return { success: true, settings };
}

export async function getLeaderboard(userRole?: string) {
  let settings = await getSettings();
  if (!settings) {
    settings = await createSettings({ 
      isPublicLeaderboardVisible: true,
      isTeamLeaderboardVisible: true,
      hideTeamDetailsOnLeaderboard: false
    });
  }
  
  const isAdminOrJudge = userRole === 'admin' || userRole === 'sub-admin' || userRole === 'judge';
  const isTeam = userRole === 'team';

  if (!isAdminOrJudge) {
    if (isTeam && !settings.isTeamLeaderboardVisible) {
       return { success: false, hidden: true, message: 'Leaderboard is currently hidden for teams.' };
    }
    if (!isTeam && !settings.isPublicLeaderboardVisible) {
       return { success: false, hidden: true, message: 'Public leaderboard is currently hidden.' };
    }
  }
  
  let evaluations = await getLockedEvaluations();

  // Anonymize if needed
  if (settings.hideTeamDetailsOnLeaderboard && !isAdminOrJudge) {
    // Generate an anonymous map
    const teamNameMap = new Map<string, string>();
    let counter = 1;
    
    evaluations = evaluations.map((ev: any) => {
      const tId = ev.teamId?._id?.toString();
      if (!tId) return ev;
      
      if (!teamNameMap.has(tId)) {
        teamNameMap.set(tId, `Anonymous Team ${counter++}`);
      }
      
      const anonymizedTeam = {
        ...ev.teamId,
        name: teamNameMap.get(tId),
        uniqueId: 'HIDDEN',
        collegeName: 'Confidential',
        members: []
      };

      return {
        ...ev,
        teamId: anonymizedTeam
      };
    });
  }

  return { success: true, evaluations };
}
