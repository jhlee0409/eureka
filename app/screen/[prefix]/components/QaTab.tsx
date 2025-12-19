'use client';

import React, { useState, useMemo } from 'react';
import { TestCase } from '../../../types';
import { TestCaseCard } from './TestCaseCard';
import { TestCaseInspector } from './TestCaseInspector';

interface QaTabProps {
  testCases: TestCase[];
  isMasterView: boolean;
  qaProgress: number;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  addTestCase: () => void;
}

export function QaTab({
  testCases,
  isMasterView,
  qaProgress,
  getScreenNameById,
  updateTestCase,
  deleteTestCase,
  addTestCase
}: QaTabProps) {
  const [editingQAId, setEditingQAId] = useState<string | null>(null);

  const editingQA = useMemo(() => testCases.find(t => t.id === editingQAId), [testCases, editingQAId]);

  const handleAddTestCase = () => {
    addTestCase();
    // Get the newly created test case (last one)
    const newId = testCases.length > 0 ? testCases[testCases.length - 1]?.id : null;
    // Note: This won't work correctly as addTestCase is async
    // We need to refactor this if we want auto-open behavior
  };

  return (
    <div className="space-y-10 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">품질 관리 보드</h2>
          <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">
            {isMasterView ? '전체 화면 통합 보기 (읽기 전용)' : ''}
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
            onClick={addTestCase}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
          >
            + 이슈 등록
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {testCases.map(tc => (
          <TestCaseCard
            key={tc.id}
            tc={tc}
            isMasterView={isMasterView}
            isSelected={editingQAId === tc.id}
            getScreenNameById={getScreenNameById}
            onSelect={() => setEditingQAId(tc.id)}
          />
        ))}
        {testCases.length === 0 && (
          <div className="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-300 text-base font-black text-slate-400 uppercase tracking-widest">
            등록된 이슈가 없습니다.
          </div>
        )}
      </div>

      {editingQA && (
        <TestCaseInspector
          testCase={editingQA}
          updateTestCase={updateTestCase}
          deleteTestCase={deleteTestCase}
          onClose={() => setEditingQAId(null)}
        />
      )}
    </div>
  );
}
