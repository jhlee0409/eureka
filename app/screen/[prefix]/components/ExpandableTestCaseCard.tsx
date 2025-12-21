'use client';

import React, { useState, useMemo } from 'react';
import { TestCase, QAStatus, QAProgress, QAPriority, Comment, ActivityLog, VerificationItem, RejectReason, DeployEnv, IssueType } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { UserSelect, StatusSelect } from '../../../components/ui';

const REJECT_REASON_OPTIONS = ['not_reproducible', 'working_as_designed', 'duplicate', 'insufficient_info', 'out_of_scope'] as const;

const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; icon: string; color: string }> = {
  bug: { label: '버그', icon: '🐛', color: 'bg-red-100 text-red-700 border-red-200' },
  improvement: { label: '개선', icon: '✨', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  question: { label: '문의', icon: '❓', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  task: { label: '작업', icon: '📋', color: 'bg-green-100 text-green-700 border-green-200' },
};

interface ExpandableTestCaseCardProps {
  tc: TestCase;
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  wbsTasks?: { id: string; name: string }[];
}

const STATUS_OPTIONS: { value: QAStatus; label: string; color: string; bgColor: string }[] = [
  { value: 'Reviewing', label: '검토중', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  { value: 'DevError', label: 'Dev 오류', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'ProdError', label: 'Prod 오류', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'DevDone', label: 'Dev 완료', color: 'text-green-700', bgColor: 'bg-green-100' },
  { value: 'ProdDone', label: 'Prod 완료', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  { value: 'Hold', label: '보류', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  { value: 'Rejected', label: '반려', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { value: 'Duplicate', label: '중복', color: 'text-purple-700', bgColor: 'bg-purple-100' },
];

// 진행 상태 - 순서 기반 인덱스 포함
const PROGRESS_STEPS: { value: QAProgress; label: string; icon: string; color: string; activeColor: string }[] = [
  { value: 'Waiting', label: '대기', icon: '⏳', color: 'bg-slate-200 text-slate-500', activeColor: 'bg-slate-600 text-white' },
  { value: 'Checking', label: '확인', icon: '👀', color: 'bg-cyan-100 text-cyan-600', activeColor: 'bg-cyan-600 text-white' },
  { value: 'Working', label: '작업', icon: '🔧', color: 'bg-purple-100 text-purple-600', activeColor: 'bg-purple-600 text-white' },
  { value: 'DevDeployed', label: 'Dev 배포', icon: '🚀', color: 'bg-blue-100 text-blue-600', activeColor: 'bg-blue-600 text-white' },
  { value: 'ProdDeployed', label: 'Prod 배포', icon: '✅', color: 'bg-emerald-100 text-emerald-600', activeColor: 'bg-emerald-600 text-white' },
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
  wbsTasks = [],
}: ExpandableTestCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'info' | 'developer' | 'qa'>('info');
  const [newComment, setNewComment] = useState('');
  const [selectedCommentUser, setSelectedCommentUser] = useState(TEAM_MEMBERS[0]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectReason>('not_reproducible');
  const [rejectNote, setRejectNote] = useState('');

  const statusConfig = STATUS_OPTIONS.find(s => s.value === tc.status);
  const currentProgressIndex = PROGRESS_STEPS.findIndex(p => p.value === tc.progress);

  // 이슈가 닫힌 상태인지 확인 (완료, 반려, 중복)
  const isClosed = ['DevDone', 'ProdDone', 'Rejected', 'Duplicate'].includes(tc.status);

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

  // 진행 상태 변경 (비순차적 허용)
  const handleProgressStep = (newProgress: QAProgress) => {
    if (isMasterView || isClosed) return;

    const newIndex = PROGRESS_STEPS.findIndex(p => p.value === newProgress);

    // 배포 환경 업데이트
    let newDeployedEnvs = tc.deployedEnvs || [];
    if (newProgress === 'DevDeployed' && !newDeployedEnvs.includes('dev')) {
      newDeployedEnvs = [...newDeployedEnvs, 'dev'];
    } else if (newProgress === 'ProdDeployed' && !newDeployedEnvs.includes('prod')) {
      newDeployedEnvs = [...newDeployedEnvs, 'prod'];
    }

    // 뒤로 가는 경우 배포 환경 제거
    if (newIndex < currentProgressIndex) {
      if (newIndex < 3) newDeployedEnvs = newDeployedEnvs.filter(e => e !== 'dev');
      if (newIndex < 4) newDeployedEnvs = newDeployedEnvs.filter(e => e !== 'prod');
    }

    addActivityLog('status_changed', { fromProgress: tc.progress, toProgress: newProgress });
    updateTestCase(tc.id, {
      progress: newProgress,
      deployedEnvs: newDeployedEnvs.length > 0 ? newDeployedEnvs : undefined,
    });
  };

  // 반려 처리
  const handleReject = () => {
    updateTestCase(tc.id, {
      status: 'Rejected',
      rejectReason,
    });
    addActivityLog('rejected', { rejectReason });

    // 반려 코멘트 자동 추가
    const rejectComment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: `[반려] ${REJECT_REASONS.find(r => r.key === rejectReason)?.label}${rejectNote ? `: ${rejectNote}` : ''}`,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
    };
    updateTestCase(tc.id, { comments: [...tc.comments, rejectComment] });

    setShowRejectModal(false);
    setRejectNote('');
  };

  // 재오픈 처리
  const handleReopen = () => {
    addActivityLog('status_changed', { fromStatus: tc.status, toStatus: 'Reviewing' });
    updateTestCase(tc.id, {
      status: 'Reviewing',
      progress: 'Waiting',
      rejectReason: undefined,
    });

    // 재오픈 코멘트 자동 추가
    const reopenComment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: '[재오픈] 이슈가 다시 열렸습니다.',
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
    };
    updateTestCase(tc.id, { comments: [...tc.comments, reopenComment] });
  };

  // QA 검증
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
      className={`rounded-lg border transition-all bg-white overflow-hidden ${
        isExpanded ? 'border-slate-400 shadow-md' : isClosed ? 'border-slate-100 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ===== 접힌 상태 (Collapsed Header) ===== */}
      <div
        onClick={() => !isMasterView && setIsExpanded(!isExpanded)}
        className={`px-3 py-2 flex items-center gap-2.5 ${!isMasterView ? 'cursor-pointer hover:bg-slate-50' : ''} ${isClosed ? 'opacity-60' : ''}`}
      >
        {/* 확장 아이콘 */}
        {!isMasterView && (
          <button className="shrink-0">
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
          className={`w-2 h-2 rounded-full shrink-0 ${
            tc.priority === 'High' ? 'bg-red-500' : tc.priority === 'Medium' ? 'bg-orange-400' : 'bg-green-500'
          }`}
          title={tc.priority}
        />

        {/* 이슈 타입 */}
        {tc.issueType && ISSUE_TYPE_CONFIG[tc.issueType] && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${ISSUE_TYPE_CONFIG[tc.issueType].color}`}>
            {ISSUE_TYPE_CONFIG[tc.issueType].icon} {ISSUE_TYPE_CONFIG[tc.issueType].label}
          </span>
        )}

        {/* 체크포인트 */}
        <div className="w-16 shrink-0">
          {tc.checkpoint ? (
            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded truncate block">
              {tc.checkpoint}
            </span>
          ) : (
            <span className="text-[9px] text-slate-300">-</span>
          )}
        </div>

        {/* 시나리오 (핵심) */}
        <div className="flex-1 min-w-0">
          {isMasterView && (
            <span className="text-[8px] font-bold text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded mr-1.5">
              {getScreenNameById(tc.originScreenId)}
            </span>
          )}
          <p className={`text-xs font-medium truncate ${isClosed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {tc.scenario}
          </p>
        </div>

        {/* 포지션 */}
        <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
          {tc.position}
        </span>

        {/* 담당자 (빠른 변경) */}
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          {isMasterView ? (
            <span className="text-[10px] font-medium text-slate-600">{tc.assignee}</span>
          ) : (
            <UserSelect
              value={tc.assignee}
              onChange={(v) => {
                updateTestCase(tc.id, { assignee: v });
                addActivityLog('assigned');
              }}
              options={TEAM_MEMBERS}
              size="xs"
            />
          )}
        </div>

        {/* 상태 드롭다운 */}
        <div className="shrink-0 relative group" onClick={e => e.stopPropagation()}>
          <button
            className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusConfig?.bgColor} ${statusConfig?.color}`}
          >
            {statusConfig?.label || tc.status}
          </button>
          {!isMasterView && (
            <div className="absolute right-0 top-full mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg z-20 hidden group-hover:block min-w-[100px]">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={e => handleStatusChange(e, opt.value)}
                  className={`w-full px-2 py-1 text-left text-[9px] font-medium hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    tc.status === opt.value ? 'bg-slate-100' : ''
                  }`}
                >
                  <span className={`inline-block px-1.5 py-0.5 rounded ${opt.bgColor} ${opt.color}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 진행도 미니 표시 */}
        <div className="shrink-0 flex items-center gap-0.5">
          {PROGRESS_STEPS.map((step, idx) => (
            <div
              key={step.value}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx <= currentProgressIndex ? 'bg-blue-500' : 'bg-slate-200'
              }`}
              title={step.label}
            />
          ))}
        </div>

        {/* 댓글 수 */}
        <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span className="text-[10px] font-medium">{tc.comments.length}</span>
        </div>
      </div>

      {/* ===== 펼친 상태 (Expanded Content) ===== */}
      {isExpanded && !isMasterView && (
        <div className="border-t border-slate-100">
          {/* 닫힌 이슈 알림 배너 */}
          {isClosed && (
            <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                  {statusConfig?.label}
                </span>
                <span className="text-[10px] text-slate-500">
                  {tc.status === 'Rejected' && tc.rejectReason && `사유: ${REJECT_REASONS.find(r => r.key === tc.rejectReason)?.label}`}
                </span>
              </div>
              <button
                onClick={handleReopen}
                className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-all"
              >
                🔄 재오픈
              </button>
            </div>
          )}

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActivePanel('info')}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all ${
                activePanel === 'info' ? 'bg-white text-slate-800 border-b-2 border-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              상세 정보
            </button>
            <button
              onClick={() => setActivePanel('developer')}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all ${
                activePanel === 'developer' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              담당자 액션
            </button>
            <button
              onClick={() => setActivePanel('qa')}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all ${
                activePanel === 'qa' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              QA 검증
            </button>
          </div>

          {/* 패널 콘텐츠 */}
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {/* === 상세 정보 패널 === */}
            {activePanel === 'info' && (
              <>
                {/* 기본 정보 그리드 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">체크포인트</label>
                    <input
                      value={tc.checkpoint || ''}
                      onChange={e => updateTestCase(tc.id, { checkpoint: e.target.value })}
                      placeholder="예: 로그인 버튼"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs font-medium outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">보고자</label>
                    <p className="px-2 py-1.5 bg-slate-50 rounded text-xs font-medium text-slate-600">{tc.reporter}</p>
                  </div>
                </div>

                {/* 시나리오 */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">시나리오</label>
                  <textarea
                    value={tc.scenario}
                    onChange={e => updateTestCase(tc.id, { scenario: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs font-medium outline-none focus:border-slate-400 resize-none"
                  />
                </div>

                {/* 상세 내용 */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">상세 내용</label>
                  <textarea
                    value={tc.issueContent}
                    onChange={e => updateTestCase(tc.id, { issueContent: e.target.value })}
                    rows={2}
                    placeholder="이슈에 대한 상세 설명..."
                    className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
                  />
                </div>

                {/* 재현 방법 & 기대 결과 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">재현 방법</label>
                    <textarea
                      value={tc.reproductionSteps || ''}
                      onChange={e => updateTestCase(tc.id, { reproductionSteps: e.target.value })}
                      rows={2}
                      placeholder="1. 첫 번째 단계"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">기대 결과</label>
                    <textarea
                      value={tc.expectedResult || ''}
                      onChange={e => updateTestCase(tc.id, { expectedResult: e.target.value })}
                      rows={2}
                      placeholder="예상되는 정상 동작..."
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none"
                    />
                  </div>
                </div>

                {/* 발생 환경 */}
                {tc.environment && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">📱 발생 환경</label>
                    <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{tc.environment}</pre>
                  </div>
                )}

                {/* 관련 WBS */}
                {tc.relatedWbsId && (
                  <div className="bg-blue-50 p-2.5 rounded border border-blue-200">
                    <label className="text-[9px] font-bold text-blue-600 uppercase block mb-1">📋 관련 WBS</label>
                    <p className="text-[11px] font-medium text-blue-800">
                      {wbsTasks.find(w => w.id === tc.relatedWbsId)?.name || tc.relatedWbsId}
                    </p>
                  </div>
                )}

                {/* 댓글 섹션 */}
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase mb-2">댓글 ({tc.comments.length})</h4>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto mb-2">
                    {tc.comments.map(comment => (
                      <div key={comment.id} className={`p-2 rounded ${comment.text.startsWith('[') ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-700">{comment.userName}</span>
                          <span className="text-[9px] text-slate-400">{comment.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{comment.text}</p>
                      </div>
                    ))}
                    {tc.comments.length === 0 && <p className="text-[10px] text-slate-400 text-center py-1">댓글이 없습니다.</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <UserSelect
                      value={selectedCommentUser}
                      onChange={setSelectedCommentUser}
                      options={TEAM_MEMBERS}
                      size="xs"
                    />
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="댓글 입력..."
                      className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs outline-none focus:border-slate-400"
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    />
                    <button onClick={handleAddComment} className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-900">
                      추가
                    </button>
                  </div>
                </div>

                {/* 하단 액션 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        deleteTestCase(tc.id);
                      }
                    }}
                    className="px-2 py-1 text-red-500 text-[10px] font-bold hover:bg-red-50 rounded"
                  >
                    삭제
                  </button>
                  <div className="text-[9px] text-slate-400">등록일: {tc.date}</div>
                </div>
              </>
            )}

            {/* === 담당자 액션 패널 === */}
            {activePanel === 'developer' && (
              <>
                {/* 진행 상태 워크플로우 - 비순차적 선택 가능 */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    진행 상태
                    {isClosed && <span className="text-[9px] font-normal text-slate-400">(재오픈 후 변경 가능)</span>}
                  </h3>

                  {/* 워크플로우 시각화 */}
                  <div className="relative">
                    {/* 연결선 */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 rounded-full" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(currentProgressIndex / (PROGRESS_STEPS.length - 1)) * 100}%` }}
                    />

                    {/* 단계 버튼들 */}
                    <div className="relative flex justify-between">
                      {PROGRESS_STEPS.map((step, idx) => {
                        const isActive = idx === currentProgressIndex;
                        const isPast = idx < currentProgressIndex;

                        return (
                          <button
                            key={step.value}
                            onClick={() => handleProgressStep(step.value)}
                            disabled={isClosed}
                            className={`flex flex-col items-center gap-1 transition-all ${isClosed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                                isActive
                                  ? step.activeColor + ' ring-2 ring-blue-200 scale-110'
                                  : isPast
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-slate-200 text-slate-400'
                              }`}
                            >
                              {step.icon}
                            </div>
                            <span className={`text-[8px] font-bold ${isActive ? 'text-blue-600' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
                              {step.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 현재 상태 표시 */}
                  <div className="bg-blue-50 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-blue-600 font-bold uppercase">현재 진행</p>
                      <p className="text-sm font-bold text-blue-800">{PROGRESS_STEPS[currentProgressIndex]?.label}</p>
                    </div>
                    <div className="text-right text-[9px] text-slate-500">
                      <p>담당: {tc.assignee}</p>
                      <p>우선순위: {tc.priority}</p>
                    </div>
                  </div>
                </div>

                {/* 배포 환경 표시 */}
                {tc.deployedEnvs && tc.deployedEnvs.length > 0 && (
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">배포됨:</span>
                    {['dev', 'staging', 'prod'].map(env => (
                      <span
                        key={env}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                          tc.deployedEnvs?.includes(env as DeployEnv)
                            ? env === 'prod' ? 'bg-green-500 text-white' : env === 'staging' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {env.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                {/* 반려 / 보류 액션 */}
                {!isClosed && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateTestCase(tc.id, { status: 'Hold' })}
                      className="p-2 rounded-lg border border-orange-200 text-orange-600 font-bold text-[10px] hover:bg-orange-50 transition-all"
                    >
                      ⏸️ 보류
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 font-bold text-[10px] hover:bg-red-50 transition-all"
                    >
                      ❌ 반려
                    </button>
                  </div>
                )}

                {/* 이슈 요약 */}
                <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase">이슈 요약</h4>
                  <p className="text-xs font-medium text-slate-800">{tc.scenario}</p>
                  {tc.reproductionSteps && (
                    <div>
                      <p className="text-[9px] font-bold text-slate-400">재현 방법</p>
                      <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{tc.reproductionSteps}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === QA 검증 패널 === */}
            {activePanel === 'qa' && (
              <>
                {/* 검증 상태 카드 */}
                <div className="bg-purple-600 p-3 rounded-lg text-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide opacity-80">QA 상태</p>
                      <p className="text-sm font-bold">{statusConfig?.label}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-bold">{tc.status}</span>
                  </div>
                  <div className="text-[10px] opacity-80">
                    보고자: {tc.reporter} | {tc.date}
                  </div>
                </div>

                {/* 검증 액션 - 배포 후에만 표시 */}
                {(tc.progress === 'DevDeployed' || tc.progress === 'ProdDeployed') && !isClosed && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-700 uppercase">
                      {tc.deployedEnvs?.includes('prod') ? 'Prod' : 'Dev'} 검증
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleVerifyPass}
                        className="p-2.5 rounded-lg bg-green-100 text-green-700 font-bold text-xs hover:bg-green-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        통과
                      </button>
                      <button
                        onClick={handleVerifyFail}
                        className="p-2.5 rounded-lg bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        실패
                      </button>
                    </div>
                  </div>
                )}

                {/* 배포 대기 메시지 */}
                {tc.progress !== 'DevDeployed' && tc.progress !== 'ProdDeployed' && !isClosed && (
                  <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-[11px] font-bold text-yellow-700">⏳ 배포 후 검증 가능</p>
                    <p className="text-[10px] text-yellow-600">현재: {PROGRESS_STEPS[currentProgressIndex]?.label}</p>
                  </div>
                )}

                {/* 검증 체크리스트 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase">검증 체크리스트</h4>
                    <button onClick={handleAddVerificationItem} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                      + 추가
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(tc.verificationChecklist || []).map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={e => handleUpdateVerificationItem(item.id, { checked: e.target.checked })}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => handleUpdateVerificationItem(item.id, { text: e.target.value })}
                          placeholder="검증 항목..."
                          className={`flex-1 bg-transparent text-[11px] outline-none ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                        />
                        <button onClick={() => handleRemoveVerificationItem(item.id)} className="text-red-400 hover:text-red-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {(!tc.verificationChecklist || tc.verificationChecklist.length === 0) && (
                      <p className="text-[10px] text-slate-400 text-center py-1">체크리스트가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 활동 타임라인 */}
                <div>
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">활동 내역</h4>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {sortedActivityLog.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded">
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
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
                          <p className="text-[10px] font-medium text-slate-700 truncate">
                            {log.action === 'created' && '생성'}
                            {log.action === 'status_changed' && `변경: ${log.details?.fromProgress || log.details?.fromStatus} → ${log.details?.toProgress || log.details?.toStatus}`}
                            {log.action === 'assigned' && '담당자 변경'}
                            {log.action === 'commented' && '댓글'}
                            {log.action === 'verified' && `검증 ${log.details?.toStatus?.includes('Done') ? '✓' : '✗'}`}
                            {log.action === 'rejected' && '반려'}
                            {log.action === 'deployed' && `${log.details?.deployEnv} 배포`}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {log.actor} · {new Date(log.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {sortedActivityLog.length === 0 && <p className="text-[10px] text-slate-400 text-center py-1">활동 내역이 없습니다.</p>}
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
          <div className="bg-white rounded-xl p-4 w-80 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900">이슈 반려</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">반려 사유</label>
              <StatusSelect
                value={rejectReason}
                onChange={(v) => setRejectReason(v as RejectReason)}
                options={REJECT_REASON_OPTIONS}
                size="sm"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">상세 설명 (선택)</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="추가 설명이 필요하다면 입력하세요..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
