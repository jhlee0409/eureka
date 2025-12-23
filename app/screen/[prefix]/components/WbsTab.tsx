'use client';

import React, { useMemo, useState } from 'react';
import { WbsTask, ScreenData, TestCase } from '../../../types';
import { GanttChart } from './GanttChart';
import { WbsTable } from './WbsTable';
import { WbsAddModal } from './WbsAddModal';
import { useGanttDrag } from '../hooks/useGanttDrag';

interface WbsTabProps {
  wbsTasks: WbsTask[];
  testCases: TestCase[];
  isMasterView: boolean;
  activeScreen: ScreenData | null;
  allScreens: ScreenData[];
  getScreenNameById: (figmaId: string | undefined) => string;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  deleteWbsTask: (id: string) => void;
  addWbsTask: (task: WbsTask) => void;
}

export function WbsTab({
  wbsTasks,
  testCases,
  isMasterView,
  activeScreen,
  allScreens,
  getScreenNameById,
  updateWbsTask,
  deleteWbsTask,
  addWbsTask
}: WbsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const timelineRange = useMemo(() => {
    if (wbsTasks.length === 0) return null;
    const startDates = wbsTasks.map(t => new Date(t.startDate).getTime()).filter(d => !isNaN(d));
    const endDates = wbsTasks.map(t => new Date(t.endDate).getTime()).filter(d => !isNaN(d));
    if (startDates.length === 0) return null;

    const minTime = Math.min(...startDates);
    const maxTime = Math.max(...endDates, minTime + 86400000 * 7);

    const startDate = new Date(minTime);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(maxTime);
    endDate.setDate(endDate.getDate() + 10);

    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return { days };
  }, [wbsTasks]);

  const { dragState, handleGanttMouseDown } = useGanttDrag({
    wbsTasks,
    updateWbsTask,
    isMasterView,
    timelineRange
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">기능 목록</h2>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">
            {isMasterView ? '전체 화면 통합 보기' : `${activeScreen?.name || ''} 상세 작업`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all"
        >
          + 기능 추가
        </button>
      </div>

      {/* WBS Add Modal */}
      <WbsAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addWbsTask}
        testCases={testCases}
        originScreenId={activeScreen?.figmaId || ''}
        allScreens={allScreens}
        isMasterView={isMasterView}
      />

      {wbsTasks.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold">
          업무 데이터가 없습니다.
        </div>
      ) : (
        <>
          <GanttChart
            wbsTasks={wbsTasks}
            isMasterView={isMasterView}
            dragState={dragState}
            onMouseDown={handleGanttMouseDown}
          />
          <WbsTable
            wbsTasks={wbsTasks}
            testCases={testCases}
            isMasterView={isMasterView}
            getScreenNameById={getScreenNameById}
            updateWbsTask={updateWbsTask}
            deleteWbsTask={deleteWbsTask}
          />
        </>
      )}
    </div>
  );
}
