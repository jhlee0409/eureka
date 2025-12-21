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
        <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
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
            <div className="space-y-3">
              {/* Metadata - Compact Row */}
              <div className="flex items-center gap-4 text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">화면:</span>
                  <span className="font-medium text-slate-900">{activeScreen?.name || '-'}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Base ID:</span>
                  <span className="font-medium text-slate-900">{activeScreen?.baseId || '-'}</span>
                </div>
                {activeScreen?.suffix && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Suffix:</span>
                      <span className="font-medium text-slate-900">{activeScreen.suffix}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Screen Information - Full Content */}
              {activeScreen?.screenInformation && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">ℹ️</span>
                    <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                      Screen Information
                    </h4>
                  </div>
                  <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeScreen.screenInformation}
                  </p>
                </div>
              )}

              {/* Description - Full Content */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">📄</span>
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Description
                  </h4>
                </div>
                {activeScreen?.description ? (
                  <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeScreen.description}
                  </p>
                ) : (
                  <p className="text-[12px] text-slate-400 italic">설명이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
