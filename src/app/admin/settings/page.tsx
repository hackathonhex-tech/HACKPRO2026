"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { GlobalSettingsPanel } from '@/components/organisms/GlobalSettingsPanel';
import { AdminTimerControls } from '@/components/organisms/AdminTimerControls';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { getAdminSettingsAction, updateAdminSettingsAction } from '@/server/actions/settings.actions';

export default function SettingsPage() {
  const [isPublicLeaderboardVisible, setIsPublicLeaderboardVisible] = useState(true);
  const [isTeamLeaderboardVisible, setIsTeamLeaderboardVisible] = useState(true);
  const [hideTeamDetailsOnLeaderboard, setHideTeamDetailsOnLeaderboard] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [leaderboardFilters, setLeaderboardFilters] = useState({ round: false, judge: false, problemStatement: false });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const settingsData = await getAdminSettingsAction();
    
    if (!settingsData.success) {
      setLoading(false);
      return;
    }

    if ((settingsData as any).settings) {
      const s = (settingsData as any).settings;
      setIsPublicLeaderboardVisible(s.isPublicLeaderboardVisible ?? true);
      setIsTeamLeaderboardVisible(s.isTeamLeaderboardVisible ?? true);
      setHideTeamDetailsOnLeaderboard(s.hideTeamDetailsOnLeaderboard ?? false);
      setIsRegistrationOpen(s.isRegistrationOpen ?? true);
      setMaxTeamSize(s.maxTeamSize ?? 4);
      if (s.leaderboardFilters) {
        setLeaderboardFilters(s.leaderboardFilters);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePublicLeaderboard = async () => {
    const newValue = !isPublicLeaderboardVisible;
    setIsPublicLeaderboardVisible(newValue);
    const res = await updateAdminSettingsAction({ isPublicLeaderboardVisible: newValue });
    if (!res.success) {
      setIsPublicLeaderboardVisible(!newValue);
      alert('Failed to update public leaderboard visibility');
    }
  };

  const handleToggleTeamLeaderboard = async () => {
    const newValue = !isTeamLeaderboardVisible;
    setIsTeamLeaderboardVisible(newValue);
    const res = await updateAdminSettingsAction({ isTeamLeaderboardVisible: newValue });
    if (!res.success) {
      setIsTeamLeaderboardVisible(!newValue);
      alert('Failed to update team leaderboard visibility');
    }
  };

  const handleToggleHideTeamDetails = async () => {
    const newValue = !hideTeamDetailsOnLeaderboard;
    setHideTeamDetailsOnLeaderboard(newValue);
    const res = await updateAdminSettingsAction({ hideTeamDetailsOnLeaderboard: newValue });
    if (!res.success) {
      setHideTeamDetailsOnLeaderboard(!newValue);
      alert('Failed to update anonymous leaderboard setting');
    }
  };

  const handleToggleRegistration = async () => {
    const newValue = !isRegistrationOpen;
    setIsRegistrationOpen(newValue);
    const res = await updateAdminSettingsAction({ isRegistrationOpen: newValue });
    if (!res.success) {
      setIsRegistrationOpen(!newValue);
      alert('Failed to update registration status');
    }
  };

  const handleSaveMaxTeamSize = async (newSize: number) => {
    const oldSize = maxTeamSize;
    setMaxTeamSize(newSize);
    const res = await updateAdminSettingsAction({ maxTeamSize: newSize });
    if (!res.success) {
      setMaxTeamSize(oldSize);
      alert('Failed to update team size');
    } else {
      alert('Team size updated successfully!');
    }
  };

  const handleToggleLeaderboardFilter = async (filterName: keyof typeof leaderboardFilters) => {
    const newFilters = { ...leaderboardFilters, [filterName]: !leaderboardFilters[filterName] };
    setLeaderboardFilters(newFilters);
    const res = await updateAdminSettingsAction({ leaderboardFilters: newFilters });
    if (!res.success) {
      setLeaderboardFilters(leaderboardFilters);
      alert('Failed to update filter settings');
    }
  };

  if (loading) {
    return <LoadingScreen variant="form" />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Global Settings</h2>
          <p className="text-slate-500 mt-1">Manage platform-wide configurations and rules.</p>
        </div>
      </div>
      
      <GlobalSettingsPanel 
        isPublicLeaderboardVisible={isPublicLeaderboardVisible} 
        onTogglePublicLeaderboard={handleTogglePublicLeaderboard}
        isTeamLeaderboardVisible={isTeamLeaderboardVisible}
        onToggleTeamLeaderboard={handleToggleTeamLeaderboard}
        hideTeamDetailsOnLeaderboard={hideTeamDetailsOnLeaderboard}
        onToggleHideTeamDetails={handleToggleHideTeamDetails}
        isRegistrationOpen={isRegistrationOpen}
        onToggleRegistration={handleToggleRegistration}
        maxTeamSize={maxTeamSize}
        onSaveMaxTeamSize={handleSaveMaxTeamSize}
        leaderboardFilters={leaderboardFilters}
        onToggleLeaderboardFilter={handleToggleLeaderboardFilter}
      />

      <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-12">
        <AdminTimerControls />
      </div>
    </motion.div>
  );
}
