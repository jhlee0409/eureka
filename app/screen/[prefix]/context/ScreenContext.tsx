'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PrefixGroup, ScreenData, WbsTask, TestCase } from '../../../types';
import { UnifiedTab, isValidUnifiedTab, TEAM_MEMBERS } from '../config/constants';

// ============================================
// Types
// ============================================
interface ScreenContextValue {
  // Group & Screen Data
  group: PrefixGroup | null;
  allScreens: ScreenData[];
  activeScreen: ScreenData | null;
  activeScreenId: string | null;
  setActiveScreenId: (id: string | null) => void;
  isMasterView: boolean;

  // Navigation (Unified Tab)
  activeTab: UnifiedTab;
  setActiveTab: (tab: UnifiedTab) => void;

  // Spec Panel
  isSpecPanelOpen: boolean;
  toggleSpecPanel: () => void;

  // User
  currentUser: string;
  setCurrentUser: (user: string) => void;

  // WBS Data
  wbsTasks: WbsTask[];
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  addWbsTask: (task: WbsTask) => void;
  deleteWbsTask: (id: string) => void;

  // TC Data
  testCases: TestCase[];
  qaProgress: number;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  addTestCase: (tc: TestCase) => void;
  deleteTestCase: (id: string) => void;

  // Utilities
  getScreenNameById: (figmaId: string | undefined) => string;
  handleClose: () => void;

  // Loading State
  isLoading: boolean;
}

const ScreenContext = createContext<ScreenContextValue | null>(null);

// ============================================
// Provider
// ============================================
interface ScreenProviderProps {
  children: ReactNode;
}

