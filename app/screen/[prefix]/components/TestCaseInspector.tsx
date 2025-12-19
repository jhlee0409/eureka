'use client';

import React, { useState } from 'react';
import { TestCase, QAStatus, QAProgress, QAPriority, QAPosition, Comment } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface TestCaseInspectorProps {
  testCase: TestCase;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  onClose: () => void;
}

export function TestCaseInspector({ testCase, updateTestCase, deleteTestCase, onClose }: TestCaseInspectorProps) {
  const [newComment, setNewComment] = useState('');
  const [selectedCommentUser, setSelectedCommentUser] = useState(TEAM_MEMBERS[0]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      userName: selectedCommentUser,
      text: newComment,
      timestamp: new Date().toLocaleString('ko-KR', { hour12: false })
    };
    updateTestCase(testCase.id, { comments: [...testCase.comments, comment] });
    setNewComment('');
  };

  return (
    <div className="absolute inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-slate-300 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] z-50 animate-in slide-in-from-right duration-300 flex flex-col">
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-slate-50">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">상세 인스펙터</h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-300 transition-all">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
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
            <select
              value={testCase.status}
              onChange={e => updateTestCase(testCase.id, { status: e.target.value as QAStatus })}
              className="w-full bg-white px-4 py-3 rounded-2xl text-[11px] font-black border border-slate-300 outline-none shadow-sm"
            >
              <option value="Reviewing">검토중</option>
              <option value="DevError">Dev 오류</option>
              <option value="ProdError">Prod 오류</option>
              <option value="DevDone">Dev 완료</option>
              <option value="ProdDone">Prod 완료</option>
              <option value="Hold">보류</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">진행도 (담당자)</label>
            <select
              value={testCase.progress}
              onChange={e => updateTestCase(testCase.id, { progress: e.target.value as QAProgress })}
              className="w-full bg-white px-4 py-3 rounded-2xl text-[11px] font-black border border-slate-300 outline-none shadow-sm"
            >
              <option value="Waiting">대기</option>
              <option value="Checking">확인</option>
              <option value="Working">작업 중</option>
              <option value="DevDeployed">Dev 배포</option>
              <option value="ProdDeployed">Prod 배포</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">중요도</label>
            <select
              value={testCase.priority}
              onChange={e => updateTestCase(testCase.id, { priority: e.target.value as QAPriority })}
              className={`w-full px-4 py-3 rounded-2xl text-[11px] font-black border outline-none uppercase shadow-sm ${
                testCase.priority === 'High' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-900 border-slate-300'
              }`}
            >
              <option value="High">높음</option>
              <option value="Medium">중간</option>
              <option value="Low">낮음</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">구분</label>
            <select
              value={testCase.position}
              onChange={e => updateTestCase(testCase.id, { position: e.target.value as QAPosition })}
              className="w-full bg-white px-4 py-3 rounded-2xl text-[11px] font-black border border-slate-300 outline-none uppercase shadow-sm"
            >
              {['Front-end', 'Back-end', 'Design', 'PM'].map(pos => <option key={pos}>{pos}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">담당자</label>
            <select
              value={testCase.assignee}
              onChange={e => updateTestCase(testCase.id, { assignee: e.target.value })}
              className="w-full bg-white px-4 py-3 rounded-2xl text-[11px] font-black border border-slate-300 outline-none uppercase shadow-sm"
            >
              {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase block">보고자</label>
            <select
              value={testCase.reporter}
              onChange={e => updateTestCase(testCase.id, { reporter: e.target.value })}
              className="w-full bg-white px-4 py-3 rounded-2xl text-[11px] font-black border border-slate-300 outline-none uppercase shadow-sm"
            >
              {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
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
              <select
                value={selectedCommentUser}
                onChange={e => setSelectedCommentUser(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 outline-none uppercase"
              >
                {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
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
      </div>
    </div>
  );
}
