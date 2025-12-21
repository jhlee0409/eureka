'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PrefixGroup, ScreenData, WbsTask, TestCase, WbsStatus, QAStatus, QAProgress, QAPriority, QAPosition, Comment } from '../types';
import { CoverThumbnail } from './CoverThumbnail';
import { StatusSelect, UserSelect } from './ui';

const WBS_STATUS_OPTIONS = ['Planning', 'In Progress', 'Done'] as const;
const QA_STATUS_OPTIONS = ['Reviewing', 'DevError', 'ProdError', 'DevDone', 'ProdDone', 'Hold'] as const;
const QA_PROGRESS_OPTIONS = ['Waiting', 'Checking', 'Working', 'DevDeployed', 'ProdDeployed'] as const;
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const POSITION_OPTIONS = ['Front-end', 'Back-end', 'Design', 'PM'] as const;

interface DetailModalProps {
  group: PrefixGroup;
  onClose: () => void;
}

const TEAM_MEMBERS = ['테스', '잭', '멜러리', '이리나', '미쉘', '션', '키요'];

const DetailModal: React.FC<DetailModalProps> = ({ group, onClose }) => {
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wbs' | 'qa'>('wbs');

  const [wbsTasks, setWbsTasks] = useState<WbsTask[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [editingQAId, setEditingQAId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedCommentUser, setSelectedCommentUser] = useState(TEAM_MEMBERS[0]);

  // Gantt chart drag state
  const [dragState, setDragState] = useState<{
    taskId: string;
    mode: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Flatten all screens from all baseIds
  const allScreens = useMemo(() => {
    return Object.values(group.baseIds).flat();
  }, [group]);

  // Check if we're in 종합 (master) view mode
  const isMasterView = activeScreenId === null;

  // Helper to get screen name by figmaId
  const getScreenNameById = (figmaId: string | undefined): string => {
    if (!figmaId) return '-';
    const screen = allScreens.find(s => s.figmaId === figmaId);
    return screen?.name || figmaId;
  };

  // Find active screen or get all screens for 종합
  const activeScreen = useMemo(() => {
    if (activeScreenId === null) return null;
    return allScreens.find(s => s.figmaId === activeScreenId) || null;
  }, [activeScreenId, allScreens]);

  // Get screens for WBS/QA data loading
  const activeScreensForData = useMemo(() => {
    if (activeScreenId === null) {
      // 종합: all screens
      return allScreens;
    } else {
      // Specific screen: single screen
      return activeScreen ? [activeScreen] : [];
    }
  }, [activeScreenId, activeScreen, allScreens]);

  const getKeys = (screenId: string) => ({
    wbs: `wbs_${screenId}`,
    qa: `qa_${screenId}`
  });

  useEffect(() => {
    // Load WBS/QA data for active screen(s)
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
    setEditingQAId(null);
  }, [activeScreenId, activeScreensForData]);

  const saveToStorage = (tasks: WbsTask[], cases: TestCase[]) => {
    // Partition by originScreenId
    activeScreensForData.forEach(s => {
      const screenTasks = tasks.filter(t => t.originScreenId === s.figmaId || (!t.originScreenId && s === activeScreensForData[0]));
      const screenCases = cases.filter(c => c.originScreenId === s.figmaId || (!c.originScreenId && s === activeScreensForData[0]));
      const { wbs, qa } = getKeys(s.figmaId);
      localStorage.setItem(wbs, JSON.stringify(screenTasks));
      localStorage.setItem(qa, JSON.stringify(screenCases));
    });
  };

  const updateWbsTask = (id: string, updates: Partial<WbsTask>) => {
    const next = wbsTasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setWbsTasks(next);
    saveToStorage(next, testCases);
  };

  const updateTestCase = (id: string, updates: Partial<TestCase>) => {
    const next = testCases.map(t => t.id === id ? { ...t, ...updates } : t);
    setTestCases(next);
    saveToStorage(wbsTasks, next);
  };

  const qaProgress = useMemo(() => {
    if (testCases.length === 0) return 0;
    const done = testCases.filter(t => t.status === 'ProdDone' || t.status === 'DevDone').length;
    return Math.round((done / testCases.length) * 100);
  }, [testCases]);

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

  const addWbsTask = () => {
    const today = new Date().toISOString().split('T')[0];
    const newTask: WbsTask = {
      id: crypto.randomUUID(),
      name: '신규 작업 항목',
      detail: '',
      status: 'Planning',
      assignee: TEAM_MEMBERS[0],
      startDate: today,
      endDate: today,
      originScreenId: activeScreensForData[0]?.figmaId || ''
    };
    const next = [...wbsTasks, newTask];
    setWbsTasks(next);
    saveToStorage(next, testCases);
  };

  const addTestCase = () => {
    const newTC: TestCase = {
      id: crypto.randomUUID(),
      checkpoint: '',
      scenario: '이슈 발생 확인 필요',
      issueContent: '',
      referenceLink: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Reviewing',
      reporter: TEAM_MEMBERS[0],
      priority: 'Medium',
      position: 'Front-end',
      assignee: TEAM_MEMBERS[1],
      progress: 'Waiting',
      comments: [],
      originScreenId: activeScreensForData[0]?.figmaId || ''
    };
    const next = [...testCases, newTC];
    setTestCases(next);
    saveToStorage(wbsTasks, next);
    setEditingQAId(newTC.id);
  };

  const handleAddComment = () => {
    if (!editingQAId || !newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: newComment,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false })
    };
    const tc = testCases.find(t => t.id === editingQAId);
    if (tc) {
      updateTestCase(editingQAId, { comments: [...tc.comments, comment] });
      setNewComment('');
    }
  };

  // Gantt chart drag handlers
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

  // Add/remove global mouse event listeners for dragging
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

  const editingQA = useMemo(() => testCases.find(t => t.id === editingQAId), [testCases, editingQAId]);

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300 text-slate-900 border-none outline-none">
      <header className="h-16 border-b border-slate-300 flex items-center justify-between px-8 bg-white shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm">
            <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {group.prefix} {activeScreenId === null ? <span className="text-yellow-600 ml-2">종합 관리 (MASTER)</span> : <span className="text-slate-400 ml-2">/ {activeScreen?.name || ''}</span>}
            </h1>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none mt-1">{group.pageName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-200 p-1.5 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto max-w-4xl">
          <button
            onClick={() => setActiveScreenId(null)}
            className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${activeScreenId === null ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}
          >
            종합 (MASTER)
          </button>
          <div className="w-px h-4 bg-slate-400 mx-1"></div>
          {allScreens.map((screen) => (
            <button
              key={screen.figmaId}
              onClick={() => setActiveScreenId(screen.figmaId)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap ${activeScreenId === screen.figmaId ? 'bg-white text-slate-900 shadow-md border border-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {screen.name}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="text-xs font-black text-slate-500 hover:text-red-600 uppercase tracking-widest px-4 transition-colors">닫기</button>
      </header>

      <div className="flex-1 flex overflow-hidden bg-slate-100">
        <div className="w-[35%] flex flex-col border-r border-slate-300 overflow-hidden bg-slate-200">
          <div className="flex-1 overflow-auto p-10 flex items-start justify-center custom-scrollbar">
            {(activeScreen?.coverData) ? (
              <CoverThumbnail coverData={activeScreen.coverData} className="shadow-2xl" />
            ) : (activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl) ? (
              <img src={activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl} className="max-w-full h-auto shadow-2xl rounded-2xl border border-white" alt="디자인" />
            ) : (
              <div className="w-full aspect-video bg-white flex items-center justify-center text-slate-400 font-black uppercase rounded-2xl border border-slate-300">미리보기 없음</div>
            )}
          </div>

          <div className="p-8 bg-white border-t border-slate-300 max-h-[60%] overflow-y-auto custom-scrollbar">
             <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                기획 및 스펙 내용
             </h3>

             {activeScreenId === null ? (
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                 <p className="text-sm text-slate-600 leading-relaxed font-bold">
                   종합 관리 모드입니다. 특정 화면을 선택하면 상세 정보를 확인할 수 있습니다.
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-300">
                   <p className="text-xs text-slate-500 font-bold">
                     총 {allScreens.length}개의 화면이 이 섹션에 포함되어 있습니다.
                   </p>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 {/* Screen Information */}
                 {activeScreen?.screenInformation && (
                   <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                     <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Screen Information</h4>
                     <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-bold">
                       {activeScreen.screenInformation}
                     </p>
                   </div>
                 )}

                 {/* Single Screen Description */}
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                   <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-4">Description</h4>
                   {activeScreen?.description ? (
                     <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-bold">
                       {activeScreen.description}
                     </p>
                   ) : (
                     <p className="text-sm text-slate-500 leading-relaxed font-bold italic">
                       기획/스펙 내용이 없습니다.
                     </p>
                   )}
                 </div>

                 {/* Screen Metadata */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200">
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <span className="text-slate-500 font-bold uppercase block mb-1">화면 이름</span>
                       <span className="text-slate-900 font-black">{activeScreen?.name}</span>
                     </div>
                     <div>
                       <span className="text-slate-500 font-bold uppercase block mb-1">Base ID</span>
                       <span className="text-slate-900 font-black">{activeScreen?.baseId}</span>
                     </div>
                     {activeScreen?.suffix && (
                       <div>
                         <span className="text-slate-500 font-bold uppercase block mb-1">Suffix</span>
                         <span className="text-slate-900 font-black">{activeScreen.suffix}</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="w-[65%] flex flex-col bg-white overflow-hidden relative shadow-2xl">
          <nav className="h-14 border-b border-slate-200 flex items-center px-10 gap-10 shrink-0 bg-white">
            <button onClick={() => setActiveTab('wbs')} className={`h-full text-[11px] font-black uppercase tracking-[0.15em] border-b-4 transition-all ${activeTab === 'wbs' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>기획/개발 (WBS)</button>
            <button onClick={() => setActiveTab('qa')} className={`h-full text-[11px] font-black uppercase tracking-[0.15em] border-b-4 transition-all ${activeTab === 'qa' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>품질관리 (TC) ({testCases.length})</button>
          </nav>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-white">
            {activeTab === 'wbs' ? (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">작업 로드맵</h2>
                    <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">{isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : `${activeScreen?.name || ''} 상세 작업`}</p>
                  </div>
                  {!isMasterView && (
                    <button onClick={addWbsTask} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ 업무 추가</button>
                  )}
                </div>

                {/* WBS Timeline and Table - reuse existing logic */}
                {wbsTasks.length === 0 ? (
                  <div className="p-20 text-center border-2 border-dashed border-slate-300 rounded-[3rem] bg-slate-50 text-slate-500 font-black uppercase tracking-widest">업무 데이터가 없습니다.</div>
                ) : (
                  <>
                  {/* Gantt Chart Timeline */}
                  {timelineRange && (
                    <div className="bg-white border border-slate-300 rounded-[2.5rem] overflow-hidden shadow-sm mb-8">
                      <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                          타임라인 차트
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="min-w-max">
                          {/* Timeline Header */}
                          <div className="flex border-b border-slate-200 bg-slate-100">
                            <div className="w-48 shrink-0 px-4 py-3 border-r border-slate-200">
                              <span className="text-[10px] font-black text-slate-600 uppercase">작업명</span>
                            </div>
                            <div className="flex">
                              {timelineRange.days.map((day, idx) => {
                                const isToday = new Date().toDateString() === day.toDateString();
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const isFirstOfMonth = day.getDate() === 1;
                                return (
                                  <div
                                    key={idx}
                                    className={`w-8 shrink-0 text-center py-2 border-r border-slate-200 ${isWeekend ? 'bg-slate-200' : ''} ${isToday ? 'bg-yellow-100' : ''}`}
                                  >
                                    {isFirstOfMonth && (
                                      <div className="text-[8px] font-black text-slate-500 uppercase">
                                        {day.toLocaleDateString('ko-KR', { month: 'short' })}
                                      </div>
                                    )}
                                    <div className={`text-[10px] font-bold ${isToday ? 'text-yellow-700 font-black' : isWeekend ? 'text-slate-400' : 'text-slate-600'}`}>
                                      {day.getDate()}
                                    </div>
                                    <div className={`text-[8px] ${isWeekend ? 'text-slate-400' : 'text-slate-400'}`}>
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
                                <div className="w-48 shrink-0 px-4 py-3 border-r border-slate-200">
                                  <p className="text-xs font-black text-slate-900 truncate" title={task.name}>{task.name}</p>
                                  <p className="text-[10px] text-slate-500 font-bold">{task.assignee}</p>
                                </div>
                                <div className="flex relative">
                                  {timelineRange.days.map((day, dayIdx) => {
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    const isToday = new Date().toDateString() === day.toDateString();
                                    return (
                                      <div
                                        key={dayIdx}
                                        className={`w-8 shrink-0 h-12 border-r border-slate-100 ${isWeekend ? 'bg-slate-100' : ''} ${isToday ? 'bg-yellow-50' : ''}`}
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
                                    const isEditable = !isMasterView;

                                    return (
                                      <div
                                        className={`absolute top-3 h-6 ${barColor} rounded-lg shadow-md flex items-center justify-center transition-shadow group/bar ${
                                          isDragging ? 'shadow-xl scale-105 z-10' : 'hover:shadow-lg'
                                        } ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                        style={{
                                          left: `${startOffset * 32}px`,
                                          width: `${Math.max(duration * 32 - 4, 28)}px`,
                                        }}
                                        title={`${task.name}: ${task.startDate} ~ ${task.endDate}${isEditable ? '\n드래그: 이동 | 양쪽 끝: 기간 조절' : ''}`}
                                        onMouseDown={(e) => handleGanttMouseDown(e, task.id, 'move')}
                                      >
                                        {/* Resize handle - Start */}
                                        {isEditable && (
                                          <div
                                            className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/30 rounded-l-lg transition-colors"
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                              handleGanttMouseDown(e, task.id, 'resize-start');
                                            }}
                                          />
                                        )}

                                        <span className="text-[9px] font-black text-white truncate px-3 select-none">
                                          {duration > 2 ? task.name : ''}
                                        </span>

                                        {/* Resize handle - End */}
                                        {isEditable && (
                                          <div
                                            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/30 rounded-r-lg transition-colors"
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                              handleGanttMouseDown(e, task.id, 'resize-end');
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
                      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center gap-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase">범례:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-3 bg-slate-400 rounded"></div>
                          <span className="text-[10px] font-bold text-slate-600">대기</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-3 bg-blue-500 rounded"></div>
                          <span className="text-[10px] font-bold text-slate-600">진행중</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-3 bg-green-500 rounded"></div>
                          <span className="text-[10px] font-bold text-slate-600">완료</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="w-4 h-3 bg-yellow-100 rounded border border-yellow-300"></div>
                          <span className="text-[10px] font-bold text-slate-600">오늘</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-slate-300 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300">
                        <tr>
                          {isMasterView && <th className="px-6 py-5">화면명</th>}
                          <th className="px-8 py-5">상세 업무명</th>
                          <th className="px-8 py-5">담당자</th>
                          <th className="px-8 py-5">일정 (시작/종료)</th>
                          <th className="px-8 py-5">상태</th>
                          {!isMasterView && <th className="px-8 py-5"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {wbsTasks.map(task => (
                          <tr key={task.id} className="group hover:bg-slate-50">
                            {isMasterView && (
                              <td className="px-6 py-5">
                                <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide">
                                  {getScreenNameById(task.originScreenId)}
                                </span>
                              </td>
                            )}
                            <td className="px-8 py-5">
                              {isMasterView ? (
                                <>
                                  <p className="font-black text-slate-900 text-sm">{task.name}</p>
                                  {task.detail && <p className="text-[11px] font-bold text-slate-500 mt-1">{task.detail}</p>}
                                </>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    value={task.name}
                                    onChange={e => updateWbsTask(task.id, {name: e.target.value})}
                                    className="w-full bg-transparent font-black text-slate-900 text-sm outline-none focus:text-slate-900 border-b border-transparent focus:border-slate-300"
                                  />
                                  <input
                                    type="text"
                                    value={task.detail}
                                    onChange={e => updateWbsTask(task.id, {detail: e.target.value})}
                                    placeholder="상세 기술 내용..."
                                    className="w-full bg-transparent text-[11px] font-bold text-slate-500 mt-1 outline-none"
                                  />
                                </>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              {isMasterView ? (
                                <span className="font-black text-slate-900 text-xs">{task.assignee}</span>
                              ) : (
                                <UserSelect
                                  value={task.assignee}
                                  onChange={(v) => updateWbsTask(task.id, {assignee: v})}
                                  options={TEAM_MEMBERS}
                                  size="xs"
                                />
                              )}
                            </td>
                            <td className="px-8 py-5">
                              {isMasterView ? (
                                <div className="flex flex-col gap-1 text-xs font-black text-slate-900">
                                  <span>{task.startDate}</span>
                                  <span className="text-slate-400">~ {task.endDate}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <input
                                    type="date"
                                    value={task.startDate}
                                    onChange={e => updateWbsTask(task.id, {startDate: e.target.value})}
                                    className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-black text-slate-900 text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                                  />
                                  <input
                                    type="date"
                                    value={task.endDate}
                                    onChange={e => updateWbsTask(task.id, {endDate: e.target.value})}
                                    className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-black text-slate-900 text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              {isMasterView ? (
                                <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${
                                  task.status === 'Done' ? 'bg-green-100 text-green-800' :
                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {task.status === 'Planning' ? '대기' : task.status === 'In Progress' ? '진행중' : '완료'}
                                </span>
                              ) : (
                                <StatusSelect
                                  value={task.status}
                                  onChange={(v) => updateWbsTask(task.id, {status: v as WbsStatus})}
                                  options={WBS_STATUS_OPTIONS}
                                  size="xs"
                                  variant="badge"
                                />
                              )}
                            </td>
                            {!isMasterView && (
                              <td className="px-8 py-5 text-right">
                                 <button onClick={() => {
                                   const next = wbsTasks.filter(t => t.id !== task.id);
                                   setWbsTasks(next);
                                   saveToStorage(next, testCases);
                                 }} className="text-slate-300 hover:text-red-600 text-2xl font-black transition-colors">×</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">품질 관리 보드</h2>
                    <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">{isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : ''}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-300">
                        <div className="h-full bg-green-600 transition-all duration-700" style={{ width: `${qaProgress}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">{qaProgress}% 해결됨</span>
                    </div>
                  </div>
                  {!isMasterView && (
                    <button onClick={addTestCase} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ 이슈 등록</button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {testCases.map(tc => (
                    <div
                      key={tc.id}
                      onClick={() => !isMasterView && setEditingQAId(tc.id)}
                      className={`p-8 rounded-[2.5rem] border-4 transition-all flex items-center justify-between group bg-white ${
                        isMasterView
                          ? 'border-slate-200 cursor-default'
                          : `cursor-pointer ${editingQAId === tc.id ? 'border-slate-900 shadow-2xl' : 'border-slate-200 hover:border-slate-300'}`
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        {/* Checkpoint */}
                        <div className="w-24 shrink-0 text-center">
                          {tc.checkpoint ? (
                            <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl text-[10px] font-black">
                              {tc.checkpoint}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold">-</span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full shadow-md shrink-0 ${tc.priority === 'High' ? 'bg-red-600' : tc.priority === 'Medium' ? 'bg-orange-600' : 'bg-green-600'}`}></div>
                        <div>
                          {isMasterView && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide mb-2">
                              {getScreenNameById(tc.originScreenId)}
                            </span>
                          )}
                          <p className={`text-lg font-black text-slate-900 tracking-tight leading-none mb-3 ${!isMasterView ? 'group-hover:text-yellow-600' : ''} transition-colors`}>{tc.scenario}</p>
                          <div className="flex items-center gap-5 text-[11px] font-black text-slate-600 uppercase tracking-tight">
                            <span className="bg-slate-100 px-3 py-1 rounded-xl">{tc.position}</span>
                            <span>{tc.assignee}</span>
                            <span className="text-slate-400">{tc.date}</span>
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                              {tc.comments.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* 상태 배지 */}
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide ${
                          tc.status === 'DevDone' || tc.status === 'ProdDone' ? 'bg-green-100 text-green-800' :
                          tc.status === 'DevError' || tc.status === 'ProdError' ? 'bg-red-100 text-red-800' :
                          tc.status === 'Hold' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tc.status === 'Reviewing' ? '검토중' :
                           tc.status === 'DevError' ? 'Dev 오류' :
                           tc.status === 'ProdError' ? 'Prod 오류' :
                           tc.status === 'DevDone' ? 'Dev 완료' :
                           tc.status === 'ProdDone' ? 'Prod 완료' :
                           tc.status === 'Hold' ? '보류' : tc.status}
                        </span>
                        {/* 진행도 배지 */}
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide ${
                          tc.progress === 'ProdDeployed' ? 'bg-emerald-100 text-emerald-800' :
                          tc.progress === 'DevDeployed' ? 'bg-blue-100 text-blue-800' :
                          tc.progress === 'Working' ? 'bg-purple-100 text-purple-800' :
                          tc.progress === 'Checking' ? 'bg-cyan-100 text-cyan-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {tc.progress === 'Waiting' ? '대기' :
                           tc.progress === 'Checking' ? '확인' :
                           tc.progress === 'Working' ? '작업 중' :
                           tc.progress === 'DevDeployed' ? 'Dev 배포' :
                           tc.progress === 'ProdDeployed' ? 'Prod 배포' : tc.progress}
                        </span>
                        {!isMasterView && (
                          <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"></path></svg>
                        )}
                      </div>
                    </div>
                  ))}
                  {testCases.length === 0 && <div className="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-300 text-base font-black text-slate-400 uppercase tracking-widest">등록된 이슈가 없습니다.</div>}
                </div>
              </div>
            )}
          </div>

          {editingQA && (
            <div className="absolute inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-slate-300 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] z-50 animate-in slide-in-from-right duration-300 flex flex-col">
               <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-slate-50">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">상세 인스펙터</h3>
                 <button onClick={() => setEditingQAId(null)} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-300 transition-all"><svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                  {/* 체크포인트 */}
                  <div className="space-y-3 bg-purple-50 p-6 rounded-[2rem] border border-purple-200">
                    <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest block">체크포인트 (탭 내 위치)</label>
                    <input
                      value={editingQA.checkpoint || ''}
                      onChange={e => updateTestCase(editingQA.id, {checkpoint: e.target.value})}
                      placeholder="예: 로그인 버튼, 결제 폼, 헤더 메뉴..."
                      className="w-full text-lg font-black text-slate-900 outline-none bg-white px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">이슈 요약</label>
                    <input value={editingQA.scenario} onChange={e => updateTestCase(editingQA.id, {scenario: e.target.value})} className="w-full text-2xl font-black text-slate-900 outline-none focus:text-slate-900 transition-colors bg-transparent border-none p-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">상태 (TC)</label>
                       <StatusSelect
                         value={editingQA.status}
                         onChange={(v) => updateTestCase(editingQA.id, {status: v as QAStatus})}
                         options={QA_STATUS_OPTIONS}
                         size="sm"
                         variant="badge"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">진행도 (담당자)</label>
                       <StatusSelect
                         value={editingQA.progress}
                         onChange={(v) => updateTestCase(editingQA.id, {progress: v as QAProgress})}
                         options={QA_PROGRESS_OPTIONS}
                         size="sm"
                         variant="badge"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">중요도</label>
                       <StatusSelect
                         value={editingQA.priority}
                         onChange={(v) => updateTestCase(editingQA.id, {priority: v as QAPriority})}
                         options={PRIORITY_OPTIONS}
                         size="sm"
                         variant="badge"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">구분</label>
                       <StatusSelect
                         value={editingQA.position}
                         onChange={(v) => updateTestCase(editingQA.id, {position: v as QAPosition})}
                         options={POSITION_OPTIONS}
                         size="sm"
                         variant="badge"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">담당자</label>
                       <UserSelect
                         value={editingQA.assignee}
                         onChange={(v) => updateTestCase(editingQA.id, {assignee: v})}
                         options={TEAM_MEMBERS}
                         size="sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">보고자</label>
                       <UserSelect
                         value={editingQA.reporter}
                         onChange={(v) => updateTestCase(editingQA.id, {reporter: v})}
                         options={TEAM_MEMBERS}
                         size="sm"
                       />
                    </div>
                    <div className="col-span-2 space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase block">등록일</label>
                       <div className="w-full bg-slate-200 px-4 py-3 rounded-2xl text-[11px] font-black text-slate-600 border border-slate-300">
                         {editingQA.date}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">상세 내용 및 원인</label>
                    <textarea
                      value={editingQA.issueContent} onChange={e => updateTestCase(editingQA.id, {issueContent: e.target.value})}
                      className="w-full bg-slate-50 p-6 rounded-[2rem] text-sm font-bold leading-relaxed text-slate-900 outline-none focus:bg-white border-2 border-transparent focus:border-slate-900 min-h-[150px] shadow-inner"
                      placeholder="결함 원인 또는 기획 요구사항을 상세히 작성하세요..."
                    />
                  </div>

                  {/* 참조 링크 */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      참조 링크
                    </label>
                    <input
                      value={editingQA.referenceLink || ''}
                      onChange={e => updateTestCase(editingQA.id, {referenceLink: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white border-2 border-transparent focus:border-slate-900"
                    />
                    {editingQA.referenceLink && (
                      <a
                        href={editingQA.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[11px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        링크 열기
                      </a>
                    )}
                  </div>

                  <div className="pt-10 border-t border-slate-200 space-y-8">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                       <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                       활동 로그
                    </h4>

                    <div className="space-y-6">
                      {editingQA.comments.map(c => (
                        <div key={c.id} className="flex flex-col animate-in fade-in slide-in-from-left duration-300">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[12px] font-black text-white shadow-md uppercase">{c.userName[0]}</div>
                            <span className="text-xs font-black text-slate-900">{c.userName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{c.timestamp}</span>
                          </div>
                          <div className="bg-slate-100 px-6 py-5 rounded-[2rem] rounded-tl-none text-sm text-slate-900 leading-relaxed font-bold shadow-sm ml-4">
                            {c.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-6 shadow-sm">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">댓글 작성자:</span>
                         <UserSelect
                           value={selectedCommentUser}
                           onChange={setSelectedCommentUser}
                           options={TEAM_MEMBERS}
                           size="xs"
                         />
                       </div>
                       <div className="flex gap-4">
                         <input
                           value={newComment} onChange={e => setNewComment(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                           placeholder="진행 상황을 입력하세요..."
                           className="flex-1 bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-slate-200 focus:border-slate-900 transition-all text-slate-900"
                         />
                         <button onClick={handleAddComment} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7"></path></svg>
                         </button>
                       </div>
                    </div>
                  </div>

                  <div className="pt-12 flex justify-between items-center">
                    <button onClick={() => {
                      const next = testCases.filter(t => t.id !== editingQA.id);
                      setTestCases(next);
                      saveToStorage(wbsTasks, next);
                      setEditingQAId(null);
                    }} className="text-[11px] font-black text-red-600 hover:text-red-800 uppercase tracking-widest transition-colors">기록 삭제</button>
                    <button onClick={() => setEditingQAId(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-400">변경사항 저장</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
