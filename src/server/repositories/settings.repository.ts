import connectToDatabase from '@/server/config/db';
import Settings from '@/server/models/Settings';
import Evaluation from '@/server/models/Evaluation';

export async function getSettings() {
  await connectToDatabase();
  const settings = await Settings.findOne({}).lean();
  return settings ? JSON.parse(JSON.stringify(settings)) : null;
}

export async function createSettings(data: any) {
  await connectToDatabase();
  const settings = await Settings.create(data);
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
