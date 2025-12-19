'use client';

import React, { useState, useMemo } from 'react';
import { WbsTask, TestCase, WbsStatus, QAProgress } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface DeveloperViewProps {
  wbsTasks: WbsTask[];
  testCases: TestCase[];
  currentUser: string;
  onUserChange: (user: string) => void;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  isMasterView: boolean;
}

const PROGRESS_STEPS: { key: QAProgress; label: string }[] = [
  { key: 'Waiting', label: '대기' },
  { key: 'Checking', label: '확인' },
  { key: 'Working', label: '작업중' },
  { key: 'DevDeployed', label: 'Dev배포' },
  { key: 'ProdDeployed', label: 'Prod배포' },
];

export function DeveloperView({
  wbsTasks,
  testCases,
  currentUser,
  onUserChange,
  updateWbsTask,
  updateTestCase,
  isMasterView
}: DeveloperViewProps) {
  const [showOnlyMine, setShowOnlyMine] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | WbsStatus>('all');

  // Filter tasks
  const filteredWbsTasks = useMemo(() => {
    let tasks = wbsTasks;
    if (showOnlyMine) {
      tasks = tasks.filter(t => t.assignee === currentUser);
    }
    if (statusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === statusFilter);
    }
    return tasks.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }, [wbsTasks, currentUser, showOnlyMine, statusFilter]);

  const filteredTestCases = useMemo(() => {
    let tcs = testCases;
    if (showOnlyMine) {
      tcs = tcs.filter(t => t.assignee === currentUser);
    }
    return tcs;
  }, [testCases, currentUser, showOnlyMine]);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const thisWeekEnd = new Date();
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  const thisWeekEndStr = thisWeekEnd.toISOString().split('T')[0];

  const stats = useMemo(() => ({
    dueToday: filteredWbsTasks.filter(t => t.endDate === today && t.status !== 'Done').length,
    dueThisWeek: filteredWbsTasks.filter(t => t.endDate <= thisWeekEndStr && t.endDate >= today && t.status !== 'Done').length,
    overdue: filteredWbsTasks.filter(t => t.endDate < today && t.status !== 'Done').length,
    tcHigh: filteredTestCases.filter(t => t.priority === 'High' && t.status !== 'DevDone' && t.status !== 'ProdDone').length,
    tcMedium: filteredTestCases.filter(t => t.priority === 'Medium' && t.status !== 'DevDone' && t.status !== 'ProdDone').length,
    tcLow: filteredTestCases.filter(t => t.priority === 'Low' && t.status !== 'DevDone' && t.status !== 'ProdDone').length,
  }), [filteredWbsTasks, filteredTestCases, today, thisWeekEndStr]);

  const handleStatusChange = (taskId: string, newStatus: WbsStatus) => {
    if (isMasterView) return;
    updateWbsTask(taskId, { status: newStatus });
  };

  const handleProgressChange = (tcId: string, newProgress: QAProgress) => {
    if (isMasterView) return;
    updateTestCase(tcId, { progress: newProgress });
  };

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase">담당자:</span>
          <select
            value={currentUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-black border border-slate-300 outline-none"
          >
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase">상태:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | WbsStatus)}
            className="bg-white px-3 py-2 rounded-xl text-xs font-black border border-slate-300 outline-none"
          >
            <option value="all">전체</option>
            <option value="Planning">대기</option>
            <option value="In Progress">진행중</option>
            <option value="Done">완료</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyMine}
            onChange={(e) => setShowOnlyMine(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-xs font-black text-slate-700">내 작업만 보기</span>
        </label>
      </div>

      {/* WBS Section */}
      <section>
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          내 WBS 작업
        </h2>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl border-2 ${stats.dueToday > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-500 uppercase">오늘 마감</p>
            <p className={`text-2xl font-black ${stats.dueToday > 0 ? 'text-red-600' : 'text-slate-400'}`}>{stats.dueToday}건</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-[10px] font-black text-blue-600 uppercase">이번 주</p>
            <p className="text-2xl font-black text-blue-700">{stats.dueThisWeek}건</p>
          </div>
          <div className={`p-4 rounded-xl border-2 ${stats.overdue > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-500 uppercase">지연</p>
            <p className={`text-2xl font-black ${stats.overdue > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{stats.overdue}건</p>
          </div>
        </div>

        {/* Quick Status Change Cards */}
        {filteredWbsTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold">
            할당된 작업이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWbsTasks.map(task => {
              const isOverdue = task.endDate < today && task.status !== 'Done';
              const isDueToday = task.endDate === today;
              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border-2 bg-white transition-all ${
                    isOverdue ? 'border-orange-300 bg-orange-50' :
                    isDueToday ? 'border-red-300 bg-red-50' :
                    task.status === 'Done' ? 'border-green-300 bg-green-50' :
                    'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{task.name}</h3>
                    {isOverdue && <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">지연</span>}
                  </div>
                  {task.detail && <p className="text-[11px] text-slate-500 mb-3">{task.detail}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">~{task.endDate}</span>
                    {isMasterView ? (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${
                        task.status === 'Done' ? 'bg-green-100 text-green-700' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status === 'Planning' ? '대기' : task.status === 'In Progress' ? '진행중' : '완료'}
                      </span>
                    ) : (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as WbsStatus)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-0 outline-none cursor-pointer ${
                          task.status === 'Done' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <option value="Planning">대기</option>
                        <option value="In Progress">진행중</option>
                        <option value="Done">완료</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TC Section */}
      <section>
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          내게 할당된 TC
        </h2>

        {/* TC Stats */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-black text-slate-700">High: {stats.tcHigh}건</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs font-black text-slate-700">Medium: {stats.tcMedium}건</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs font-black text-slate-700">Low: {stats.tcLow}건</span>
          </div>
        </div>

        {/* TC Progress Steps */}
        {filteredTestCases.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 font-bold">
            할당된 TC가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTestCases.map(tc => (
              <div key={tc.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      tc.priority === 'High' ? 'bg-red-500' :
                      tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{tc.scenario}</h3>
                      {tc.checkpoint && (
                        <span className="text-[10px] text-purple-600 font-bold">{tc.checkpoint}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                    tc.status === 'DevDone' || tc.status === 'ProdDone' ? 'bg-green-100 text-green-700' :
                    tc.status === 'DevError' || tc.status === 'ProdError' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tc.status === 'Reviewing' ? '검토중' :
                     tc.status === 'DevError' ? 'Dev오류' :
                     tc.status === 'ProdError' ? 'Prod오류' :
                     tc.status === 'DevDone' ? 'Dev완료' :
                     tc.status === 'ProdDone' ? 'Prod완료' : '보류'}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-1">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const currentIdx = PROGRESS_STEPS.findIndex(s => s.key === tc.progress);
                    const isActive = idx === currentIdx;
                    const isPast = idx < currentIdx;
                    const isClickable = !isMasterView;

                    return (
                      <React.Fragment key={step.key}>
                        <button
                          onClick={() => isClickable && handleProgressChange(tc.id, step.key)}
                          disabled={!isClickable}
                          className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${
                            isActive ? 'bg-slate-900 text-white shadow-lg scale-105' :
                            isPast ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-400'
                          } ${isClickable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                        >
                          {step.label}
                        </button>
                        {idx < PROGRESS_STEPS.length - 1 && (
                          <div className={`w-4 h-0.5 ${isPast ? 'bg-green-300' : 'bg-slate-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