export function ScreenProvider({ children }: ScreenProviderProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefix = params.prefix as string;
  const screenIdParam = searchParams.get('screen');
  const tabParam = searchParams.get('tab');

  // Core State
  const [group, setGroup] = useState<PrefixGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(screenIdParam);
  const [activeTab, setActiveTab] = useState<UnifiedTab>(isValidUnifiedTab(tabParam) ? tabParam : 'wbs');
  const [currentUser, setCurrentUser] = useState<string>(TEAM_MEMBERS[0]);
  const [isSpecPanelOpen, setIsSpecPanelOpen] = useState(false);

  const toggleSpecPanel = useCallback(() => {
    setIsSpecPanelOpen(prev => !prev);
  }, []);

  // Data State
  const [wbsTasks, setWbsTasks] = useState<WbsTask[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const isMasterView = activeScreenId === null;

  // Derived Data
  const allScreens = useMemo(() => {
    if (!group) return [];
    return Object.values(group.baseIds).flat();
  }, [group]);

  const activeScreen = useMemo(() => {
    if (activeScreenId === null) return null;
    return allScreens.find(s => s.figmaId === activeScreenId) || null;
  }, [activeScreenId, allScreens]);

  const activeScreensForData = useMemo(() => {
    if (activeScreenId === null) return allScreens;
    const screen = allScreens.find(s => s.figmaId === activeScreenId);
    return screen ? [screen] : [];
  }, [activeScreenId, allScreens]);

  // Load Group Data
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedGroup = localStorage.getItem(`group_${prefix}`);
      if (storedGroup) {
        setGroup(JSON.parse(storedGroup));
      }
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [prefix]);

  // Load WBS & TC Data
  useEffect(() => {
    if (activeScreensForData.length === 0) return;

    let aggregatedWbs: WbsTask[] = [];
    let aggregatedQa: TestCase[] = [];

    activeScreensForData.forEach(s => {
      try {
        const savedWbs = localStorage.getItem(`wbs_${s.figmaId}`);
        const savedQa = localStorage.getItem(`qa_${s.figmaId}`);

        if (savedWbs) {
          const tasks = JSON.parse(savedWbs).map((t: WbsTask) => ({ ...t, originScreenId: s.figmaId }));
          aggregatedWbs = [...aggregatedWbs, ...tasks];
        }
        if (savedQa) {
          const cases = JSON.parse(savedQa).map((c: TestCase) => ({ ...c, originScreenId: s.figmaId }));
          aggregatedQa = [...aggregatedQa, ...cases];
        }
      } catch (error) {
        console.error(`Failed to load data for screen ${s.figmaId}:`, error);
      }
    });

    setWbsTasks(aggregatedWbs);
    setTestCases(aggregatedQa);
  }, [activeScreensForData]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeScreenId) params.set('screen', activeScreenId);
    if (activeTab !== 'wbs') params.set('tab', activeTab);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';
    window.history.replaceState(null, '', `/screen/${prefix}${newUrl}`);
  }, [activeScreenId, activeTab, prefix]);

  // Storage Helper
  const saveToStorage = useCallback((tasks: WbsTask[], cases: TestCase[]) => {
    activeScreensForData.forEach(s => {
      const screenTasks = tasks.filter(t => t.originScreenId === s.figmaId || (!t.originScreenId && s === activeScreensForData[0]));
      const screenCases = cases.filter(c => c.originScreenId === s.figmaId || (!c.originScreenId && s === activeScreensForData[0]));
      localStorage.setItem(`wbs_${s.figmaId}`, JSON.stringify(screenTasks));
      localStorage.setItem(`qa_${s.figmaId}`, JSON.stringify(screenCases));
    });
  }, [activeScreensForData]);

  // WBS Operations
  const updateWbsTask = useCallback((id: string, updates: Partial<WbsTask>) => {
    setWbsTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveToStorage(next, testCases);
      return next;
    });
  }, [testCases, saveToStorage]);

  const addWbsTask = useCallback((task: WbsTask) => {
    const taskWithScreen = {
      ...task,
      originScreenId: task.originScreenId || activeScreensForData[0]?.figmaId || ''
    };
    setWbsTasks(prev => {
      const next = [...prev, taskWithScreen];
      saveToStorage(next, testCases);
      return next;
    });
  }, [activeScreensForData, testCases, saveToStorage]);

  const deleteWbsTask = useCallback((id: string) => {
    setWbsTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(next, testCases);
      return next;
    });
  }, [testCases, saveToStorage]);

  // TC Operations
  const updateTestCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveToStorage(wbsTasks, next);
      return next;
    });
  }, [wbsTasks, saveToStorage]);

  const addTestCase = useCallback((tc: TestCase) => {
    const tcWithScreen = {
      ...tc,
      originScreenId: tc.originScreenId || activeScreensForData[0]?.figmaId || ''
    };
    setTestCases(prev => {
      const next = [...prev, tcWithScreen];
      saveToStorage(wbsTasks, next);
      return next;
    });
  }, [activeScreensForData, wbsTasks, saveToStorage]);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(wbsTasks, next);
      return next;
    });
  }, [wbsTasks, saveToStorage]);

  // Utilities
  const getScreenNameById = useCallback((figmaId: string | undefined): string => {
    if (!figmaId) return '-';
    const screen = allScreens.find(s => s.figmaId === figmaId);
    return screen?.name || figmaId;
  }, [allScreens]);

  const handleClose = useCallback(() => {
    router.push('/');
  }, [router]);

  const qaProgress = useMemo(() => {
    if (testCases.length === 0) return 0;
    const done = testCases.filter(t => t.status === 'ProdDone' || t.status === 'DevDone').length;
    return Math.round((done / testCases.length) * 100);
  }, [testCases]);

  const value: ScreenContextValue = {
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
    currentUser,
    setCurrentUser,
    wbsTasks,
    updateWbsTask,
    addWbsTask,
    deleteWbsTask,
    testCases,
    qaProgress,
    updateTestCase,
    addTestCase,
    deleteTestCase,
    getScreenNameById,
    handleClose,
    isLoading,
  };

  return (
    <ScreenContext.Provider value={value}>
      {children}
    </ScreenContext.Provider>
  );
}

// ============================================
// Hook
// ============================================
export function useScreen() {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within a ScreenProvider');
  }
  return context;
}
