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
    <div className="w-[35%] flex flex-col border-r border-slate-300 overflow-hidden bg-slate-200">
      <div className="flex-1 overflow-auto p-10 flex items-start justify-center custom-scrollbar">
        {activeScreen?.coverData ? (
          <CoverThumbnail coverData={activeScreen.coverData} className="shadow-2xl" />
        ) : (activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl) ? (
          <img
            src={activeScreen?.thumbnailUrl || allScreens[0]?.thumbnailUrl}
            className="max-w-full h-auto shadow-2xl rounded-2xl border border-white"
            alt="디자인"
          />
        ) : (
          <div className="w-full aspect-video bg-white flex items-center justify-center text-slate-400 font-black uppercase rounded-2xl border border-slate-300">
            미리보기 없음
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-300 max-h-[60%] overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          기획 및 스펙 내용
        </h3>

        {isMasterView ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-600 leading-relaxed font-bold">
              종합 관리 모드입니다. 특정 화면을 선택하면 상세 정보를 확인할 수 있습니다.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-300">
              <p className="text-xs text-slate-500 font-bold">
                총 {allScreens.length}개의 화면이 이 섹션에 포함되어 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Screen Information */}
            {activeScreen?.screenInformation && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Screen Information</h4>
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-bold">
                  {activeScreen.screenInformation}
                </p>
              </div>
            )}

            {/* Single Screen Description */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-4">Description</h4>
              {activeScreen?.description ? (
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-bold">
                  {activeScreen.description}
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed font-bold italic">
                  기획/스펙 내용이 없습니다.
                </p>
              )}
            </div>

            {/* Screen Metadata */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase block mb-1">화면 이름</span>
                  <span className="text-slate-900 font-black">{activeScreen?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block mb-1">Base ID</span>
                  <span className="text-slate-900 font-black">{activeScreen?.baseId}</span>
                </div>
                {activeScreen?.suffix && (
                  <div>
                    <span className="text-slate-500 font-bold uppercase block mb-1">Suffix</span>
                    <span className="text-slate-900 font-black">{activeScreen.suffix}</span>
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
