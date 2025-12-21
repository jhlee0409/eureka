'use client';

import React from 'react';
import { ScreenData } from '../../types';
import { ScreenProvider, useScreen } from './context/ScreenContext';
import { ScreenHeader } from './components/ScreenHeader';
import { ScreenSidebar } from './components/ScreenSidebar';
import { ContentTabs } from './components/ContentTabs';
import { WbsTab } from './components/WbsTab';
import { QaTab } from './components/QaTab';
import { DeveloperView } from './components/DeveloperView';
import { QaView } from './components/QaView';

// ============================================
// Main Page Component
// ============================================
export default function ScreenDetailPage() {
  return (
    <ScreenProvider>
      <ScreenContent />
    </ScreenProvider>
  );
}

// ============================================
// Content Component (uses context)
// ============================================
function ScreenContent() {
  const {
    group,
    isLoading,
    viewMode,
    activeTab,
    activeScreen,
    isMasterView,
    handleClose,
  } = useScreen();

  // Loading State
  if (isLoading) {
    return <LoadingScreen />;
  }

  // No Data State
  if (!group) {
    return <NoDataScreen onClose={handleClose} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <ScreenHeader />

      <div className="flex-1 flex overflow-hidden bg-slate-100">
        {viewMode === 'standard' && (
          <ScreenSidebar
            activeScreen={activeScreen}
            allScreens={Object.values(group.baseIds).flat()}
            isMasterView={isMasterView}
          />
        )}

        <MainContent
          viewMode={viewMode}
          activeTab={activeTab}
          activeScreen={activeScreen}
          isMasterView={isMasterView}
        />
      </div>
    </div>
  );
}

// ============================================
// Main Content Area
// ============================================
interface MainContentProps {
  viewMode: 'standard' | 'developer' | 'qa';
  activeTab: 'wbs' | 'qa';
  activeScreen: ScreenData | null;
  isMasterView: boolean;
}

function MainContent({ viewMode, activeTab, activeScreen, isMasterView }: MainContentProps) {
  const {
    wbsTasks,
    testCases,
    qaProgress,
    currentUser,
    setCurrentUser,
    updateWbsTask,
    updateTestCase,
    addWbsTask,
    addTestCase,
    deleteWbsTask,
    deleteTestCase,
    getScreenNameById,
  } = useScreen();

  const contentClass = viewMode === 'standard' ? 'w-[65%]' : 'w-full';

  return (
    <div className={`${contentClass} flex flex-col bg-white overflow-hidden relative shadow-lg`}>
      {viewMode === 'standard' ? (
        <>
          <ContentTabs />
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
  );
}

// ============================================
// State Screens
// ============================================
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-slate-300 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium text-sm">데이터를 불러오는 중...</p>
      </div>
    </div>
  );
}

interface NoDataScreenProps {
  onClose: () => void;
}

function NoDataScreen({ onClose }: NoDataScreenProps) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-slate-300 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium text-sm">데이터를 불러오는 중...</p>
        <button
          onClick={onClose}
          className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
