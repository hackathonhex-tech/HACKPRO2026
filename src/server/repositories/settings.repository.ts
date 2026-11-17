import connectToDatabase from '@/server/config/db';
import Settings from '@/server/models/Settings';
import Evaluation from '@/server/models/Evaluation';

export const DEFAULT_REGISTRATION_FIELDS_CONFIG = {
  teamFields: [
    { id: 'name', key: 'name', label: 'Team Name', type: 'text', placeholder: 'e.g. Code Ninjas', required: true, enabled: true, isCustom: false, description: 'Unique name of your hackathon team' },
    { id: 'collegeName', key: 'collegeName', label: 'College / Institution', type: 'text', placeholder: 'e.g. MIT Chennai', required: true, enabled: true, isCustom: false, description: 'College or university affiliation' },
    { id: 'department', key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Computer Science', required: true, enabled: true, isCustom: false, description: 'Academic department or engineering branch' }
  ],
  memberFields: [
    { id: 'name', key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. John Doe', required: true, enabled: true, isCustom: false, description: 'Full legal/academic name' },
    { id: 'supersetId', key: 'supersetId', label: 'Superset ID / Roll No', type: 'text', placeholder: 'e.g. 123456', required: true, enabled: true, isCustom: false, description: 'Candidate Superset ID or college roll number' },
    { id: 'email', key: 'email', label: 'Email ID', type: 'email', placeholder: 'e.g. john@college.edu', required: true, enabled: true, isCustom: false, description: 'Contact email (used as login ID for Team Lead)' },
    { id: 'phone', key: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true, enabled: true, isCustom: false, description: '10-digit mobile number' }
  ]
};

export async function getSettings() {
  await connectToDatabase();
  const settings = await Settings.findOne({}).lean();
  if (!settings) return null;
  const parsed = JSON.parse(JSON.stringify(settings));
  if (!parsed.registrationFieldsConfig || !parsed.registrationFieldsConfig.teamFields || parsed.registrationFieldsConfig.teamFields.length === 0) {
    parsed.registrationFieldsConfig = DEFAULT_REGISTRATION_FIELDS_CONFIG;
  }
  return parsed;
}

export async function createSettings(data: any) {
  await connectToDatabase();
  if (!data.registrationFieldsConfig) {
    data.registrationFieldsConfig = DEFAULT_REGISTRATION_FIELDS_CONFIG;
  }
  const settings = await Settings.create(data);
  return JSON.parse(JSON.stringify(settings));
}

export async function updateRegistrationFieldsConfig(config: any) {
  await connectToDatabase();
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = new Settings({
      isPublicLeaderboardVisible: true,
      isTeamLeaderboardVisible: true,
      hideTeamDetailsOnLeaderboard: false,
      isRegistrationOpen: true,
      maxTeamSize: 4,
      registrationFieldsConfig: config
    });
  } else {
    settings.registrationFieldsConfig = config;
    settings.markModified('registrationFieldsConfig');
  }
  await settings.save();
  return JSON.parse(JSON.stringify(settings));
}

export async function updateSettings(data: any) {
  await connectToDatabase();
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = new Settings({ 
      isLeaderboardVisible: data.isLeaderboardVisible,
      isPublicLeaderboardVisible: data.isPublicLeaderboardVisible ?? true,
      isTeamLeaderboardVisible: data.isTeamLeaderboardVisible ?? true,
      hideTeamDetailsOnLeaderboard: data.hideTeamDetailsOnLeaderboard ?? false,
      isRegistrationOpen: data.isRegistrationOpen,
      maxTeamSize: data.maxTeamSize,
      leaderboardFilters: data.leaderboardFilters || { round: true, judge: true, problemStatement: true }
    });
  } else {
    if (typeof data.isLeaderboardVisible === 'boolean') {
      settings.isLeaderboardVisible = data.isLeaderboardVisible;
    }
    if (typeof data.isPublicLeaderboardVisible === 'boolean') {
      settings.isPublicLeaderboardVisible = data.isPublicLeaderboardVisible;
    }
    if (typeof data.isTeamLeaderboardVisible === 'boolean') {
      settings.isTeamLeaderboardVisible = data.isTeamLeaderboardVisible;
    }
    if (typeof data.hideTeamDetailsOnLeaderboard === 'boolean') {
      settings.hideTeamDetailsOnLeaderboard = data.hideTeamDetailsOnLeaderboard;
    }
    if (typeof data.isRegistrationOpen === 'boolean') {
      settings.isRegistrationOpen = data.isRegistrationOpen;
    }
    if (typeof data.maxTeamSize === 'number') {
      settings.maxTeamSize = data.maxTeamSize;
    }
    if (data.registrationFieldsConfig) {
      settings.registrationFieldsConfig = data.registrationFieldsConfig;
      settings.markModified('registrationFieldsConfig');
    }
    if (data.leaderboardFilters) {
      settings.leaderboardFilters = {
        round: Boolean(data.leaderboardFilters.round),
        judge: Boolean(data.leaderboardFilters.judge),
        problemStatement: Boolean(data.leaderboardFilters.problemStatement)
      };
    }
  }
  
  await settings.save();
  return JSON.parse(JSON.stringify(settings));
}

export async function getLockedEvaluations() {
  await connectToDatabase();
  const evaluations = await Evaluation.find({ isLocked: true })
    .populate({
      path: 'teamId',
      select: 'name uniqueId problemStatementId',
      populate: { path: 'problemStatementId', select: 'title track' }
    })
    .populate('roundId', 'name')
    .populate('judgeId', 'name')
    .lean();
  return JSON.parse(JSON.stringify(evaluations));
}
