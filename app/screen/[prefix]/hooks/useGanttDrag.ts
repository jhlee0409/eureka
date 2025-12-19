'use client';

import { useState, useCallback, useEffect } from 'react';
import { WbsTask } from '../../../types';

interface DragState {
  taskId: string;
  mode: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  originalStart: string;
  originalEnd: string;
}

interface UseGanttDragProps {
  wbsTasks: WbsTask[];
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  isMasterView: boolean;
  timelineRange: { days: Date[] } | null;
}

interface UseGanttDragReturn {
  dragState: DragState | null;
  handleGanttMouseDown: (e: React.MouseEvent, taskId: string, mode: 'move' | 'resize-start' | 'resize-end') => void;
}

export function useGanttDrag({
  wbsTasks,
  updateWbsTask,
  isMasterView,
  timelineRange
}: UseGanttDragProps): UseGanttDragReturn {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleGanttMouseDown = useCallback((
    e: React.MouseEvent,
    taskId: string,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    if (isMasterView) return;
    e.preventDefault();
    e.stopPropagation();
    const task = wbsTasks.find(t => t.id === taskId);
    if (!task) return;

    setDragState({
      taskId,
      mode,
      startX: e.clientX,
      originalStart: task.startDate,
      originalEnd: task.endDate
    });
  }, [isMasterView, wbsTasks]);

  const handleGanttMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !timelineRange) return;

    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / 32); // 32px per day

    const task = wbsTasks.find(t => t.id === dragState.taskId);
    if (!task) return;

    const originalStart = new Date(dragState.originalStart);
    const originalEnd = new Date(dragState.originalEnd);

    let newStart = new Date(originalStart);
    let newEnd = new Date(originalEnd);

    if (dragState.mode === 'move') {
      newStart.setDate(originalStart.getDate() + daysDelta);
      newEnd.setDate(originalEnd.getDate() + daysDelta);
    } else if (dragState.mode === 'resize-start') {
      newStart.setDate(originalStart.getDate() + daysDelta);
      if (newStart >= newEnd) {
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - 1);
      }
    } else if (dragState.mode === 'resize-end') {
      newEnd.setDate(originalEnd.getDate() + daysDelta);
      if (newEnd <= newStart) {
        newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 1);
      }
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    updateWbsTask(dragState.taskId, {
      startDate: formatDate(newStart),
      endDate: formatDate(newEnd)
    });
  }, [dragState, timelineRange, wbsTasks, updateWbsTask]);

  const handleGanttMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleGanttMouseMove);
      window.addEventListener('mouseup', handleGanttMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGanttMouseMove);
        window.removeEventListener('mouseup', handleGanttMouseUp);
      };
    }
  }, [dragState, handleGanttMouseMove, handleGanttMouseUp]);

  return {
    dragState,
    handleGanttMouseDown,
  };
}
