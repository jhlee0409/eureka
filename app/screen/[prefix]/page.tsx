'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PrefixGroup, ScreenData } from '../../types';
import { useScreenData, TEAM_MEMBERS } from './hooks/useScreenData';
import { ScreenSidebar } from './components/ScreenSidebar';
import { WbsTab } from './components/WbsTab';
import { QaTab } from './components/QaTab';
import { DeveloperView } from './components/DeveloperView';
import { QaView } from './components/QaView';

type ViewMode = 'standard' | 'developer' | 'qa';

export default function ScreenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefix = params.prefix as string;
  const screenIdParam = searchParams.get('screen');
  const tabParam = searchParams.get('tab') as 'wbs' | 'qa' | null;
  const viewParam = searchParams.get('view') as ViewMode | null;

  const [group, setGroup] = useState<PrefixGroup | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(screenIdParam);
  const [activeTab, setActiveTab] = useState<'wbs' | 'qa'>(tabParam || 'wbs');
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam || 'standard');
  const [currentUser, setCurrentUser] = useState(TEAM_MEMBERS[0]);

  // Load group data from localStorage (stored by main page)
  useEffect(() => {
    const storedGroup = localStorage.getItem(`group_${prefix}`);
    if (storedGroup) {
      setGroup(JSON.parse(storedGroup));
    }
  }, [prefix]);

  // Update URL when screen, tab, or view changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeScreenId) params.set('screen', activeScreenId);
    if (activeTab !== 'wbs') params.set('tab', activeTab);
    if (viewMode !== 'standard') params.set('view', viewMode);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';
    window.history.replaceState(null, '', `/screen/${prefix}${newUrl}`);
  }, [activeScreenId, activeTab, viewMode, prefix]);

  const allScreens = useMemo(() => {
    if (!group) return [];
    return Object.values(group.baseIds).flat();
  }, [group]);

  const activeScreen = useMemo(() => {
    if (activeScreenId === null) return null;
    return allScreens.find(s => s.figmaId === activeScreenId) || null;
  }, [activeScreenId, allScreens]);

  const {
    wbsTasks,
    testCases,
    isMasterView,
    qaProgress,
    updateWbsTask,
    updateTestCase,
    addWbsTask,
    addTestCase,
    deleteWbsTask,
    deleteTestCase,
    getScreenNameById
  } = useScreenData({ allScreens, activeScreenId });

  const handleClose = () => {
    router.push('/');
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">데이터를 불러오는 중...</p>
          <button
            onClick={handleClose}
            className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Header */}
      <header className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
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

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-3xl">
          <button
            onClick={() => setActiveScreenId(null)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
              activeScreenId === null ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MASTER
          </button>
          <div className="w-px h-3 bg-slate-300"></div>
          {allScreens.map((screen) => (
            <button
              key={screen.figmaId}
              onClick={() => setActiveScreenId(screen.figmaId)}
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

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                viewMode === 'standard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              화면
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                viewMode === 'developer' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              담당자
            </button>
            <button
              onClick={() => setViewMode('qa')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                viewMode === 'qa' ? 'bg-purple-500 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              QA
            </button>
          </div>

          <button onClick={handleClose} className="text-[10px] font-bold text-slate-400 hover:text-red-500 px-2 transition-colors">
            닫기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-slate-100">
        {viewMode === 'standard' && (
          <ScreenSidebar
            activeScreen={activeScreen}
            allScreens={allScreens}
            isMasterView={isMasterView}
          />
        )}

        <div className={`${viewMode === 'standard' ? 'w-[65%]' : 'w-full'} flex flex-col bg-white overflow-hidden relative shadow-lg`}>
          {viewMode === 'standard' ? (
            <>
              <nav className="h-10 border-b border-slate-200 flex items-center px-6 gap-6 shrink-0 bg-white">
                <button
                  onClick={() => setActiveTab('wbs')}
                  className={`h-full text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all ${
                    activeTab === 'wbs' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  기획/개발 (WBS)
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`h-full text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all ${
                    activeTab === 'qa' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  품질관리 (TC) ({testCases.length})
                </button>
              </nav>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
                {activeTab === 'wbs' ? (
                  <WbsTab
                    wbsTasks={wbsTasks}
                    testCases={testCases}
                    isMasterView={isMasterView}
                    activeScreen={activeScreen}
                    getScreenNameById={getScreenNameById}
                    updateWbsTask={updateWbsTask}
                    deleteWbsTask={deleteWbsTask}
                    addWbsTask={addWbsTask}
                  />
                ) : (
                  <QaTab
                    testCases={testCases}
                    wbsTasks={wbsTasks}
                    isMasterView={isMasterView}
                    qaProgress={qaProgress}
                    getScreenNameById={getScreenNameById}
                    updateTestCase={updateTestCase}
                    deleteTestCase={deleteTestCase}
                    addTestCase={addTestCase}
                    originScreenId={activeScreen?.figmaId || ''}
                  />
                )}
              </div>
            </>
          ) : viewMode === 'developer' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
              <DeveloperView
                wbsTasks={wbsTasks}
                testCases={testCases}
                currentUser={currentUser}
                onUserChange={setCurrentUser}
                updateWbsTask={updateWbsTask}
                updateTestCase={updateTestCase}
                isMasterView={isMasterView}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50">
              <QaView
                testCases={testCases}
                addTestCase={addTestCase}
                updateTestCase={updateTestCase}
                deleteTestCase={deleteTestCase}
                isMasterView={isMasterView}
                getScreenNameById={getScreenNameById}
                originScreenId={activeScreen?.figmaId || ''}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
