'use client';

import React, { useState, useMemo } from 'react';
import {
  TestCase,
  QAStatus,
  QAProgress,
  QAPriority,
  QAPosition,
  IssueType,
  Comment,
  ActivityLog,
  VerificationItem,
  RejectReason,
  DeployEnv,
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

const STATUS_CONFIG: Record<QAStatus, { label: string; color: string }> = {
  Reviewing: { label: '검토중', color: 'bg-yellow-100 text-yellow-700' },
  DevError: { label: 'Dev오류', color: 'bg-red-100 text-red-700' },
  ProdError: { label: 'Prod오류', color: 'bg-rose-100 text-rose-700' },
  DevDone: { label: 'Dev완료', color: 'bg-green-100 text-green-700' },
  ProdDone: { label: 'Prod완료', color: 'bg-emerald-100 text-emerald-700' },
  Hold: { label: '보류', color: 'bg-orange-100 text-orange-700' },
  Rejected: { label: '반려', color: 'bg-gray-100 text-gray-700' },
  Duplicate: { label: '중복', color: 'bg-purple-100 text-purple-700' },
};

const PROGRESS_CONFIG: Record<QAProgress, { label: string; color: string }> = {
  Waiting: { label: '대기', color: 'bg-slate-100 text-slate-600' },
  Checking: { label: '확인', color: 'bg-cyan-100 text-cyan-700' },
  Working: { label: '작업', color: 'bg-purple-100 text-purple-700' },
  DevDeployed: { label: 'Dev배포', color: 'bg-blue-100 text-blue-700' },
  ProdDeployed: { label: 'Prod배포', color: 'bg-green-100 text-green-700' },
};

const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; icon: string; color: string }> = {
  bug: { label: '버그', icon: '🐛', color: 'bg-red-50 text-red-700' },
  improvement: { label: '개선', icon: '✨', color: 'bg-blue-50 text-blue-700' },
  question: { label: '문의', icon: '❓', color: 'bg-yellow-50 text-yellow-700' },
  task: { label: '작업', icon: '📋', color: 'bg-green-50 text-green-700' },
};

