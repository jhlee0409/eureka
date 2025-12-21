'use client';

import React from 'react';
import { TestCase } from '../../../types';

interface TestCaseCardProps {
  tc: TestCase;
  isMasterView: boolean;
  isSelected: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  onSelect: () => void;
}

export function TestCaseCard({ tc, isMasterView, isSelected, getScreenNameById, onSelect }: TestCaseCardProps) {
  return (
    <div
      onClick={() => !isMasterView && onSelect()}
      className={`p-8 rounded-[2.5rem] border-4 transition-all flex items-center justify-between group bg-white ${
        isMasterView
          ? 'border-slate-200 cursor-default'
          : `cursor-pointer ${isSelected ? 'border-slate-900 shadow-2xl' : 'border-slate-200 hover:border-slate-300'}`
      }`}
    >
      <div className="flex items-center gap-6">
        {/* Checkpoint */}
        <div className="w-24 shrink-0 text-center">
          {tc.checkpoint ? (
            <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl text-[10px] font-black">
              {tc.checkpoint}
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 font-bold">-</span>
          )}
        </div>
        <div className={`w-4 h-4 rounded-full shadow-md shrink-0 ${
          tc.priority === 'High' ? 'bg-red-600' : tc.priority === 'Medium' ? 'bg-orange-600' : 'bg-green-600'
        }`} />
        <div>
          {isMasterView && (
            <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide mb-2">
              {getScreenNameById(tc.originScreenId)}
            </span>
          )}
          <p className={`text-lg font-black text-slate-900 tracking-tight leading-none mb-3 ${!isMasterView ? 'group-hover:text-yellow-600' : ''} transition-colors`}>
            {tc.scenario}
          </p>
          <div className="flex items-center gap-5 text-[11px] font-black text-slate-600 uppercase tracking-tight">
            <span className="bg-slate-100 px-3 py-1 rounded-xl">{tc.position}</span>
            <span>{tc.assignee}</span>
            <span className="text-slate-400">{tc.date}</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {tc.comments.length}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* 상태 배지 */}
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide ${
          tc.status === 'DevDone' || tc.status === 'ProdDone' ? 'bg-green-100 text-green-800' :
          tc.status === 'DevError' || tc.status === 'ProdError' ? 'bg-red-100 text-red-800' :
          tc.status === 'Hold' ? 'bg-orange-100 text-orange-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {tc.status === 'Reviewing' ? '검토중' :
           tc.status === 'DevError' ? 'Dev 오류' :
           tc.status === 'ProdError' ? 'Prod 오류' :
           tc.status === 'DevDone' ? 'Dev 완료' :
           tc.status === 'ProdDone' ? 'Prod 완료' :
           tc.status === 'Hold' ? '보류' : tc.status}
        </span>
        {/* 진행도 배지 */}
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide ${
          tc.progress === 'ProdDeployed' ? 'bg-emerald-100 text-emerald-800' :
          tc.progress === 'DevDeployed' ? 'bg-blue-100 text-blue-800' :
          tc.progress === 'Working' ? 'bg-purple-100 text-purple-800' :
          tc.progress === 'Checking' ? 'bg-cyan-100 text-cyan-800' :
          'bg-slate-100 text-slate-600'
        }`}>
          {tc.progress === 'Waiting' ? '대기' :
           tc.progress === 'Checking' ? '확인' :
           tc.progress === 'Working' ? '작업 중' :
           tc.progress === 'DevDeployed' ? 'Dev 배포' :
           tc.progress === 'ProdDeployed' ? 'Prod 배포' : tc.progress}
        </span>
        {!isMasterView && (
          <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
