'use client';

import React, { useState } from 'react';
import { TestCase, WbsTask } from '../../../types';
import { ExpandableTestCaseCard } from './ExpandableTestCaseCard';
import { TcAddModal } from './TcAddModal';

interface QaTabProps {
  testCases: TestCase[];
  wbsTasks: WbsTask[];
  isMasterView: boolean;
  qaProgress: number;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  addTestCase: (tc: TestCase) => void;
  originScreenId: string;
}

export function QaTab({
  testCases,
  wbsTasks,
  isMasterView,
  qaProgress,
  getScreenNameById,
  updateTestCase,
  deleteTestCase,
  addTestCase,
  originScreenId
}: QaTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">품질 관리 보드</h2>
          <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">
            {isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : '카드를 클릭하여 상세 정보 확인 및 수정'}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-300">
              <div className="h-full bg-green-600 transition-all duration-700" style={{ width: `${qaProgress}%` }} />
            </div>
            <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">{qaProgress}% 해결됨</span>
          </div>
        </div>
        {!isMasterView && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
          >
            + 이슈 등록
          </button>
        )}
      </div>

      {/* TC Add Modal */}
      <TcAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTestCase}
        wbsTasks={wbsTasks}
        originScreenId={originScreenId}
      />

      {/* TC 카드 목록 - Inline Expandable 패턴 */}
      <div className="space-y-3">
        {testCases.map(tc => (
          <ExpandableTestCaseCard
            key={tc.id}
            tc={tc}
            isMasterView={isMasterView}
            getScreenNameById={getScreenNameById}
            updateTestCase={updateTestCase}
            deleteTestCase={deleteTestCase}
          />
        ))}
        {testCases.length === 0 && (
          <div className="p-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-base font-black text-slate-400 uppercase tracking-widest">등록된 이슈가 없습니다</p>
            {!isMasterView && (
              <p className="text-sm text-slate-400 mt-2">상단의 "이슈 등록" 버튼을 클릭하여 새 이슈를 추가하세요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
