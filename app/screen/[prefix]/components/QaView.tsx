'use client';

import React, { useState, useMemo } from 'react';
import { TestCase, QAStatus, QAPriority, QAPosition } from '../../../types';
import { TEAM_MEMBERS, STATUS_ORDER, STATUS_CONFIG } from '../config/constants';

interface QaViewProps {
  testCases: TestCase[];
  addTestCase: (tc: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  originScreenId?: string;
}

export function QaView({
  testCases,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  isMasterView,
  getScreenNameById,
  originScreenId = ''
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
      'Rejected': [],
      'Duplicate': [],
    };
    testCases.forEach(tc => {
      if (grouped[tc.status]) {
        grouped[tc.status].push(tc);
      }
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
      originScreenId,
    };

    addTestCase(newTC);

    // Reset form
    setQuickAdd({ checkpoint: '', scenario: '', position: 'Front-end', priority: 'Medium' });
  };

  const handleStatusChange = (tcId: string, newStatus: QAStatus) => {
    if (isMasterView) return;
    updateTestCase(tcId, { status: newStatus });
  };

  return (
    <div className="space-y-4">
      {/* QA Summary Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold">이 화면 TC 현황</h2>
            <p className="text-slate-400 text-[10px]">Quality Assurance Overview</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{stats.rate}%</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">해결율</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div>
            <span className="text-slate-400">전체:</span>
            <span className="font-bold ml-1">{stats.total}건</span>
          </div>
          <div>
            <span className="text-red-400">오류:</span>
            <span className="font-bold ml-1">{stats.errors}건</span>
          </div>
          <div>
            <span className="text-green-400">해결:</span>
            <span className="font-bold ml-1">{stats.resolved}건</span>
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>

      {/* Quick Add Form */}
      {!isMasterView && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="text-[10px] font-bold text-blue-900 mb-2 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            이슈 빠른 등록
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Design' }))}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                quickAdd.position === 'Design' ? 'bg-pink-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🎨 Design
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Front-end' }))}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                quickAdd.position === 'Front-end' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              💻 Front-end
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'Back-end' }))}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                quickAdd.position === 'Back-end' ? 'bg-green-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              ⚙️ Back-end
            </button>
            <button
              onClick={() => setQuickAdd(prev => ({ ...prev, position: 'PM' }))}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                quickAdd.position === 'PM' ? 'bg-purple-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              📋 PM
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickAdd.checkpoint}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, checkpoint: e.target.value }))}
              placeholder="체크포인트"
              className="w-24 px-2 py-1.5 rounded text-[10px] font-medium border border-blue-200 outline-none focus:border-blue-400"
            />
            <input
              type="text"
              value={quickAdd.scenario}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="이슈 시나리오를 입력하세요..."
              className="flex-1 px-2 py-1.5 rounded text-[10px] font-medium border border-blue-200 outline-none focus:border-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <select
              value={quickAdd.priority}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, priority: e.target.value as QAPriority }))}
              className="px-2 py-1.5 rounded text-[10px] font-bold border border-blue-200 outline-none"
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟠 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
            <button
              onClick={handleQuickAdd}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-all"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* TC List by Status */}
      <div className="space-y-3">
        {STATUS_ORDER.map(status => {
          const tcs = tcByStatus[status];
          if (tcs.length === 0) return null;
          const config = STATUS_CONFIG[status];
          const isError = status === 'DevError' || status === 'ProdError';

          return (
            <div key={status} className={`rounded-lg border overflow-hidden ${config.bgColor}`}>
              <div className="px-3 py-2 border-b border-slate-200/50 flex items-center justify-between">
                <h3 className={`text-[10px] font-bold ${config.color} flex items-center gap-1.5`}>
                  {isError && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                  {config.label} ({tcs.length}건)
                </h3>
              </div>
              <div className="p-2 space-y-1.5">
                {tcs.map(tc => (
                  <div
                    key={tc.id}
                    className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between group hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        tc.priority === 'High' ? 'bg-red-500' :
                        tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {tc.checkpoint && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                              {tc.checkpoint}
                            </span>
                          )}
                          <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {tc.position}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-900">{tc.scenario}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500">
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
                        className="px-2 py-1 rounded text-[9px] font-bold border border-slate-200 outline-none cursor-pointer bg-white"
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
      <div className="bg-white p-3 rounded-lg border border-slate-200">
        <h3 className="text-[10px] font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
          담당자별 배분 현황
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(tcByAssignee).map(([name, count]) => {
            if (count === 0) return null;
            const maxCount = Math.max(...Object.values(tcByAssignee));
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={name} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                <span className="text-[9px] font-bold text-slate-600">{name}:</span>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${width}%` }} />
                </div>
                <span className="text-[9px] font-bold text-slate-500">{count}건</span>
              </div>
            );
          })}
        </div>
      </div>

      {testCases.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-slate-400 text-xs font-medium">등록된 TC가 없습니다.</p>
          {!isMasterView && (
            <p className="text-[10px] text-slate-400 mt-1">위의 빠른 등록 폼을 사용하여 이슈를 등록하세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
