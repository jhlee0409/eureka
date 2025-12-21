'use client';

import React, { useState } from 'react';
import { WbsTask, WbsStatus, WbsSubTask, WbsCategory, WbsDifficulty, TestCase } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { StatusSelect, UserSelect } from '../../../components/ui';

const WBS_STATUS_OPTIONS = ['Planning', 'In Progress', 'Done'] as const;
const CATEGORY_OPTIONS = ['ui', 'feature', 'bugfix', 'planning', 'optimization'] as const;
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;

const CATEGORY_CONFIG: Record<WbsCategory, { label: string; color: string; icon: string }> = {
  ui: { label: 'UI', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '🎨' },
  feature: { label: '기능', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '⚡' },
  bugfix: { label: '버그', color: 'bg-red-100 text-red-700 border-red-200', icon: '🐛' },
  planning: { label: '기획', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📋' },
  optimization: { label: '최적화', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: '🚀' },
};

const DIFFICULTY_CONFIG: Record<WbsDifficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'bg-green-100 text-green-700' },
  medium: { label: '보통', color: 'bg-amber-100 text-amber-700' },
  hard: { label: '어려움', color: 'bg-red-100 text-red-700' },
};

interface WbsTableProps {
  wbsTasks: WbsTask[];
  testCases?: TestCase[];
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  deleteWbsTask: (id: string) => void;
}

