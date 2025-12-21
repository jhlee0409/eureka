'use client';

import React from 'react';
import { useScreen } from '../context/ScreenContext';

export function ScreenHeader() {
  const {
    group,
    allScreens,
    activeScreen,
    activeScreenId,
    setActiveScreenId,
    viewMode,
    setViewMode,
    handleClose,
  } = useScreen();

  if (!group) return null;

  return (
    <header className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 z-50">
      {/* Left: Back Button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
          aria-label="뒤로 가기"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900">
            {group.prefix}
            {activeScreenId === null ? (
              <span className="text-yellow-600 ml-1.5">종합 (MASTER)</span>
            ) : (
              <span className="text-slate-400 ml-1.5 font-medium">/ {activeScreen?.name || ''}</span>
            )}
          </h1>
          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">{group.pageName}</p>
        </div>
      </div>

      {/* Center: Screen Tabs */}
      <ScreenTabs
        allScreens={allScreens}
        activeScreenId={activeScreenId}
        onScreenChange={setActiveScreenId}
      />

      {/* Right: View Mode & Close */}
      <div className="flex items-center gap-2">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        <button
          onClick={handleClose}
          className="text-[10px] font-bold text-slate-400 hover:text-red-500 px-2 transition-colors"
        >
          닫기
        </button>
      </div>
    </header>
  );
}

// ============================================
// Sub-components
// ============================================

interface ScreenTabsProps {
  allScreens: { figmaId: string; name: string }[];
  activeScreenId: string | null;
  onScreenChange: (id: string | null) => void;
}

function ScreenTabs({ allScreens, activeScreenId, onScreenChange }: ScreenTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-3xl">
      <button
        onClick={() => onScreenChange(null)}
        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
          activeScreenId === null ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        MASTER
      </button>
      <div className="w-px h-3 bg-slate-300" />
      {allScreens.map((screen) => (
        <button
          key={screen.figmaId}
          onClick={() => onScreenChange(screen.figmaId)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
            activeScreenId === screen.figmaId
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {screen.name}
        </button>
      ))}
    </div>
  );
}

interface ViewModeToggleProps {
  viewMode: 'standard' | 'developer' | 'qa';
  onViewModeChange: (mode: 'standard' | 'developer' | 'qa') => void;
}

function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const modes = [
    { key: 'standard' as const, label: '화면', activeClass: 'bg-white text-slate-900 shadow-sm' },
    { key: 'developer' as const, label: '담당자', activeClass: 'bg-blue-500 text-white' },
    { key: 'qa' as const, label: 'QA', activeClass: 'bg-purple-500 text-white' },
  ];

  return (
    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
      {modes.map(({ key, label, activeClass }) => (
        <button
          key={key}
          onClick={() => onViewModeChange(key)}
          className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
            viewMode === key ? activeClass : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
