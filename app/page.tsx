'use client';

import React, { useState, useMemo } from 'react';
import SetupForm from './components/SetupForm';
import DetailModal from './components/DetailModal';
import { FigmaAuth, ParsedState, ScreenGroup } from './types';
import { fetchFigmaFile } from './services/figmaService';

export default function Home() {
  const [state, setState] = useState<ParsedState>({
    pages: {},
    loading: false,
    error: null
  });

  const [selectedGroup, setSelectedGroup] = useState<ScreenGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSync = async (auth: FigmaAuth) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const pages = await fetchFigmaFile(auth);
      const groupCount = Object.values(pages).reduce((acc, groups) => acc + Object.keys(groups).length, 0);

      if (groupCount === 0) {
        throw new Error("연결에 성공했으나, 명명 규칙(예: AUTO_0001)에 맞는 프레임을 찾을 수 없습니다. 피그마 프레임 이름을 확인해주세요.");
      }

      setState({ pages, loading: false, error: null });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '동기화 실패';
      setState({ pages: {}, loading: false, error: errorMessage });
    }
  };

  const filteredPages = useMemo(() => {
    if (!searchQuery) return state.pages;
    const query = searchQuery.toLowerCase();
    const newPages: Record<string, Record<string, ScreenGroup>> = {};

    Object.entries(state.pages).forEach(([pageName, groups]) => {
      const filteredGroups: Record<string, ScreenGroup> = {};
      Object.entries(groups).forEach(([baseId, group]) => {
        if (baseId.toLowerCase().includes(query) || group.parent.name.toLowerCase().includes(query) || group.parent.sectionName?.toLowerCase().includes(query)) {
          filteredGroups[baseId] = group;
        }
      });
      if (Object.keys(filteredGroups).length > 0) newPages[pageName] = filteredGroups;
    });
    return newPages;
  }, [state.pages, searchQuery]);

  const totalGroups = useMemo(() => {
    return Object.values(state.pages).reduce((acc, groups) => acc + Object.keys(groups).length, 0);
  }, [state.pages]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-yellow-200 text-slate-900 bg-[#F1F5F9]">
      <header className="bg-[#0F172A] border-b border-slate-800 h-20 flex items-center justify-between px-10 sticky top-0 z-40 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-900 font-black shadow-xl shadow-yellow-400/20">E</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">EUREKA <span className="text-yellow-400">유레카</span></h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">화면 중심의 기획 & 품질 관리 통합 솔루션</p>
          </div>
        </div>

        {totalGroups > 0 && (
          <div className="flex-1 max-w-2xl mx-16">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500 group-focus-within:text-yellow-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input
                type="text"
                placeholder="화면 이름 또는 ID로 검색..."
                className="w-full pl-14 pr-6 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm font-medium focus:bg-slate-800 focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-400 outline-none transition-all placeholder:text-slate-500 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          {totalGroups > 0 && (
            <button
              onClick={() => setState({ pages: {}, loading: false, error: null })}
              className="text-[10px] font-black text-slate-400 hover:text-yellow-400 uppercase tracking-[0.2em] transition-all"
            >
              연결 해제
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
             <div className="w-7 h-7 rounded-xl bg-yellow-400 shadow-md"></div>
             <span className="text-[10px] font-black px-2 text-slate-300">작업 공간</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {Object.keys(state.pages).length === 0 && !state.loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0F172A]">
            {state.error && (
               <div className="bg-slate-800 border border-red-500/30 text-red-200 p-8 rounded-[2.5rem] mb-12 flex flex-col gap-4 max-w-md shadow-2xl animate-in slide-in-from-bottom-8">
                 <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                 </div>
                 <h2 className="font-black text-xl tracking-tight text-white">동기화 중단됨</h2>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">{state.error}</p>
               </div>
            )}
            <SetupForm onSync={handleSync} loading={state.loading} />
          </div>
        ) : state.loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#0F172A]">
             <div className="w-20 h-20 border-[6px] border-slate-800 rounded-full animate-spin border-t-yellow-400"></div>
             <div className="text-center">
               <p className="text-2xl font-black text-white tracking-tight uppercase">디자인 트리 분석 중</p>
               <p className="text-sm text-slate-400 mt-2 font-medium">컴포넌트 및 문서 정보를 추출하고 있습니다...</p>
             </div>
          </div>
        ) : (
          <div className="p-12 max-w-[1600px] mx-auto w-full">
            {Object.entries(filteredPages).map(([pageName, groups]) => (
              <section key={pageName} className="mb-20">
                <div className="flex items-center gap-5 mb-10">
                   <div className="h-px flex-1 bg-slate-300"></div>
                   <h2 className="text-sm font-black text-slate-500 tracking-[0.3em] uppercase">{pageName}</h2>
                   <div className="h-px flex-1 bg-slate-300"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {Object.entries(groups).map(([baseId, group]) => (
                    <div
                      key={baseId}
                      onClick={() => setSelectedGroup(group)}
                      className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500 cursor-pointer flex flex-col relative"
                    >
                      <div className="aspect-[1.5/1] w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center relative">
                        {group.parent.thumbnailUrl ? (
                          <img
                            src={group.parent.thumbnailUrl}
                            alt={group.parent.name}
                            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="text-slate-300 italic font-bold">미리보기 없음</div>
                        )}
                        {group.parent.sectionName && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-slate-900 text-[9px] font-black px-3 py-1.5 rounded-xl border border-slate-700 text-yellow-400 uppercase tracking-widest shadow-lg">
                              {group.parent.sectionName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-8">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{group.children.length + 1}개 화면</span>
                           <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-yellow-600 transition-colors tracking-tight uppercase leading-none">{baseId}</h3>
                        <p className="text-[11px] text-slate-500 font-bold mt-2 truncate uppercase tracking-tight">{group.parent.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {selectedGroup && (
        <DetailModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
