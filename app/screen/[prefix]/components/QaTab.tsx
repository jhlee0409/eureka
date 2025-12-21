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
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">품질 관리 보드</h2>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">
            {isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : '카드를 클릭하여 상세 정보 확인 및 수정'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${qaProgress}%` }} />
            </div>
            <span className="text-[10px] font-bold text-green-600">{qaProgress}% 해결됨</span>
          </div>
        </div>
        {!isMasterView && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all"
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
      <div className="space-y-1.5">
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
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-xs font-bold text-slate-400">등록된 이슈가 없습니다</p>
            {!isMasterView && (
              <p className="text-[10px] text-slate-400 mt-1">상단의 "이슈 등록" 버튼을 클릭하여 새 이슈를 추가하세요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