export function WbsTable({
  wbsTasks,
  testCases = [],
  isMasterView,
  getScreenNameById,
  updateWbsTask,
  deleteWbsTask
}: WbsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Subtask 관리 함수들
  const addSubtask = (taskId: string) => {
    const task = wbsTasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: WbsSubTask = {
      id: crypto.randomUUID(),
      name: '',
      assignee: TEAM_MEMBERS[0],
      startDate: task.startDate,
      endDate: task.endDate,
      completed: false,
    };

    updateWbsTask(taskId, {
      subtasks: [...(task.subtasks || []), newSubtask]
    });
  };

  const updateSubtask = (taskId: string, subtaskId: string, updates: Partial<WbsSubTask>) => {
    const task = wbsTasks.find(t => t.id === taskId);
    if (!task?.subtasks) return;

    updateWbsTask(taskId, {
      subtasks: task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, ...updates } : st
      )
    });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = wbsTasks.find(t => t.id === taskId);
    if (!task?.subtasks) return;

    updateWbsTask(taskId, {
      subtasks: task.subtasks.filter(st => st.id !== subtaskId)
    });
  };

  // 하위 작업 진행률 계산
  const getSubtaskProgress = (subtasks?: WbsSubTask[]) => {
    if (!subtasks || subtasks.length === 0) return null;
    const completed = subtasks.filter(st => st.completed).length;
    return { completed, total: subtasks.length, percent: Math.round((completed / subtasks.length) * 100) };
  };

  // 연결된 TC 정보 가져오기
  const getRelatedTestCases = (relatedTcIds?: string[]) => {
    if (!relatedTcIds || relatedTcIds.length === 0) return [];
    return testCases.filter(tc => relatedTcIds.includes(tc.id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200">
          <tr>
            {!isMasterView && <th className="px-2 py-2 w-8"></th>}
            {isMasterView && <th className="px-3 py-2">화면명</th>}
            <th className="px-3 py-2">상세 업무명</th>
            <th className="px-3 py-2 w-20">분류</th>
            <th className="px-3 py-2">담당자</th>
            <th className="px-3 py-2">일정</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2 w-16">하위작업</th>
            {!isMasterView && <th className="px-3 py-2 w-8"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {wbsTasks.map(task => {
            const isExpanded = expandedIds.has(task.id);
            const subtaskProgress = getSubtaskProgress(task.subtasks);
            const relatedTcs = getRelatedTestCases(task.relatedTcIds);
            const categoryConfig = task.category ? CATEGORY_CONFIG[task.category] : null;
            const difficultyConfig = task.difficulty ? DIFFICULTY_CONFIG[task.difficulty] : null;

            return (
              <React.Fragment key={task.id}>
                {/* 메인 행 */}
                <tr
                  className={`group hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                  onClick={() => !isMasterView && toggleExpand(task.id)}
                >
                  {/* 확장 아이콘 */}
                  {!isMasterView && (
                    <td className="px-2 py-2 cursor-pointer">
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  )}

                  {isMasterView && (
                    <td className="px-3 py-2">
                      <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-bold">
                        {getScreenNameById(task.originScreenId)}
                      </span>
                    </td>
                  )}

                  {/* 업무명 */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      <>
                        <p className="font-bold text-slate-900 text-xs">{task.name}</p>
                        {task.detail && <p className="text-[10px] text-slate-500 mt-0.5">{task.detail}</p>}
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={task.name}
                          onChange={e => updateWbsTask(task.id, { name: e.target.value })}
                          className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none focus:text-slate-900 border-b border-transparent focus:border-slate-300"
                        />
                        <input
                          type="text"
                          value={task.detail}
                          onChange={e => updateWbsTask(task.id, { detail: e.target.value })}
                          placeholder="상세 기술 내용..."
                          className="w-full bg-transparent text-[10px] text-slate-500 mt-0.5 outline-none"
                        />
                      </>
                    )}
                  </td>

                  {/* 분류 & 난이도 */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      {categoryConfig ? (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryConfig.color}`}>
                          {categoryConfig.icon} {categoryConfig.label}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300">-</span>
                      )}
                      {difficultyConfig && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${difficultyConfig.color}`}>
                          {difficultyConfig.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 담당자 */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <UserSelect
                      value={task.assignee}
                      onChange={(v) => updateWbsTask(task.id, { assignee: v })}
                      options={TEAM_MEMBERS}
                      size="xs"
                      disabled={isMasterView}
                    />
                  </td>

                  {/* 일정 */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700">
                        <span>{task.startDate}</span>
                        <span className="text-slate-400">~ {task.endDate}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <input
                          type="date"
                          value={task.startDate}
                          onChange={e => updateWbsTask(task.id, { startDate: e.target.value })}
                          className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 text-[10px] outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <input
                          type="date"
                          value={task.endDate}
                          onChange={e => updateWbsTask(task.id, { endDate: e.target.value })}
                          className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 text-[10px] outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    )}
                  </td>

                  {/* 상태 */}
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={task.status}
                      onChange={(v) => updateWbsTask(task.id, { status: v as WbsStatus })}
                      options={WBS_STATUS_OPTIONS}
                      size="xs"
                      variant={isMasterView ? 'badge' : 'default'}
                      disabled={isMasterView}
                    />
                  </td>

                  {/* 하위작업 진행률 */}
                  <td className="px-3 py-2">
                    {subtaskProgress ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${subtaskProgress.percent}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {subtaskProgress.completed}/{subtaskProgress.total}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </td>

                  {/* 삭제 */}
                  {!isMasterView && (
                    <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => deleteWbsTask(task.id)}
                        className="text-slate-300 hover:text-red-500 text-lg font-bold transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>

                {/* 확장 영역 */}
                {isExpanded && !isMasterView && (
                  <tr>
                    <td colSpan={9} className="bg-slate-50 border-t border-slate-100">
                      <div className="px-6 py-4 space-y-4">
                        {/* 분류 & 난이도 편집 */}
                        <div className="flex gap-4">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">분류</label>
                            <StatusSelect
                              value={task.category || 'feature'}
                              onChange={(v) => updateWbsTask(task.id, { category: v as WbsCategory })}
                              options={CATEGORY_OPTIONS}
                              size="sm"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">난이도</label>
                            <StatusSelect
                              value={task.difficulty || 'medium'}
                              onChange={(v) => updateWbsTask(task.id, { difficulty: v as WbsDifficulty })}
                              options={DIFFICULTY_OPTIONS}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* 하위 작업 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                              하위 작업 {task.subtasks?.length ? `(${task.subtasks.length})` : ''}
                            </label>
                            <button
                              onClick={() => addSubtask(task.id)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              + 추가
                            </button>
                          </div>

                          {task.subtasks && task.subtasks.length > 0 ? (
                            <div className="space-y-1.5">
                              {task.subtasks.map(subtask => (
                                <div
                                  key={subtask.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    subtask.completed
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={e => updateSubtask(task.id, subtask.id, { completed: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                  />
                                  <input
                                    type="text"
                                    value={subtask.name}
                                    onChange={e => updateSubtask(task.id, subtask.id, { name: e.target.value })}
                                    placeholder="하위 작업명..."
                                    className={`flex-1 bg-transparent text-xs font-medium outline-none ${
                                      subtask.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                                    }`}
                                  />
                                  <UserSelect
                                    value={subtask.assignee}
                                    onChange={(v) => updateSubtask(task.id, subtask.id, { assignee: v })}
                                    options={TEAM_MEMBERS}
                                    size="xs"
                                  />
                                  <input
                                    type="date"
                                    value={subtask.startDate}
                                    onChange={e => updateSubtask(task.id, subtask.id, { startDate: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] outline-none w-28"
                                  />
                                  <span className="text-slate-400 text-[10px]">~</span>
                                  <input
                                    type="date"
                                    value={subtask.endDate}
                                    onChange={e => updateSubtask(task.id, subtask.id, { endDate: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] outline-none w-28"
                                  />
                                  <button
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 text-center py-2">
                              하위 작업이 없습니다. 추가하여 작업을 세분화하세요.
                            </p>
                          )}
                        </div>

                        {/* 연결된 TC */}
                        {relatedTcs.length > 0 && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">
                              연결된 이슈 ({relatedTcs.length})
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {relatedTcs.map(tc => (
                                <div
                                  key={tc.id}
                                  className={`px-2 py-1 rounded text-[10px] font-medium border ${
                                    tc.status === 'DevDone' || tc.status === 'ProdDone'
                                      ? 'bg-green-50 border-green-200 text-green-700'
                                      : tc.status === 'DevError' || tc.status === 'ProdError'
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {tc.scenario.length > 30 ? tc.scenario.slice(0, 30) + '...' : tc.scenario}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {wbsTasks.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-xs font-bold text-slate-400">등록된 WBS가 없습니다</p>
        </div>
      )}
    </div>
  );
}
