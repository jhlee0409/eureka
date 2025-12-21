'use client';

import React, { useState, useMemo } from 'react';
import { TestCase, QAStatus, QAProgress, QAPriority, QAPosition, Comment, ActivityLog, VerificationItem, RejectReason, DeployEnv } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { StatusSelect, UserSelect } from '../../../components/ui';

const QA_STATUS_OPTIONS = ['Reviewing', 'DevError', 'ProdError', 'DevDone', 'ProdDone', 'Hold', 'Rejected', 'Duplicate'] as const;
const QA_PROGRESS_OPTIONS = ['Waiting', 'Checking', 'Working', 'DevDeployed', 'ProdDeployed'] as const;
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const POSITION_OPTIONS = ['Front-end', 'Back-end', 'Design', 'PM'] as const;

interface TestCaseInspectorProps {
  testCase: TestCase;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  onClose: () => void;
  currentUser?: string;
  userRole?: 'developer' | 'qa';
  wbsTasks?: { id: string; name: string }[];
}

const REJECT_REASONS: { key: RejectReason; label: string }[] = [
  { key: 'not_reproducible', label: '재현 불가' },
  { key: 'working_as_designed', label: '설계대로 작동' },
  { key: 'duplicate', label: '중복 이슈' },
  { key: 'insufficient_info', label: '정보 부족' },
  { key: 'out_of_scope', label: '범위 외' },
];

const DEPLOY_ENVS: { key: DeployEnv; label: string; color: string }[] = [
  { key: 'dev', label: 'Dev', color: 'bg-blue-500' },
  { key: 'staging', label: 'Staging', color: 'bg-yellow-500' },
  { key: 'prod', label: 'Prod', color: 'bg-green-500' },
];

