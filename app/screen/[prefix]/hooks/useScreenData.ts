'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ScreenData, WbsTask, TestCase, WbsStatus, QAStatus, QAProgress } from '../../../types';

interface UseScreenDataProps {
  allScreens: ScreenData[];
  activeScreenId: string | null;
}

interface UseScreenDataReturn {
  wbsTasks: WbsTask[];
  testCases: TestCase[];
  isMasterView: boolean;
  qaProgress: number;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  addWbsTask: (task: WbsTask) => void;
  addTestCase: (tc: TestCase) => void;
  deleteWbsTask: (id: string) => void;
  deleteTestCase: (id: string) => void;
  getScreenNameById: (figmaId: string | undefined) => string;
}

export const TEAM_MEMBERS = ['테스', '잭', '멜러리', '이리나', '미쉘', '션', '키요'];

export function useScreenData({ allScreens, activeScreenId }: UseScreenDataProps): UseScreenDataReturn {
  const [wbsTasks, setWbsTasks] = useState<WbsTask[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const isMasterView = activeScreenId === null;

  const activeScreensForData = useMemo(() => {
    if (activeScreenId === null) {
      return allScreens;
    }
    const screen = allScreens.find(s => s.figmaId === activeScreenId);
    return screen ? [screen] : [];
  }, [activeScreenId, allScreens]);

  const getScreenNameById = useCallback((figmaId: string | undefined): string => {
    if (!figmaId) return '-';
    const screen = allScreens.find(s => s.figmaId === figmaId);
    return screen?.name || figmaId;
  }, [allScreens]);

  // Load data from localStorage
  useEffect(() => {
    let aggregatedWbs: WbsTask[] = [];
    let aggregatedQa: TestCase[] = [];

    activeScreensForData.forEach(s => {
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
    });

    setWbsTasks(aggregatedWbs);
    setTestCases(aggregatedQa);
  }, [activeScreenId, activeScreensForData]);

  const saveToStorage = useCallback((tasks: WbsTask[], cases: TestCase[]) => {
    activeScreensForData.forEach(s => {
      const screenTasks = tasks.filter(t => t.originScreenId === s.figmaId || (!t.originScreenId && s === activeScreensForData[0]));
      const screenCases = cases.filter(c => c.originScreenId === s.figmaId || (!c.originScreenId && s === activeScreensForData[0]));
      localStorage.setItem(`wbs_${s.figmaId}`, JSON.stringify(screenTasks));
      localStorage.setItem(`qa_${s.figmaId}`, JSON.stringify(screenCases));
    });
  }, [activeScreensForData]);

  const updateWbsTask = useCallback((id: string, updates: Partial<WbsTask>) => {
    setWbsTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveToStorage(next, testCases);
      return next;
    });
  }, [testCases, saveToStorage]);

  const updateTestCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveToStorage(wbsTasks, next);
      return next;
    });
  }, [wbsTasks, saveToStorage]);

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

  const deleteWbsTask = useCallback((id: string) => {
    setWbsTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(next, testCases);
      return next;
    });
  }, [testCases, saveToStorage]);

  const deleteTestCase = useCallback((id: string) => {
    setTestCases(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(wbsTasks, next);
      return next;
    });
  }, [wbsTasks, saveToStorage]);

  const qaProgress = useMemo(() => {
    if (testCases.length === 0) return 0;
    const done = testCases.filter(t => t.status === 'ProdDone' || t.status === 'DevDone').length;
    return Math.round((done / testCases.length) * 100);
  }, [testCases]);

  return {
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
    getScreenNameById,
  };
}
