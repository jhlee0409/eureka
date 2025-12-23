'use client';

import React from 'react';
import { ScreenData } from '../../types';
import { ScreenProvider, useScreen } from './context/ScreenContext';
import { ScreenHeader } from './components/ScreenHeader';
import { SpecPanel } from './components/SpecPanel';
import { WbsTab } from './components/WbsTab';
import { QaTab } from './components/QaTab';
import { UnifiedTab } from './config/constants';

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
    activeTab,
    activeScreen,
    allScreens,
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
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden">
      <ScreenHeader />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Main Content (기능/TC 탭) */}
        <MainContent
          activeTab={activeTab}
          activeScreen={activeScreen}
          isMasterView={isMasterView}
        />

        {/* Right: Spec Panel (항상 표시) */}
        <SpecPanel
          activeScreen={activeScreen}
          allScreensCount={allScreens.length}
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
  activeTab: UnifiedTab;
  activeScreen: ScreenData | null;
  isMasterView: boolean;
}

function MainContent({ activeTab, activeScreen, isMasterView }: MainContentProps) {
  const {
    wbsTasks,
    testCases,
    qaProgress,
    updateWbsTask,
    updateTestCase,
    addWbsTask,
    addTestCase,
    deleteWbsTask,
    deleteTestCase,
    getScreenNameById,
  } = useScreen();

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === 'wbs' && (
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
        )}
        {activeTab === 'qa' && (
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