export function TestCaseInspector({
  testCase,
  updateTestCase,
  deleteTestCase,
  onClose,
  currentUser = TEAM_MEMBERS[0],
  userRole = 'developer',
  wbsTasks = [],
}: TestCaseInspectorProps) {
  const [newComment, setNewComment] = useState('');
  const [selectedCommentUser, setSelectedCommentUser] = useState(currentUser);
  const [activePanel, setActivePanel] = useState<'info' | 'developer' | 'qa'>('info');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectReason>('not_reproducible');
  const [rejectNote, setRejectNote] = useState('');

  const addActivityLog = (action: ActivityLog['action'], details?: ActivityLog['details']) => {
    const log: ActivityLog = {
      id: crypto.randomUUID(),
      tcId: testCase.id,
      action,
      actor: selectedCommentUser,
      actorRole: userRole,
      timestamp: new Date().toISOString(),
      details,
    };
    const existingLogs = testCase.activityLog || [];
    updateTestCase(testCase.id, { activityLog: [...existingLogs, log] });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: newComment,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false })
    };
    updateTestCase(testCase.id, { comments: [...testCase.comments, comment] });
    addActivityLog('commented', { comment: newComment });
    setNewComment('');
  };

  // Developer Actions
  const handleAcceptIssue = () => {
    updateTestCase(testCase.id, { progress: 'Checking' });
    addActivityLog('status_changed', { fromProgress: testCase.progress, toProgress: 'Checking' });
  };

  const handleStartWorking = () => {
    updateTestCase(testCase.id, { progress: 'Working' });
    addActivityLog('status_changed', { fromProgress: testCase.progress, toProgress: 'Working' });
  };

  const handleDeployToDev = () => {
    const envs = testCase.deployedEnvs || [];
    if (!envs.includes('dev')) {
      updateTestCase(testCase.id, {
        progress: 'DevDeployed',
        deployedEnvs: [...envs, 'dev']
      });
      addActivityLog('deployed', { deployEnv: 'dev' });
    }
  };

  const handleDeployToProd = () => {
    const envs = testCase.deployedEnvs || [];
    if (!envs.includes('prod')) {
      updateTestCase(testCase.id, {
        progress: 'ProdDeployed',
        deployedEnvs: [...envs, 'prod']
      });
      addActivityLog('deployed', { deployEnv: 'prod' });
    }
  };

  const handleReject = () => {
    updateTestCase(testCase.id, {
      status: 'Rejected',
      rejectReason,
      issueContent: testCase.issueContent + `\n\n[반려 사유] ${REJECT_REASONS.find(r => r.key === rejectReason)?.label}: ${rejectNote}`
    });
    addActivityLog('rejected', { rejectReason });
    setShowRejectModal(false);
    setRejectNote('');
  };

  // QA Actions
  const handleVerifyPass = () => {
    const env = testCase.deployedEnvs?.includes('prod') ? 'Prod' : 'Dev';
    const newStatus = env === 'Prod' ? 'ProdDone' : 'DevDone';
    updateTestCase(testCase.id, { status: newStatus });
    addActivityLog('verified', { toStatus: newStatus, deployEnv: env.toLowerCase() as DeployEnv });
  };

  const handleVerifyFail = () => {
    const env = testCase.deployedEnvs?.includes('prod') ? 'Prod' : 'Dev';
    const newStatus = env === 'Prod' ? 'ProdError' : 'DevError';
    updateTestCase(testCase.id, {
      status: newStatus,
      progress: 'Waiting'
    });
    addActivityLog('verified', { toStatus: newStatus, deployEnv: env.toLowerCase() as DeployEnv });
  };

  const handleAddVerificationItem = () => {
    const items = testCase.verificationChecklist || [];
    const newItem: VerificationItem = {
      id: crypto.randomUUID(),
      text: '',
      checked: false,
    };
    updateTestCase(testCase.id, { verificationChecklist: [...items, newItem] });
  };

  const handleUpdateVerificationItem = (itemId: string, updates: Partial<VerificationItem>) => {
    const items = testCase.verificationChecklist || [];
    updateTestCase(testCase.id, {
      verificationChecklist: items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const handleRemoveVerificationItem = (itemId: string) => {
    const items = testCase.verificationChecklist || [];
    updateTestCase(testCase.id, {
      verificationChecklist: items.filter(item => item.id !== itemId)
    });
  };

  // Activity log sorted by time
  const sortedActivityLog = useMemo(() => {
    return [...(testCase.activityLog || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [testCase.activityLog]);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-slate-300 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] z-50 animate-in slide-in-from-right duration-300 flex flex-col">
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-slate-50">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">상세 인스펙터</h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-300 transition-all">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActivePanel('info')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activePanel === 'info' ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          기본 정보
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
        {/* Info Panel */}
        {activePanel === 'info' && (
          <>
        {/* 체크포인트 */}
        <div className="space-y-3 bg-purple-50 p-6 rounded-[2rem] border border-purple-200">
          <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest block">체크포인트 (탭 내 위치)</label>
          <input
            value={testCase.checkpoint || ''}
            onChange={e => updateTestCase(testCase.id, { checkpoint: e.target.value })}
            placeholder="예: 로그인 버튼, 결제 폼, 헤더 메뉴..."
            className="w-full text-lg font-black text-slate-900 outline-none bg-white px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">이슈 요약</label>
          <input
            value={testCase.scenario}
            onChange={e => updateTestCase(testCase.id, { scenario: e.target.value })}
            className="w-full text-2xl font-black text-slate-900 outline-none focus:text-slate-900 transition-colors bg-transparent border-none p-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">상태 (TC)</label>
            <StatusSelect
              value={testCase.status}
              onChange={(v) => updateTestCase(testCase.id, { status: v as QAStatus })}
              options={QA_STATUS_OPTIONS}
              size="md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">진행도 (담당자)</label>
            <StatusSelect
              value={testCase.progress}
              onChange={(v) => updateTestCase(testCase.id, { progress: v as QAProgress })}
              options={QA_PROGRESS_OPTIONS}
              size="md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">중요도</label>
            <StatusSelect
              value={testCase.priority}
              onChange={(v) => updateTestCase(testCase.id, { priority: v as QAPriority })}
              options={PRIORITY_OPTIONS}
              size="md"
              variant="badge"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">구분</label>
            <StatusSelect
              value={testCase.position}
              onChange={(v) => updateTestCase(testCase.id, { position: v as QAPosition })}
              options={POSITION_OPTIONS}
              size="md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">담당자</label>
            <UserSelect
              value={testCase.assignee}
              onChange={(v) => updateTestCase(testCase.id, { assignee: v })}
              options={TEAM_MEMBERS}
              size="md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">보고자</label>
            <UserSelect
              value={testCase.reporter}
              onChange={(v) => updateTestCase(testCase.id, { reporter: v })}
              options={TEAM_MEMBERS}
              size="md"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">등록일</label>
            <div className="w-full bg-slate-200 px-4 py-3 rounded-2xl text-[11px] font-black text-slate-600 border border-slate-300">
              {testCase.date}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">상세 내용 및 원인</label>
          <textarea
            value={testCase.issueContent}
            onChange={e => updateTestCase(testCase.id, { issueContent: e.target.value })}
            className="w-full bg-slate-50 p-6 rounded-[2rem] text-sm font-bold leading-relaxed text-slate-900 outline-none focus:bg-white border-2 border-transparent focus:border-slate-900 min-h-[150px] shadow-inner"
            placeholder="결함 원인 또는 기획 요구사항을 상세히 작성하세요..."
          />
        </div>

        {/* 참조 링크 */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            참조 링크
          </label>
          <input
            value={testCase.referenceLink || ''}
            onChange={e => updateTestCase(testCase.id, { referenceLink: e.target.value })}
            placeholder="https://..."
            className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white border-2 border-transparent focus:border-slate-900"
          />
          {testCase.referenceLink && (
            <a
              href={testCase.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[11px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              링크 열기
            </a>
          )}
        </div>

        {/* 관련 WBS */}
        {testCase.relatedWbsId && (
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              관련 WBS
            </label>
            <div className="bg-blue-50 px-6 py-4 rounded-2xl border-2 border-blue-200">
              <p className="text-sm font-black text-blue-800">
                {wbsTasks.find(w => w.id === testCase.relatedWbsId)?.name || testCase.relatedWbsId}
              </p>
            </div>
          </div>
        )}

        <div className="pt-10 border-t border-slate-200 space-y-8">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            활동 로그
          </h4>

          <div className="space-y-6">
            {testCase.comments.map(c => (
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
                size="sm"
              />
            </div>
            <div className="flex gap-4">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="진행 상황을 입력하세요..."
                className="flex-1 bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-slate-200 focus:border-slate-900 transition-all text-slate-900"
              />
              <button onClick={handleAddComment} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 flex justify-between items-center">
          <button
            onClick={() => {
              deleteTestCase(testCase.id);
              onClose();
            }}
            className="text-[11px] font-black text-red-600 hover:text-red-800 uppercase tracking-widest transition-colors"
          >
            기록 삭제
          </button>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-400"
          >
            변경사항 저장
          </button>
        </div>
          </>
        )}

        {/* Developer Action Panel */}
        {activePanel === 'developer' && (
          <>
            {/* Current Status */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">현재 진행 상태</p>
                  <p className="text-xl font-black">
                    {testCase.progress === 'Waiting' ? '대기 중' :
                     testCase.progress === 'Checking' ? '확인 중' :
                     testCase.progress === 'Working' ? '작업 중' :
                     testCase.progress === 'DevDeployed' ? 'Dev 배포 완료' : 'Prod 배포 완료'}
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full ${
                  testCase.progress === 'Waiting' ? 'bg-yellow-400' :
                  testCase.progress === 'Working' ? 'bg-orange-400 animate-pulse' :
                  testCase.progress === 'DevDeployed' || testCase.progress === 'ProdDeployed' ? 'bg-green-400' :
                  'bg-blue-400'
                }`} />
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>담당: {testCase.assignee}</span>
                <span>|</span>
                <span>우선순위: {testCase.priority}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">빠른 액션</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAcceptIssue}
                  disabled={testCase.progress !== 'Waiting'}
                  className={`p-4 rounded-xl text-sm font-black transition-all ${
                    testCase.progress === 'Waiting'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  이슈 확인
                </button>
                <button
                  onClick={handleStartWorking}
                  disabled={testCase.progress !== 'Checking'}
                  className={`p-4 rounded-xl text-sm font-black transition-all ${
                    testCase.progress === 'Checking'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  작업 시작
                </button>
                <button
                  onClick={handleDeployToDev}
                  disabled={testCase.progress !== 'Working'}
                  className={`p-4 rounded-xl text-sm font-black transition-all ${
                    testCase.progress === 'Working'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Dev 배포
                </button>
                <button
                  onClick={handleDeployToProd}
                  disabled={testCase.progress !== 'DevDeployed'}
                  className={`p-4 rounded-xl text-sm font-black transition-all ${
                    testCase.progress === 'DevDeployed'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Prod 배포
                </button>
              </div>
            </div>

            {/* Reject Issue */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">이슈 반려</h3>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={testCase.status === 'Rejected' || testCase.status === 'DevDone' || testCase.status === 'ProdDone'}
                className="w-full p-4 rounded-xl border-2 border-red-200 text-red-600 font-black text-sm hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이슈 반려하기
              </button>
            </div>

            {/* Deployed Environments */}
            {testCase.deployedEnvs && testCase.deployedEnvs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">배포된 환경</h3>
                <div className="flex gap-2">
                  {DEPLOY_ENVS.map(env => (
                    <div
                      key={env.key}
                      className={`px-4 py-2 rounded-xl text-sm font-black ${
                        testCase.deployedEnvs?.includes(env.key)
                          ? `${env.color} text-white`
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {env.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue Details */}
            <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">이슈 상세</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">요약</p>
                  <p className="text-sm font-bold text-slate-900">{testCase.scenario}</p>
                </div>
                {testCase.reproductionSteps && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">재현 방법</p>
                    <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{testCase.reproductionSteps}</p>
                  </div>
                )}
                {testCase.expectedResult && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">기대 결과</p>
                    <p className="text-sm font-bold text-slate-700">{testCase.expectedResult}</p>
                  </div>
                )}
                {testCase.environment && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">환경</p>
                    <p className="text-sm font-bold text-slate-700">{testCase.environment}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* QA Verification Panel */}
        {activePanel === 'qa' && (
          <>
            {/* Verification Status */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">QA 검증 상태</p>
                  <p className="text-xl font-black">
                    {testCase.status === 'Reviewing' ? '검토 대기' :
                     testCase.status === 'DevError' ? 'Dev 오류 확인' :
                     testCase.status === 'ProdError' ? 'Prod 오류 확인' :
                     testCase.status === 'DevDone' ? 'Dev 검증 완료' :
                     testCase.status === 'ProdDone' ? 'Prod 검증 완료' :
                     testCase.status === 'Rejected' ? '반려됨' : '보류'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                  testCase.status === 'DevDone' || testCase.status === 'ProdDone' ? 'bg-green-400/30' :
                  testCase.status === 'DevError' || testCase.status === 'ProdError' ? 'bg-red-400/30' :
                  'bg-white/20'
                }`}>
                  {testCase.status}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>보고자: {testCase.reporter}</span>
                <span>|</span>
                <span>{testCase.date}</span>
              </div>
            </div>

            {/* Verification Actions */}
            {(testCase.progress === 'DevDeployed' || testCase.progress === 'ProdDeployed') && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">검증 결과</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleVerifyPass}
                    className="p-5 rounded-xl bg-green-100 text-green-700 font-black text-sm hover:bg-green-200 transition-all flex flex-col items-center gap-2"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    검증 통과
                  </button>
                  <button
                    onClick={handleVerifyFail}
                    className="p-5 rounded-xl bg-red-100 text-red-700 font-black text-sm hover:bg-red-200 transition-all flex flex-col items-center gap-2"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    검증 실패
                  </button>
                </div>
              </div>
            )}

            {/* Verification Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">검증 체크리스트</h3>
                <button
                  onClick={handleAddVerificationItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + 항목 추가
                </button>
              </div>
              <div className="space-y-2">
                {(testCase.verificationChecklist || []).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleUpdateVerificationItem(item.id, { checked: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateVerificationItem(item.id, { text: e.target.value })}
                      placeholder="검증 항목 입력..."
                      className={`flex-1 bg-transparent text-sm font-bold outline-none ${
                        item.checked ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    />
                    <button
                      onClick={() => handleRemoveVerificationItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {(!testCase.verificationChecklist || testCase.verificationChecklist.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-4">검증 항목이 없습니다.</p>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">활동 타임라인</h3>
              <div className="space-y-3">
                {sortedActivityLog.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      log.action === 'created' ? 'bg-blue-500' :
                      log.action === 'verified' ? 'bg-green-500' :
                      log.action === 'rejected' ? 'bg-red-500' :
                      log.action === 'deployed' ? 'bg-purple-500' :
                      'bg-slate-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {log.action === 'created' && '이슈 생성됨'}
                        {log.action === 'status_changed' && `진행 변경: ${log.details?.fromProgress || log.details?.fromStatus} → ${log.details?.toProgress || log.details?.toStatus}`}
                        {log.action === 'assigned' && `담당자 변경`}
                        {log.action === 'commented' && '댓글 추가됨'}
                        {log.action === 'verified' && `검증 ${log.details?.toStatus?.includes('Done') ? '통과' : '실패'}`}
                        {log.action === 'rejected' && '이슈 반려됨'}
                        {log.action === 'deployed' && `${log.details?.deployEnv} 배포 완료`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {log.actor} · {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
                {sortedActivityLog.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">활동 내역이 없습니다.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4">
            <h3 className="text-lg font-black text-slate-900">이슈 반려</h3>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">반려 사유</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value as RejectReason)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none"
              >
                {REJECT_REASONS.map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">상세 설명</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="반려 사유를 상세히 설명해주세요..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 rounded-xl text-sm font-black bg-red-600 text-white hover:bg-red-700"
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