const PRIORITY_CONFIG: Record<QAPriority, { label: string; color: string; dot: string }> = {
  High: { label: 'High', color: 'text-red-600', dot: 'bg-red-500' },
  Medium: { label: 'Med', color: 'text-orange-600', dot: 'bg-orange-400' },
  Low: { label: 'Low', color: 'text-green-600', dot: 'bg-green-500' },
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left table-fixed">
        <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
          <tr>
            {!isMasterView && <th className="w-8 px-2 py-2.5"></th>}
            {isMasterView && <th className="w-20 px-3 py-2.5">화면</th>}
            <th className="w-16 px-2 py-2.5">타입</th>
            <th className="w-12 px-2 py-2.5">중요도</th>
            <th className="px-2 py-2.5">요약</th>
            <th className="w-20 px-2 py-2.5">포지션</th>
            <th className="w-28 px-2 py-2.5">관련 WBS</th>
            <th className="w-24 px-2 py-2.5">담당자</th>
            <th className="w-20 px-2 py-2.5">상태</th>
            <th className="w-20 px-2 py-2.5">진행도</th>
            {!isMasterView && <th className="w-8 px-2 py-2.5"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {testCases.map(tc => {
            const isExpanded = expandedIds.has(tc.id);
            const closed = isClosed(tc.status);
            const issueConfig = tc.issueType ? ISSUE_TYPE_CONFIG[tc.issueType] : null;
            const priorityConfig = PRIORITY_CONFIG[tc.priority];
            const statusConfig = STATUS_CONFIG[tc.status];
            const progressConfig = PROGRESS_CONFIG[tc.progress];
            const wbsName = getWbsName(tc.relatedWbsId);

            return (
              <React.Fragment key={tc.id}>
                {/* 메인 행 */}
                <tr
                  className={`group hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''} ${closed ? 'opacity-60' : ''}`}
                  onClick={() => !isMasterView && toggleExpand(tc.id)}
                >
                  {/* 확장 아이콘 */}
                  {!isMasterView && (
                    <td className="px-2 py-2 cursor-pointer">
                      <svg
                        className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  )}

                  {/* 화면명 (Master View) */}
                  {isMasterView && (
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded truncate block">
                        {getScreenNameById(tc.originScreenId)}
                      </span>
                    </td>
                  )}

                  {/* 타입 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      issueConfig ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${issueConfig.color}`}>
                          {issueConfig.icon}
                        </span>
                      ) : <span className="text-slate-300">-</span>
                    ) : (
                      <StatusSelect
                        value={tc.issueType || 'bug'}
                        onChange={(v) => updateTestCase(tc.id, { issueType: v as IssueType })}
                        options={ISSUE_TYPE_OPTIONS}
                        size="xs"
                      />
                    )}
                  </td>

                  {/* 중요도 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${priorityConfig.dot}`} />
                      </div>
                    ) : (
                      <StatusSelect
                        value={tc.priority}
                        onChange={(v) => updateTestCase(tc.id, { priority: v as QAPriority })}
                        options={PRIORITY_OPTIONS}
                        size="xs"
                        variant="badge"
                      />
                    )}
                  </td>

                  {/* 요약 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      <p className={`text-xs font-medium truncate ${closed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {tc.scenario}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={tc.scenario}
                        onChange={e => updateTestCase(tc.id, { scenario: e.target.value })}
                        className={`w-full bg-transparent text-xs font-medium outline-none border-b border-transparent focus:border-slate-300 ${closed ? 'line-through text-slate-400' : 'text-slate-800'}`}
                      />
                    )}
                  </td>

                  {/* 포지션 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    {isMasterView ? (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {tc.position}
                      </span>
                    ) : (
                      <StatusSelect
                        value={tc.position}
                        onChange={(v) => updateTestCase(tc.id, { position: v as QAPosition })}
                        options={POSITION_OPTIONS}
                        size="xs"
                      />
                    )}
                  </td>

                  {/* 관련 WBS */}
                  <td className="px-2 py-2">
                    {wbsName ? (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate block" title={wbsName}>
                        {wbsName}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </td>

                  {/* 담당자 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <UserSelect
                      value={tc.assignee}
                      onChange={(v) => updateTestCase(tc.id, { assignee: v })}
                      options={TEAM_MEMBERS}
                      size="xs"
                      disabled={isMasterView}
                    />
                  </td>

                  {/* 상태 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.status}
                      onChange={(v) => updateTestCase(tc.id, { status: v as QAStatus })}
                      options={QA_STATUS_OPTIONS}
                      size="xs"
                      disabled={isMasterView}
                    />
                  </td>

                  {/* 진행도 */}
                  <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <StatusSelect
                      value={tc.progress}
                      onChange={(v) => updateTestCase(tc.id, { progress: v as QAProgress })}
                      options={QA_PROGRESS_OPTIONS}
                      size="xs"
                      disabled={isMasterView}
                    />
                  </td>

                  {/* 삭제 */}
                  {!isMasterView && (
                    <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => deleteTestCase(tc.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>

                {/* 확장 영역 */}
                {isExpanded && !isMasterView && (
                  <tr>
                    <td colSpan={11} className="bg-slate-50 border-t border-slate-100">
                      <div className="p-4 space-y-4">
                        {/* 상세 정보 그리드 */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* 왼쪽: 상세 내용 */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">체크포인트</label>
                              <input
                                type="text"
                                value={tc.checkpoint || ''}
                                onChange={e => updateTestCase(tc.id, { checkpoint: e.target.value })}
                                placeholder="예: 로그인 버튼"
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">상세 내용</label>
                              <textarea
                                value={tc.issueContent}
                                onChange={e => updateTestCase(tc.id, { issueContent: e.target.value })}
                                rows={2}
                                placeholder="이슈에 대한 상세 설명..."
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
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
                                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">기대 결과</label>
                                <textarea
                                  value={tc.expectedResult || ''}
                                  onChange={e => updateTestCase(tc.id, { expectedResult: e.target.value })}
                                  rows={2}
                                  placeholder="예상되는 정상 동작..."
                                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
                                />
                              </div>
                            </div>
                            {tc.environment && (
                              <div className="bg-slate-100 p-2 rounded text-[10px] text-slate-600">
                                <span className="font-bold">환경:</span> {tc.environment}
                              </div>
                            )}
                          </div>

                          {/* 오른쪽: 메타 정보 & 댓글 */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-slate-100 p-2 rounded">
                                <span className="text-slate-500">보고자:</span>{' '}
                                <span className="font-bold text-slate-700">{tc.reporter}</span>
                              </div>
                              <div className="bg-slate-100 p-2 rounded">
                                <span className="text-slate-500">등록일:</span>{' '}
                                <span className="font-bold text-slate-700">{tc.date}</span>
                              </div>
                            </div>

                            {/* 관련 WBS 상세 */}
                            {tc.relatedWbsId && wbsName && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <label className="text-[9px] font-bold text-blue-600 uppercase block mb-0.5">관련 WBS</label>
                                <p className="text-xs font-medium text-blue-800">{wbsName}</p>
                              </div>
                            )}

                            {/* 댓글 */}
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
                                  className="flex-1 px-2 py-1 rounded border border-slate-200 text-[10px] outline-none focus:border-slate-400"
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
