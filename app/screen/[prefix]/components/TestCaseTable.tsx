'use client';

import React, { useState } from 'react';
import {
  TestCase,
  QAStatus,
  QAProgress,
  QAPriority,
  QAPosition,
  IssueType,
  Comment,
  WbsTask,
} from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { StatusSelect, UserSelect } from '../../../components/ui';

// 상수 정의
const QA_STATUS_OPTIONS = ['Reviewing', 'DevError', 'ProdError', 'DevDone', 'ProdDone', 'Hold', 'Rejected', 'Duplicate'] as const;
const QA_PROGRESS_OPTIONS = ['Waiting', 'Checking', 'Working', 'DevDeployed', 'ProdDeployed'] as const;
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const POSITION_OPTIONS = ['Front-end', 'Back-end', 'Design', 'PM'] as const;
const ISSUE_TYPE_OPTIONS = ['bug', 'improvement', 'question', 'task'] as const;

const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; icon: string; color: string }> = {
  bug: { label: '버그', icon: '🐛', color: 'bg-red-50 text-red-700' },
  improvement: { label: '개선', icon: '✨', color: 'bg-blue-50 text-blue-700' },
  question: { label: '문의', icon: '❓', color: 'bg-yellow-50 text-yellow-700' },
  task: { label: '작업', icon: '📋', color: 'bg-green-50 text-green-700' },
};

const PRIORITY_CONFIG: Record<QAPriority, { dot: string }> = {
  High: { dot: 'bg-red-500' },
  Medium: { dot: 'bg-orange-400' },
  Low: { dot: 'bg-green-500' },
};

interface TestCaseTableProps {
  testCases: TestCase[];
  wbsTasks: WbsTask[];
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
}

