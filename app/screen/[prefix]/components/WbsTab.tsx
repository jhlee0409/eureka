'use client';

import React, { useMemo } from 'react';
import { WbsTask, ScreenData } from '../../../types';
import { GanttChart } from './GanttChart';
import { WbsTable } from './WbsTable';
import { useGanttDrag } from '../hooks/useGanttDrag';

interface WbsTabProps {
  wbsTasks: WbsTask[];
  isMasterView: boolean;
  activeScreen: ScreenData | null;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  deleteWbsTask: (id: string) => void;
  addWbsTask: () => void;
}

export function WbsTab({
  wbsTasks,
  isMasterView,
  activeScreen,
  getScreenNameById,
  updateWbsTask,
  deleteWbsTask,
  addWbsTask
}: WbsTabProps) {
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
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">작업 로드맵</h2>
          <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">
            {isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : `${activeScreen?.name || ''} 상세 작업`}
          </p>
        </div>
        {!isMasterView && (
          <button
            onClick={addWbsTask}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
          >
            + 업무 추가
          </button>
        )}
      </div>

      {wbsTasks.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-slate-300 rounded-[3rem] bg-slate-50 text-slate-500 font-black uppercase tracking-widest">
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
