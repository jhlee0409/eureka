'use client';

import React, { useEffect } from 'react';
import { ScreenData } from '../../../types';

interface SpecDrawerProps {
  activeScreen: ScreenData | null;
  allScreensCount: number;
  isMasterView: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function SpecDrawer({
  activeScreen,
  allScreensCount,
  isMasterView,
  isOpen,
  onClose
}: SpecDrawerProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
            <h2 className="text-sm font-semibold text-slate-800">기획 및 스펙 내용</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {isMasterView ? (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 leading-relaxed">
                종합 관리 모드입니다. 특정 화면을 선택하면 상세 정보를 확인할 수 있습니다.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  총 {allScreensCount}개의 화면이 이 섹션에 포함되어 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Metadata
                </h3>
                <div className="space-y-2 text-xs">
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
                  {activeScreen?.pageName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Page</span>
                      <span className="text-slate-900 font-medium">{activeScreen.pageName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Information */}
              {activeScreen?.screenInformation && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span>ℹ️</span> Screen Information
                  </h3>
                  <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeScreen.screenInformation}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span>📄</span> Description
                </h3>
                {activeScreen?.description ? (
                  <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeScreen.description}
                  </p>
                ) : (
                  <p className="text-[13px] text-slate-400 italic">설명이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 flex items-center justify-center border-t border-slate-200 bg-slate-50 shrink-0">
          <p className="text-[10px] text-slate-400">ESC 또는 바깥 영역 클릭으로 닫기</p>
        </div>
      </div>
    </>
  );
}
