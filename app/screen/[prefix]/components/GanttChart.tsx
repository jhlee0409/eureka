'use client';

import React, { useMemo } from 'react';
import { WbsTask } from '../../../types';

interface GanttChartProps {
  wbsTasks: WbsTask[];
  isMasterView: boolean;
  dragState: { taskId: string } | null;
  onMouseDown: (e: React.MouseEvent, taskId: string, mode: 'move' | 'resize-start' | 'resize-end') => void;
}

export function GanttChart({ wbsTasks, isMasterView, dragState, onMouseDown }: GanttChartProps) {
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

  if (!timelineRange) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-4">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
        <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          타임라인 차트
        </h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-36 shrink-0 px-2 py-1.5 border-r border-slate-200">
              <span className="text-[9px] font-bold text-slate-600 uppercase">작업명</span>
            </div>
            <div className="flex">
              {timelineRange.days.map((day, idx) => {
                const isToday = new Date().toDateString() === day.toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isFirstOfMonth = day.getDate() === 1;
                return (
                  <div
                    key={idx}
                    className={`w-6 shrink-0 text-center py-1 border-r border-slate-100 ${isWeekend ? 'bg-slate-100' : ''} ${isToday ? 'bg-yellow-50' : ''}`}
                  >
                    {isFirstOfMonth && (
                      <div className="text-[7px] font-bold text-slate-500">
                        {day.toLocaleDateString('ko-KR', { month: 'short' })}
                      </div>
                    )}
                    <div className={`text-[8px] font-medium ${isToday ? 'text-yellow-700 font-bold' : isWeekend ? 'text-slate-400' : 'text-slate-600'}`}>
                      {day.getDate()}
                    </div>
                    <div className={`text-[7px] ${isWeekend ? 'text-slate-400' : 'text-slate-400'}`}>
                      {['일', '월', '화', '수', '목', '금', '토'][day.getDay()]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Rows */}
          {wbsTasks.map((task, taskIdx) => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);
            const rangeStart = timelineRange.days[0];

            return (
              <div key={task.id} className={`flex border-b border-slate-100 ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="w-36 shrink-0 px-2 py-1.5 border-r border-slate-200">
                  <p className="text-[10px] font-bold text-slate-900 truncate" title={task.name}>{task.name}</p>
                  <p className="text-[9px] text-slate-500">{task.assignee}</p>
                </div>
                <div className="flex relative">
                  {timelineRange.days.map((day, dayIdx) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <div
                        key={dayIdx}
                        className={`w-6 shrink-0 h-8 border-r border-slate-100 ${isWeekend ? 'bg-slate-50' : ''} ${isToday ? 'bg-yellow-50' : ''}`}
                      />
                    );
                  })}
                  {/* Task Bar */}
                  {(() => {
                    const startOffset = Math.max(0, Math.floor((taskStart.getTime() - rangeStart.getTime()) / 86400000));
                    const duration = Math.max(1, Math.floor((taskEnd.getTime() - taskStart.getTime()) / 86400000) + 1);
                    const barColor = task.status === 'Done'
                      ? 'bg-green-500'
                      : task.status === 'In Progress'
                        ? 'bg-blue-500'
                        : 'bg-slate-400';
                    const isDragging = dragState?.taskId === task.id;
                    const isEditable = true; // 전체/개별 모두 수정 가능

                    return (
                      <div
                        className={`absolute top-1.5 h-5 ${barColor} rounded flex items-center justify-center transition-shadow group/bar ${
                          isDragging ? 'shadow-lg scale-105 z-10' : 'hover:shadow-md'
                        } ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                        style={{
                          left: `${startOffset * 24}px`,
                          width: `${Math.max(duration * 24 - 2, 22)}px`,
                        }}
                        title={`${task.name}: ${task.startDate} ~ ${task.endDate}${isEditable ? '\n드래그: 이동 | 양쪽 끝: 기간 조절' : ''}`}
                        onMouseDown={(e) => onMouseDown(e, task.id, 'move')}
                      >
                        {/* Resize handle - Start */}
                        {isEditable && (
                          <div
                            className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-white/30 rounded-l transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onMouseDown(e, task.id, 'resize-start');
                            }}
                          />
                        )}

                        <span className="text-[8px] font-bold text-white truncate px-1.5 select-none">
                          {duration > 2 ? task.name : ''}
                        </span>

                        {/* Resize handle - End */}
                        {isEditable && (
                          <div
                            className="absolute right-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-white/30 rounded-r transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onMouseDown(e, task.id, 'resize-end');
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-4">
        <span className="text-[9px] font-bold text-slate-500 uppercase">범례:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-slate-400 rounded-sm"></div>
          <span className="text-[9px] text-slate-600">대기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-blue-500 rounded-sm"></div>
          <span className="text-[9px] text-slate-600">진행중</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
          <span className="text-[9px] text-slate-600">완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-yellow-100 rounded-sm border border-yellow-300"></div>
          <span className="text-[9px] text-slate-600">오늘</span>
        </div>
      </div>
    </div>
  );
}
