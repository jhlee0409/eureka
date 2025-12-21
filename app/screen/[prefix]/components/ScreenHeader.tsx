'use client';

import React, { useState } from 'react';
import { useScreen } from '../context/ScreenContext';
import { UNIFIED_TAB_CONFIG, UnifiedTab } from '../config/constants';

export function ScreenHeader() {
  const {
    group,
    allScreens,
    activeScreen,
    activeScreenId,
    setActiveScreenId,
    isMasterView,
    activeTab,
    setActiveTab,
    isSpecPanelOpen,
    toggleSpecPanel,
    handleClose,
  } = useScreen();

  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);

  if (!group) return null;

  return (
    <header className="border-b border-slate-200 bg-white shrink-0 z-50">
      {/* Top Bar: Title + Screen Selector + Close */}
      <div className="h-11 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="뒤로 가기"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{group.prefix}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-500">{group.pageName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Spec Panel Toggle */}
          <button
            onClick={toggleSpecPanel}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSpecPanelOpen
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            aria-label="기획 스펙 보기"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            스펙
          </button>

          {/* Screen Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsScreenDropdownOpen(!isScreenDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              <span className="text-xs font-medium text-slate-700">
                {isMasterView ? '전체 (MASTER)' : activeScreen?.name || '화면 선택'}
              </span>
              <svg className={`w-3 h-3 text-slate-500 transition-transform ${isScreenDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isScreenDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsScreenDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setActiveScreenId(null);
                      setIsScreenDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-all ${
                      isMasterView
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    전체 (MASTER)
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  {allScreens.map((screen) => (
                    <button
                      key={screen.figmaId}
                      onClick={() => {
                        setActiveScreenId(screen.figmaId);
                        setIsScreenDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-all ${
                        activeScreenId === screen.figmaId
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {screen.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="닫기"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="h-10 flex items-center px-4 gap-1">
        {(Object.entries(UNIFIED_TAB_CONFIG) as [UnifiedTab, { label: string; icon: string }][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === key
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {config.label}
            </button>
          )
        )}
      </div>
    </header>
  );
}
