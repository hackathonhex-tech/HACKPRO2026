import React, { useState } from 'react';

interface GlobalSettingsPanelProps {
  isPublicLeaderboardVisible: boolean;
  onTogglePublicLeaderboard: () => void;
  isTeamLeaderboardVisible: boolean;
  onToggleTeamLeaderboard: () => void;
  hideTeamDetailsOnLeaderboard: boolean;
  onToggleHideTeamDetails: () => void;
  isRegistrationOpen: boolean;
  onToggleRegistration: () => void;
  maxTeamSize: number;
  onSaveMaxTeamSize: (newSize: number) => void;
  leaderboardFilters: { round: boolean; judge: boolean; problemStatement: boolean };
  onToggleLeaderboardFilter: (filterName: keyof GlobalSettingsPanelProps['leaderboardFilters']) => void;
}

export const GlobalSettingsPanel: React.FC<GlobalSettingsPanelProps> = ({ 
  isPublicLeaderboardVisible, 
  onTogglePublicLeaderboard,
  isTeamLeaderboardVisible,
  onToggleTeamLeaderboard,
  hideTeamDetailsOnLeaderboard,
  onToggleHideTeamDetails,
  isRegistrationOpen,
  onToggleRegistration,
  maxTeamSize,
  onSaveMaxTeamSize,
  leaderboardFilters,
  onToggleLeaderboardFilter
}) => {
  const [localTeamSize, setLocalTeamSize] = useState(maxTeamSize.toString());

  const handleSaveTeamSize = () => {
    const size = parseInt(localTeamSize);
    if (!isNaN(size) && size > 0) {
      onSaveMaxTeamSize(size);
    }
  };

  return (
    <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Global Settings</h3>
        
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Public Leaderboard Visibility</p>
            <p className="text-xs text-slate-500 mt-1">When turned off, guests and public cannot view the leaderboard.</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer ml-4">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={isPublicLeaderboardVisible} 
                onChange={onTogglePublicLeaderboard} 
                className="peer sr-only" 
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 w-16">
              {isPublicLeaderboardVisible ? 'Visible' : 'Hidden'}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Team Portal Leaderboard Visibility</p>
            <p className="text-xs text-slate-500 mt-1">When turned off, logged-in hackers cannot view the leaderboard.</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer ml-4">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={isTeamLeaderboardVisible} 
                onChange={onToggleTeamLeaderboard} 
                className="peer sr-only" 
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 w-16">
              {isTeamLeaderboardVisible ? 'Visible' : 'Hidden'}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Anonymous Leaderboard (Hide Team Details)</p>
            <p className="text-xs text-slate-500 mt-1">If enabled, public and teams only see scores. (Admins/Judges still see full details).</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer ml-4">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={hideTeamDetailsOnLeaderboard} 
                onChange={onToggleHideTeamDetails} 
                className="peer sr-only" 
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 w-16">
              {hideTeamDetailsOnLeaderboard ? 'Hidden' : 'Shown'}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Registration Status</p>
            <p className="text-xs text-slate-500 mt-1">Open or close public team registration.</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer ml-4">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={isRegistrationOpen} 
                onChange={onToggleRegistration} 
                className="peer sr-only" 
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 w-16">
              {isRegistrationOpen ? 'Open' : 'Closed'}
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between py-3">
          <div className="mr-4 mb-2 sm:mb-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Exact Team Size</p>
            <p className="text-xs text-slate-500 mt-1">Includes the Team Lead. Teams MUST have exactly this many members.</p>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="number" 
              min="1"
              max="20"
              value={localTeamSize}
              onChange={(e) => setLocalTeamSize(e.target.value)}
              className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold"
            />
            <button 
              onClick={handleSaveTeamSize}
              disabled={parseInt(localTeamSize) === maxTeamSize || isNaN(parseInt(localTeamSize))}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <h4 className="text-md font-bold text-slate-900 dark:text-white mb-4">Leaderboard Filters</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Round Filter</p>
                <p className="text-xs text-slate-500">Allow users to filter leaderboard by round.</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer ml-4">
                <div className="relative">
                  <input type="checkbox" checked={leaderboardFilters.round} onChange={() => onToggleLeaderboardFilter('round')} className="peer sr-only" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                </div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Judge Filter</p>
                <p className="text-xs text-slate-500">Allow users to filter leaderboard by judge.</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer ml-4">
                <div className="relative">
                  <input type="checkbox" checked={leaderboardFilters.judge} onChange={() => onToggleLeaderboardFilter('judge')} className="peer sr-only" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                </div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Problem Statement Filter</p>
                <p className="text-xs text-slate-500">Allow users to filter leaderboard by problem statement.</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer ml-4">
                <div className="relative">
                  <input type="checkbox" checked={leaderboardFilters.problemStatement} onChange={() => onToggleLeaderboardFilter('problemStatement')} className="peer sr-only" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
