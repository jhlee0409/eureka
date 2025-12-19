'use client';

import React, { useState, useMemo } from 'react';
import { TestCase, QAStatus, QAPriority, QAPosition } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface QaViewProps {
  testCases: TestCase[];
  addTestCase: () => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
}

const STATUS_ORDER: QAStatus[] = ['DevError', 'ProdError', 'Reviewing', 'Hold', 'DevDone', 'ProdDone'];

const STATUS_CONFIG: Record<QAStatus, { label: string; color: string; bgColor: string }> = {
  'Reviewing': { label: '검토중', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  'DevError': { label: 'Dev 오류', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'ProdError': { label: 'Prod 오류', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'DevDone': { label: 'Dev 완료', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  'ProdDone': { label: 'Prod 완료', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  'Hold': { label: '보류', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
};

export function QaView({
  testCases,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  isMasterView,
  getScreenNameById
}: QaViewProps) {
  // Quick add form state
  const [quickAdd, setQuickAdd] = useState({
    checkpoint: '',
    scenario: '',
    position: 'Front-end' as QAPosition,
    priority: 'Medium' as QAPriority,
  });

  // Stats
  const stats = useMemo(() => {
    const total = testCases.length;
    const errors = testCases.filter(t => t.status === 'DevError' || t.status === 'ProdError').length;
    const resolved = testCases.filter(t => t.status === 'DevDone' || t.status === 'ProdDone').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, errors, resolved, rate };
  }, [testCases]);

  // Group by status
  const tcByStatus = useMemo(() => {
    const grouped: Record<QAStatus, TestCase[]> = {
      'Reviewing': [],
      'DevError': [],
      'ProdError': [],
      'DevDone': [],
      'ProdDone': [],
      'Hold': [],
    };
    testCases.forEach(tc => {
      grouped[tc.status].push(tc);
    });
    return grouped;
  }, [testCases]);

  // Group by assignee
  const tcByAssignee = useMemo(() => {
    const grouped: Record<string, number> = {};
    TEAM_MEMBERS.forEach(m => grouped[m] = 0);
    grouped['미배정'] = 0;
    testCases.forEach(tc => {
      if (tc.assignee && grouped[tc.assignee] !== undefined) {
        grouped[tc.assignee]++;
      } else {
        grouped['미배정']++;
      }
    });
    return grouped;
  }, [testCases]);

  const handleQuickAdd = () => {
    if (!quickAdd.scenario.trim()) return;

    // This will trigger the addTestCase and we need to update it
    // For now, we'll add directly with custom data
    const newTC: TestCase = {
      id: crypto.randomUUID(),
      checkpoint: quickAdd.checkpoint,
      scenario: quickAdd.scenario,
      issueContent: '',
      referenceLink: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Reviewing',
      reporter: TEAM_MEMBERS[0],
      priority: quickAdd.priority,
      position: quickAdd.position,
      assignee: TEAM_MEMBERS[1],
      progress: 'Waiting',
      comments: [],
    };

    // Reset form
    setQuickAdd({ checkpoint: '', scenario: '', position: 'Front-end', priority: 'Medium' });

    // Add via parent (we'll need to modify this)
    addTestCase();
  };

  const handleStatusChange = (tcId: string, newStatus: QAStatus) => {
    if (isMasterView) return;
    updateTestCase(tcId, { status: newStatus });
  };

  return (
    <div className="space-y-8">
      {/* QA Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black">이 화면 TC 현황</h2>
            <p className="text-slate-400 text-sm">Quality Assurance Overview</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">{stats.rate}%</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">해결율</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-400">전체:</span>
            <span className="font-black ml-2">{stats.total}건</span>
          </div>
          <div>
            <span className="text-red-400">오류:</span>
            <span className="font-black ml-2">{stats.errors}건</span>
          </div>
          <div>
            <span className="text-green-400">해결:</span>
            <span className="font-black ml-2">{stats.resolved}건</span>
          </div>
        </div>
        <div className="mt-4 h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>

      {/* Quick Add Form */}
      {!isMasterView && (
        <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
          <h3 className="text-sm font-black text-blue-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            이슈 빠른 등록
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Design' }))}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                quickAdd.position === 'Design' ? 'bg-pink-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🎨 Design
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Front-end' }))}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                quickAdd.position === 'Front-end' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              💻 Front-end
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Back-end' }))}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                quickAdd.position === 'Back-end' ? 'bg-green-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              ⚙️ Back-end
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'PM' }))}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                quickAdd.position === 'PM' ? 'bg-purple-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              📋 PM
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={quickAdd.checkpoint}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, checkpoint: e.target.value }))}
              placeholder="체크포인트 (위치)"
              className="w-32 px-4 py-3 rounded-xl text-sm font-bold border border-blue-200 outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={quickAdd.scenario}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="이슈 시나리오를 입력하세요..."
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-blue-200 outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <select
              value={quickAdd.priority}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, priority: e.target.value as QAPriority }))}
              className="px-4 py-3 rounded-xl text-sm font-black border border-blue-200 outline-none"
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟠 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
            <button
              onClick={handleQuickAdd}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* TC List by Status */}
      <div className="space-y-6">
        {STATUS_ORDER.map(status => {
          const tcs = tcByStatus[status];
          if (tcs.length === 0) return null;
          const config = STATUS_CONFIG[status];
          const isError = status === 'DevError' || status === 'ProdError';

          return (
            <div key={status} className={`rounded-2xl border-2 overflow-hidden ${config.bgColor}`}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className={`text-sm font-black ${config.color} flex items-center gap-2`}>
                  {isError && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                  {config.label} ({tcs.length}건)
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {tcs.map(tc => (
                  <div
                    key={tc.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        tc.priority === 'High' ? 'bg-red-500' :
                        tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {tc.checkpoint && (
                            <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                              {tc.checkpoint}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {tc.position}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{tc.scenario}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                          <span>담당: {tc.assignee}</span>
                          <span>|</span>
                          <span>{tc.date}</span>
                        </div>
                      </div>
                    </div>
                    {!isMasterView && (
                      <select
                        value={tc.status}
                        onChange={(e) => handleStatusChange(tc.id, e.target.value as QAStatus)}
                        className="px-3 py-2 rounded-lg text-[10px] font-black border border-slate-200 outline-none cursor-pointer bg-white"
                      >
                        <option value="Reviewing">검토중</option>
                        <option value="DevError">Dev 오류</option>
                        <option value="ProdError">Prod 오류</option>
                        <option value="DevDone">Dev 완료</option>
                        <option value="ProdDone">Prod 완료</option>
                        <option value="Hold">보류</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignee Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-cyan-500 rounded-full"></span>
          담당자별 배분 현황
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(tcByAssignee).map(([name, count]) => {
            if (count === 0) return null;
            const maxCount = Math.max(...Object.values(tcByAssignee));
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={name} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <span className="text-xs font-black text-slate-700">{name}:</span>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${width}%` }} />
                </div>
                <span className="text-xs font-black text-slate-500">{count}건</span>
              </div>
            );
          })}
        </div>
      </div>

      {testCases.length === 0 && (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          <p className="text-slate-400 font-bold">등록된 TC가 없습니다.</p>
          {!isMasterView && (
            <p className="text-sm text-slate-400 mt-2">위의 빠른 등록 폼을 사용하여 이슈를 등록하세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
