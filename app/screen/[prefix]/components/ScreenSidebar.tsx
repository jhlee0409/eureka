'use client';

import React from 'react';
import { ScreenData, CoverData } from '../../../types';
import { CoverThumbnail } from '../../../components/CoverThumbnail';

interface ScreenSidebarProps {
  activeScreen: ScreenData | null;
  allScreens: ScreenData[];
  isMasterView: boolean;
}

export function ScreenSidebar({ activeScreen, allScreens, isMasterView }: ScreenSidebarProps) {
  return (
    <div className="w-[35%] flex flex-col border-r border-slate-200 overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center custom-scrollbar">
        {activeScreen?.coverData ? (
          <CoverThumbnail coverData={activeScreen.coverData} className="shadow-lg" />
        ) : (activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl) ? (
          <img
            src={activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl}
            className="max-w-full h-auto shadow-lg rounded-lg border border-white"
            alt="디자인"
          />
        ) : (
          <div className="w-full aspect-video bg-white flex items-center justify-center text-slate-400 font-bold text-xs uppercase rounded-lg border border-slate-200">
            미리보기 없음
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 max-h-[55%] overflow-y-auto custom-scrollbar">
        <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          기획 및 스펙 내용
        </h3>

        {isMasterView ? (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              종합 관리 모드입니다. 특정 화면을 선택하면 상세 정보를 확인할 수 있습니다.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">
                총 {allScreens.length}개의 화면이 이 섹션에 포함되어 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Screen Information */}
            {activeScreen?.screenInformation && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-[9px] font-bold text-blue-700 uppercase tracking-wide mb-1">Screen Information</h4>
                <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeScreen.screenInformation}
                </p>
              </div>
            )}

            {/* Single Screen Description */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="text-[9px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Description</h4>
              {activeScreen?.description ? (
                <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeScreen.description}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  기획/스펙 내용이 없습니다.
                </p>
              )}
            </div>

            {/* Screen Metadata */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500 font-medium uppercase block mb-0.5">화면 이름</span>
                  <span className="text-slate-900 font-bold">{activeScreen?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium uppercase block mb-0.5">Base ID</span>
                  <span className="text-slate-900 font-bold">{activeScreen?.baseId}</span>
                </div>
                {activeScreen?.suffix && (
                  <div>
                    <span className="text-slate-500 font-medium uppercase block mb-0.5">Suffix</span>
                    <span className="text-slate-900 font-bold">{activeScreen.suffix}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
