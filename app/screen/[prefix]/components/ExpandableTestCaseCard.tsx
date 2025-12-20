'use client';

import React, { useState, useMemo } from 'react';
import { TestCase, QAStatus, QAProgress, QAPriority, Comment, ActivityLog, VerificationItem, RejectReason, DeployEnv } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface ExpandableTestCaseCardProps {
  tc: TestCase;
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
}

const STATUS_OPTIONS: { value: QAStatus; label: string; color: string }[] = [
  { value: 'Reviewing', label: '검토중', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DevError', label: 'Dev 오류', color: 'bg-red-100 text-red-800' },
  { value: 'ProdError', label: 'Prod 오류', color: 'bg-red-100 text-red-800' },
  { value: 'DevDone', label: 'Dev 완료', color: 'bg-green-100 text-green-800' },
  { value: 'ProdDone', label: 'Prod 완료', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Hold', label: '보류', color: 'bg-orange-100 text-orange-800' },
  { value: 'Rejected', label: '반려', color: 'bg-gray-100 text-gray-800' },
  { value: 'Duplicate', label: '중복', color: 'bg-purple-100 text-purple-800' },
];

const PROGRESS_OPTIONS: { value: QAProgress; label: string; color: string }[] = [
  { value: 'Waiting', label: '대기', color: 'bg-slate-100 text-slate-600' },
  { value: 'Checking', label: '확인', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'Working', label: '작업 중', color: 'bg-purple-100 text-purple-800' },
  { value: 'DevDeployed', label: 'Dev 배포', color: 'bg-blue-100 text-blue-800' },
  { value: 'ProdDeployed', label: 'Prod 배포', color: 'bg-emerald-100 text-emerald-800' },
];

const REJECT_REASONS: { key: RejectReason; label: string }[] = [
  { key: 'not_reproducible', label: '재현 불가' },
  { key: 'working_as_designed', label: '설계대로 작동' },
  { key: 'duplicate', label: '중복 이슈' },
  { key: 'insufficient_info', label: '정보 부족' },
  { key: 'out_of_scope', label: '범위 외' },
];

export function ExpandableTestCaseCard({
  tc,
  isMasterView,
  getScreenNameById,
  updateTestCase,
  deleteTestCase,
}: ExpandableTestCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'info' | 'developer' | 'qa'>('info');
  const [newComment, setNewComment] = useState('');
  const [selectedCommentUser, setSelectedCommentUser] = useState(TEAM_MEMBERS[0]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectReason>('not_reproducible');
  const [rejectNote, setRejectNote] = useState('');

  const statusConfig = STATUS_OPTIONS.find(s => s.value === tc.status);
  const progressConfig = PROGRESS_OPTIONS.find(p => p.value === tc.progress);

  // Activity log
  const addActivityLog = (action: ActivityLog['action'], details?: ActivityLog['details']) => {
    const log: ActivityLog = {
      id: crypto.randomUUID(),
      tcId: tc.id,
      action,
      actor: selectedCommentUser,
      actorRole: 'developer',
      timestamp: new Date().toISOString(),
      details,
    };
    const existingLogs = tc.activityLog || [];
    updateTestCase(tc.id, { activityLog: [...existingLogs, log] });
  };

  // Quick inline actions
  const handleStatusChange = (e: React.MouseEvent, newStatus: QAStatus) => {
    e.stopPropagation();
    if (isMasterView) return;
    addActivityLog('status_changed', { fromStatus: tc.status, toStatus: newStatus });
    updateTestCase(tc.id, { status: newStatus });
  };

  const handleProgressChange = (e: React.MouseEvent, newProgress: QAProgress) => {
    e.stopPropagation();
    if (isMasterView) return;
    addActivityLog('status_changed', { fromProgress: tc.progress, toProgress: newProgress });
    updateTestCase(tc.id, { progress: newProgress });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (isMasterView) return;
    updateTestCase(tc.id, { assignee: e.target.value });
    addActivityLog('assigned');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: newComment,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
    };
    updateTestCase(tc.id, { comments: [...tc.comments, comment] });
    addActivityLog('commented', { comment: newComment });
    setNewComment('');
  };

  const handleReject = () => {
    updateTestCase(tc.id, {
      status: 'Rejected',
      rejectReason,
      issueContent: tc.issueContent + `\n\n[반려 사유] ${REJECT_REASONS.find(r => r.key === rejectReason)?.label}: ${rejectNote}`,
    });
    addActivityLog('rejected', { rejectReason });
    setShowRejectModal(false);
    setRejectNote('');
  };

  const handleVerifyPass = () => {
    const env = tc.deployedEnvs?.includes('prod') ? 'Prod' : 'Dev';
    const newStatus = env === 'Prod' ? 'ProdDone' : 'DevDone';
    updateTestCase(tc.id, { status: newStatus });
    addActivityLog('verified', { toStatus: newStatus, deployEnv: env.toLowerCase() as DeployEnv });
  };

  const handleVerifyFail = () => {
    const env = tc.deployedEnvs?.includes('prod') ? 'Prod' : 'Dev';
    const newStatus = env === 'Prod' ? 'ProdError' : 'DevError';
    updateTestCase(tc.id, { status: newStatus, progress: 'Waiting' });
    addActivityLog('verified', { toStatus: newStatus, deployEnv: env.toLowerCase() as DeployEnv });
  };

  const handleDeploy = (env: 'dev' | 'prod') => {
    const envs = tc.deployedEnvs || [];
    if (!envs.includes(env)) {
      const newProgress = env === 'prod' ? 'ProdDeployed' : 'DevDeployed';
      updateTestCase(tc.id, {
        progress: newProgress,
        deployedEnvs: [...envs, env],
      });
      addActivityLog('deployed', { deployEnv: env });
    }
  };

  const handleAddVerificationItem = () => {
    const items = tc.verificationChecklist || [];
    const newItem: VerificationItem = {
      id: crypto.randomUUID(),
      text: '',
      checked: false,
    };
    updateTestCase(tc.id, { verificationChecklist: [...items, newItem] });
  };

  const handleUpdateVerificationItem = (itemId: string, updates: Partial<VerificationItem>) => {
    const items = tc.verificationChecklist || [];
    updateTestCase(tc.id, {
      verificationChecklist: items.map(item => (item.id === itemId ? { ...item, ...updates } : item)),
    });
  };

  const handleRemoveVerificationItem = (itemId: string) => {
    const items = tc.verificationChecklist || [];
    updateTestCase(tc.id, {
      verificationChecklist: items.filter(item => item.id !== itemId),
    });
  };

  const sortedActivityLog = useMemo(() => {
    return [...(tc.activityLog || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tc.activityLog]);

  return (
    <div
      className={`rounded-2xl border-2 transition-all bg-white overflow-hidden ${
        isExpanded ? 'border-slate-900 shadow-xl' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ===== 접힌 상태 (Collapsed Header) ===== */}
      <div
        onClick={() => !isMasterView && setIsExpanded(!isExpanded)}
        className={`p-5 flex items-center gap-4 ${!isMasterView ? 'cursor-pointer' : ''}`}
      >
        {/* 확장 아이콘 */}
        {!isMasterView && (
          <button className="shrink-0 p-1">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 우선순위 표시 */}
        <div
          className={`w-3 h-3 rounded-full shrink-0 ${
            tc.priority === 'High' ? 'bg-red-500' : tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
          }`}
          title={tc.priority}
        />

        {/* 체크포인트 */}
        <div className="w-20 shrink-0">
          {tc.checkpoint ? (
            <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-1 rounded-lg truncate block">
              {tc.checkpoint}
            </span>
          ) : (
            <span className="text-[10px] text-slate-300">-</span>
          )}
        </div>

        {/* 시나리오 (핵심) */}
        <div className="flex-1 min-w-0">
          {isMasterView && (
            <span className="text-[9px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded mr-2">
              {getScreenNameById(tc.originScreenId)}
            </span>
          )}
          <p className="text-sm font-bold text-slate-900 truncate">{tc.scenario}</p>
        </div>

        {/* 포지션 */}
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
          {tc.position}
        </span>

        {/* 담당자 (빠른 변경) */}
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          {isMasterView ? (
            <span className="text-xs font-bold text-slate-600">{tc.assignee}</span>
          ) : (
            <select
              value={tc.assignee}
              onChange={handleAssigneeChange}
              className="text-xs font-bold text-slate-700 bg-transparent border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-slate-400"
            >
              {TEAM_MEMBERS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 상태 드롭다운 */}
        <div className="shrink-0 relative group" onClick={e => e.stopPropagation()}>
          <button
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${statusConfig?.color || 'bg-slate-100 text-slate-600'}`}
          >
            {statusConfig?.label || tc.status}
          </button>
          {!isMasterView && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 hidden group-hover:block min-w-[120px]">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={e => handleStatusChange(e, opt.value)}
                  className={`w-full px-3 py-2 text-left text-[10px] font-bold hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                    tc.status === opt.value ? 'bg-slate-100' : ''
                  }`}
                >
                  <span className={`inline-block px-2 py-0.5 rounded ${opt.color}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 진행도 드롭다운 */}
        <div className="shrink-0 relative group" onClick={e => e.stopPropagation()}>
          <button
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${progressConfig?.color || 'bg-slate-100 text-slate-600'}`}
          >
            {progressConfig?.label || tc.progress}
          </button>
          {!isMasterView && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 hidden group-hover:block min-w-[120px]">
              {PROGRESS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={e => handleProgressChange(e, opt.value)}
                  className={`w-full px-3 py-2 text-left text-[10px] font-bold hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                    tc.progress === opt.value ? 'bg-slate-100' : ''
                  }`}
                >
                  <span className={`inline-block px-2 py-0.5 rounded ${opt.color}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 댓글 수 */}
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span className="text-xs font-bold">{tc.comments.length}</span>
        </div>
      </div>

      {/* ===== 펼친 상태 (Expanded Content) ===== */}
      {isExpanded && !isMasterView && (
        <div className="border-t border-slate-200">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setActivePanel('info')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activePanel === 'info' ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              상세 정보
            </button>
            <button
              onClick={() => setActivePanel('developer')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activePanel === 'developer' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              담당자 액션
            </button>
            <button
              onClick={() => setActivePanel('qa')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activePanel === 'qa' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              QA 검증
            </button>
          </div>

          {/* 패널 콘텐츠 */}
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {/* === 상세 정보 패널 === */}
            {activePanel === 'info' && (
              <>
                {/* 기본 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">체크포인트</label>
                    <input
                      value={tc.checkpoint || ''}
                      onChange={e => updateTestCase(tc.id, { checkpoint: e.target.value })}
                      placeholder="예: 로그인 버튼"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">보고자</label>
                    <p className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-bold text-slate-700">{tc.reporter}</p>
                  </div>
                </div>

                {/* 시나리오 */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">시나리오</label>
                  <textarea
                    value={tc.scenario}
                    onChange={e => updateTestCase(tc.id, { scenario: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-slate-500 resize-none"
                  />
                </div>

                {/* 상세 내용 */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">상세 내용</label>
                  <textarea
                    value={tc.issueContent}
                    onChange={e => updateTestCase(tc.id, { issueContent: e.target.value })}
                    rows={3}
                    placeholder="이슈에 대한 상세 설명..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500 resize-none"
                  />
                </div>

                {/* 재현 방법 & 기대 결과 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">재현 방법</label>
                    <textarea
                      value={tc.reproductionSteps || ''}
                      onChange={e => updateTestCase(tc.id, { reproductionSteps: e.target.value })}
                      rows={3}
                      placeholder="1. 첫 번째 단계&#10;2. 두 번째 단계"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">기대 결과</label>
                    <textarea
                      value={tc.expectedResult || ''}
                      onChange={e => updateTestCase(tc.id, { expectedResult: e.target.value })}
                      rows={3}
                      placeholder="예상되는 정상 동작..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500 resize-none"
                    />
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">댓글 ({tc.comments.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {tc.comments.map(comment => (
                      <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-700">{comment.userName}</span>
                          <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-600">{comment.text}</p>
                      </div>
                    ))}
                    {tc.comments.length === 0 && <p className="text-sm text-slate-400 text-center py-2">댓글이 없습니다.</p>}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCommentUser}
                      onChange={e => setSelectedCommentUser(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold outline-none"
                    >
                      {TEAM_MEMBERS.map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="댓글 입력..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    />
                    <button onClick={handleAddComment} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black">
                      추가
                    </button>
                  </div>
                </div>

                {/* 하단 액션 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        deleteTestCase(tc.id);
                      }
                    }}
                    className="px-4 py-2 text-red-600 text-xs font-bold hover:bg-red-50 rounded-lg"
                  >
                    삭제
                  </button>
                  <div className="text-[10px] text-slate-400">등록일: {tc.date}</div>
                </div>
              </>
            )}

            {/* === 담당자 액션 패널 === */}
            {activePanel === 'developer' && (
              <>
                {/* 현재 상태 카드 */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 rounded-xl text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-80">진행 상태</p>
                      <p className="text-lg font-black">{progressConfig?.label}</p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        tc.progress === 'Waiting'
                          ? 'bg-yellow-400'
                          : tc.progress === 'Working'
                            ? 'bg-orange-400 animate-pulse'
                            : 'bg-green-400'
                      }`}
                    />
                  </div>
                  <div className="text-sm opacity-90">
                    담당: {tc.assignee} | 우선순위: {tc.priority}
                  </div>
                </div>

                {/* 빠른 액션 버튼 */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => updateTestCase(tc.id, { progress: 'Checking' })}
                    disabled={tc.progress !== 'Waiting'}
                    className={`p-3 rounded-xl text-xs font-bold transition-all ${
                      tc.progress === 'Waiting' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    확인
                  </button>
                  <button
                    onClick={() => updateTestCase(tc.id, { progress: 'Working' })}
                    disabled={tc.progress !== 'Checking'}
                    className={`p-3 rounded-xl text-xs font-bold transition-all ${
                      tc.progress === 'Checking' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    작업
                  </button>
                  <button
                    onClick={() => handleDeploy('dev')}
                    disabled={tc.progress !== 'Working'}
                    className={`p-3 rounded-xl text-xs font-bold transition-all ${
                      tc.progress === 'Working' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Dev
                  </button>
                  <button
                    onClick={() => handleDeploy('prod')}
                    disabled={tc.progress !== 'DevDeployed'}
                    className={`p-3 rounded-xl text-xs font-bold transition-all ${
                      tc.progress === 'DevDeployed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Prod
                  </button>
                </div>

                {/* 배포 환경 표시 */}
                {tc.deployedEnvs && tc.deployedEnvs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">배포됨:</span>
                    {tc.deployedEnvs.map(env => (
                      <span
                        key={env}
                        className={`px-2 py-1 rounded text-[10px] font-bold text-white ${
                          env === 'prod' ? 'bg-green-500' : env === 'staging' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                      >
                        {env.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                {/* 반려 버튼 */}
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={tc.status === 'Rejected' || tc.status === 'DevDone' || tc.status === 'ProdDone'}
                  className="w-full p-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이슈 반려하기
                </button>

                {/* 이슈 요약 */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase">이슈 요약</h4>
                  <p className="text-sm font-bold text-slate-900">{tc.scenario}</p>
                  {tc.reproductionSteps && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">재현 방법</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{tc.reproductionSteps}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === QA 검증 패널 === */}
            {activePanel === 'qa' && (
              <>
                {/* 검증 상태 카드 */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-5 rounded-xl text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-80">QA 상태</p>
                      <p className="text-lg font-black">{statusConfig?.label}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-bold">{tc.status}</span>
                  </div>
                  <div className="text-sm opacity-90">
                    보고자: {tc.reporter} | {tc.date}
                  </div>
                </div>

                {/* 검증 액션 */}
                {(tc.progress === 'DevDeployed' || tc.progress === 'ProdDeployed') && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleVerifyPass}
                      className="p-4 rounded-xl bg-green-100 text-green-700 font-bold text-sm hover:bg-green-200 flex flex-col items-center gap-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      통과
                    </button>
                    <button
                      onClick={handleVerifyFail}
                      className="p-4 rounded-xl bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 flex flex-col items-center gap-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      실패
                    </button>
                  </div>
                )}

                {/* 검증 체크리스트 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase">검증 체크리스트</h4>
                    <button onClick={handleAddVerificationItem} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                      + 추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(tc.verificationChecklist || []).map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={e => handleUpdateVerificationItem(item.id, { checked: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => handleUpdateVerificationItem(item.id, { text: e.target.value })}
                          placeholder="검증 항목..."
                          className={`flex-1 bg-transparent text-sm outline-none ${item.checked ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                        />
                        <button onClick={() => handleRemoveVerificationItem(item.id)} className="text-red-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {(!tc.verificationChecklist || tc.verificationChecklist.length === 0) && (
                      <p className="text-sm text-slate-400 text-center py-2">체크리스트가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 활동 타임라인 */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2">활동 내역</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sortedActivityLog.slice(0, 8).map(log => (
                      <div key={log.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            log.action === 'created'
                              ? 'bg-blue-500'
                              : log.action === 'verified'
                                ? 'bg-green-500'
                                : log.action === 'rejected'
                                  ? 'bg-red-500'
                                  : log.action === 'deployed'
                                    ? 'bg-purple-500'
                                    : 'bg-slate-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">
                            {log.action === 'created' && '생성'}
                            {log.action === 'status_changed' && `변경: ${log.details?.fromProgress || log.details?.fromStatus} → ${log.details?.toProgress || log.details?.toStatus}`}
                            {log.action === 'commented' && '댓글'}
                            {log.action === 'verified' && `검증 ${log.details?.toStatus?.includes('Done') ? '✓' : '✗'}`}
                            {log.action === 'rejected' && '반려'}
                            {log.action === 'deployed' && `${log.details?.deployEnv} 배포`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.actor} · {new Date(log.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {sortedActivityLog.length === 0 && <p className="text-sm text-slate-400 text-center py-2">활동 내역이 없습니다.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">이슈 반려</h3>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">반려 사유</label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value as RejectReason)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none"
              >
                {REJECT_REASONS.map(r => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">상세 설명</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="반려 사유 상세 설명..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-100">
                취소
              </button>
              <button onClick={handleReject} className="flex-1 py-3 rounded-xl text-sm font-black bg-red-600 text-white hover:bg-red-700">
                반려
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
