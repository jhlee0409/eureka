'use client';

import React from 'react';
import { ScreenData } from '../../../types';

interface SpecPanelProps {
  activeScreen: ScreenData | null;
  allScreensCount: number;
  isMasterView: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function SpecPanel({
  activeScreen,
  allScreensCount,
  isMasterView,
  isOpen,
  onToggle
}: SpecPanelProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          <span className="text-xs font-semibold text-slate-700">기획 및 스펙 내용</span>
          {!isOpen && activeScreen?.screenInformation && (
            <span className="text-[10px] text-slate-400 truncate max-w-[300px]">
              — {activeScreen.screenInformation.slice(0, 50)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {isOpen ? '접기' : '펼치기'}
          </span>
          <span className="text-slate-400 text-xs">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-4">
          {isMasterView ? (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                종합 관리 모드입니다. 특정 화면을 선택하면 상세 정보를 확인할 수 있습니다.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 font-medium">
                  총 {allScreensCount}개의 화면이 이 섹션에 포함되어 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Screen Information */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-blue-600">ℹ️</span>
                  <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                    Screen Information
                  </h4>
                </div>
                {activeScreen?.screenInformation ? (
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {activeScreen.screenInformation}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">정보 없음</p>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <span>📄</span>
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Description
                  </h4>
                </div>
                {activeScreen?.description ? (
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {activeScreen.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">설명 없음</p>
                )}
              </div>

              {/* Screen Metadata */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <span>🏷️</span>
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Metadata
                  </h4>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">화면 이름</span>
                    <span className="text-slate-900 font-medium">{activeScreen?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base ID</span>
                    <span className="text-slate-900 font-medium">{activeScreen?.baseId || '-'}</span>
                  </div>
                  {activeScreen?.suffix && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Suffix</span>
                      <span className="text-slate-900 font-medium">{activeScreen.suffix}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