export function TestCaseTable({
  testCases,
  wbsTasks,
  isMasterView,
  getScreenNameById,
  updateTestCase,
  deleteTestCase,
}: TestCaseTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentUser, setCommentUser] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getWbsName = (wbsId?: string) => {
    if (!wbsId) return null;
    return wbsTasks.find(w => w.id === wbsId)?.name || null;
  };

  const handleAddComment = (tcId: string, tc: TestCase) => {
    const text = newComment[tcId]?.trim();
    if (!text) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      userName: commentUser[tcId] || TEAM_MEMBERS[0],
      text,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
    };
    updateTestCase(tcId, { comments: [...tc.comments, comment] });
    setNewComment(prev => ({ ...prev, [tcId]: '' }));
  };

  const isClosed = (status: QAStatus) =>
    ['DevDone', 'ProdDone', 'Rejected', 'Duplicate'].includes(status);

  // 컬럼 수 계산 (isMasterView일 때 화면 컬럼 추가됨)
  const columnCount = isMasterView ? 11 : 10;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-left min-w-[900px]">
        <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
          <tr>
            <th className="w-[32px] px-2 py-2.5"></th>
            {isMasterView && <th className="w-[80px] px-2 py-2.5">화면</th>}
            <th className="w-[60px] px-2 py-2.5">타입</th>
            <th className="w-[50px] px-2 py-2.5 text-center">중요</th>
            <th className="px-2 py-2.5">요약</th>
            <th className="w-[80px] px-2 py-2.5">포지션</th>
            <th className="w-[100px] px-2 py-2.5">관련WBS</th>
            <th className="w-[90px] px-2 py-2.5">담당자</th>
            <th className="w-[80px] px-2 py-2.5">상태</th>
            <th className="w-[80px] px-2 py-2.5">진행도</th>
            <th className="w-[32px] px-2 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {testCases.map(tc => {
            const isExpanded = expandedIds.has(tc.id);
            const closed = isClosed(tc.status);
            const issueConfig = tc.issueType ? ISSUE_TYPE_CONFIG[tc.issueType] : null;
            const priorityConfig = PRIORITY_CONFIG[tc.priority];
            const wbsName = getWbsName(tc.relatedWbsId);

            return (
              <React.Fragment key={tc.id}>
                <tr
                  className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''} ${closed ? 'opacity-60' : ''}`}
                  onClick={() => toggleExpand(tc.id)}
                >
                  <td className="px-2 py-2">
                    <svg
                      className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </td>

                  {isMasterView && (
                    <td className="px-2 py-2">
                      <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded truncate block">
                        {getScreenNameById(tc.originScreenId)}
                      </span>
                    </td>
                  )}

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.issueType || 'bug'}
                      onChange={(v) => updateTestCase(tc.id, { issueType: v as IssueType })}
                      options={ISSUE_TYPE_OPTIONS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.priority}
                      onChange={(v) => updateTestCase(tc.id, { priority: v as QAPriority })}
                      options={PRIORITY_OPTIONS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={tc.scenario}
                      onChange={e => updateTestCase(tc.id, { scenario: e.target.value })}
                      className={`w-full bg-transparent text-xs font-medium outline-none border-b border-transparent focus:border-slate-300 ${closed ? 'line-through text-slate-400' : 'text-slate-800'}`}
                    />
                  </td>

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.position}
                      onChange={(v) => updateTestCase(tc.id, { position: v as QAPosition })}
                      options={POSITION_OPTIONS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2">
                    {wbsName ? (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate block max-w-[90px]" title={wbsName}>
                        {wbsName}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </td>

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <UserSelect
                      value={tc.assignee}
                      onChange={(v) => updateTestCase(tc.id, { assignee: v })}
                      options={TEAM_MEMBERS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.status}
                      onChange={(v) => updateTestCase(tc.id, { status: v as QAStatus })}
                      options={QA_STATUS_OPTIONS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.progress}
                      onChange={(v) => updateTestCase(tc.id, { progress: v as QAProgress })}
                      options={QA_PROGRESS_OPTIONS}
                      size="xs"
                    />
                  </td>

                  <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => deleteTestCase(tc.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={columnCount} className="bg-slate-50 border-t border-slate-100">
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">체크포인트</label>
                            <input
                              type="text"
                              value={tc.checkpoint || ''}
                              onChange={e => updateTestCase(tc.id, { checkpoint: e.target.value })}
                              placeholder="예: 로그인 버튼"
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">상세 내용</label>
                            <textarea
                              value={tc.issueContent}
                              onChange={e => updateTestCase(tc.id, { issueContent: e.target.value })}
                              rows={2}
                              placeholder="이슈에 대한 상세 설명..."
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">재현 방법</label>
                              <textarea
                                value={tc.reproductionSteps || ''}
                                onChange={e => updateTestCase(tc.id, { reproductionSteps: e.target.value })}
                                rows={2}
                                placeholder="1. 첫 번째 단계..."
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">기대 결과</label>
                              <textarea
                                value={tc.expectedResult || ''}
                                onChange={e => updateTestCase(tc.id, { expectedResult: e.target.value })}
                                rows={2}
                                placeholder="예상되는 정상 동작..."
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none bg-white"
                              />
                            </div>
                          </div>
                          {tc.environment && (
                            <div className="bg-slate-100 p-2 rounded text-[10px] text-slate-600">
                              <span className="font-bold">환경:</span> {tc.environment}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-slate-500">보고자:</span>{' '}
                              <span className="font-bold text-slate-700">{tc.reporter}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-slate-500">등록일:</span>{' '}
                              <span className="font-bold text-slate-700">{tc.date}</span>
                            </div>
                          </div>

                          {wbsName && (
                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                              <label className="text-[9px] font-bold text-blue-600 uppercase block mb-0.5">관련 WBS</label>
                              <p className="text-xs font-medium text-blue-800">{wbsName}</p>
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                              댓글 ({tc.comments.length})
                            </label>
                            <div className="max-h-24 overflow-y-auto space-y-1 mb-2">
                              {tc.comments.map(c => (
                                <div key={c.id} className="bg-white p-2 rounded border border-slate-200 text-[10px]">
                                  <span className="font-bold text-slate-700">{c.userName}</span>
                                  <span className="text-slate-400 ml-1">{c.timestamp}</span>
                                  <p className="text-slate-600 mt-0.5">{c.text}</p>
                                </div>
                              ))}
                              {tc.comments.length === 0 && (
                                <p className="text-[10px] text-slate-400 text-center py-1">댓글 없음</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <UserSelect
                                value={commentUser[tc.id] || TEAM_MEMBERS[0]}
                                onChange={(v) => setCommentUser(prev => ({ ...prev, [tc.id]: v }))}
                                options={TEAM_MEMBERS}
                                size="xs"
                              />
                              <input
                                type="text"
                                value={newComment[tc.id] || ''}
                                onChange={e => setNewComment(prev => ({ ...prev, [tc.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(tc.id, tc)}
                                placeholder="댓글..."
                                className="flex-1 px-2 py-1 rounded border border-slate-200 text-[10px] outline-none focus:border-slate-400 bg-white"
                              />
                              <button
                                onClick={() => handleAddComment(tc.id, tc)}
                                className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-900"
                              >
                                추가
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {testCases.length === 0 && (
        <div className="p-8 text-center">
          <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-xs font-bold text-slate-400">등록된 이슈가 없습니다</p>
        </div>
      )}
    </div>
  );
}
