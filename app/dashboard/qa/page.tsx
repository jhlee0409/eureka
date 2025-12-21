'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TestCase, QAStatus, QAPriority } from '../../types';

const TEAM_MEMBERS = ['테스', '잭', '멜러리', '이리나', '미쉘', '션', '키요'];

const STATUS_CONFIG: { key: QAStatus; label: string; color: string; bgColor: string }[] = [
  { key: 'Reviewing', label: '검토중', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  { key: 'DevError', label: 'Dev 오류', color: 'text-red-700', bgColor: 'bg-red-100' },
  { key: 'ProdError', label: 'Prod 오류', color: 'text-red-700', bgColor: 'bg-red-100' },
  { key: 'DevDone', label: 'Dev 완료', color: 'text-green-700', bgColor: 'bg-green-100' },
  { key: 'ProdDone', label: 'Prod 완료', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  { key: 'Hold', label: '보류', color: 'text-orange-700', bgColor: 'bg-orange-100' },
];

export default function QADashboard() {
  const router = useRouter();
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
  const [screenNames, setScreenNames] = useState<Record<string, string>>({});

  // Load all TC data from localStorage
  useEffect(() => {
    const testCases: TestCase[] = [];
    const names: Record<string, string> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('qa_')) {
        const screenId = key.replace('qa_', '');
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        testCases.push(...data.map((t: TestCase) => ({ ...t, originScreenId: screenId })));
      }
      // Try to get screen names from group data
      if (key?.startsWith('group_')) {
        try {
          const group = JSON.parse(localStorage.getItem(key) || '{}');
          Object.values(group.baseIds || {}).flat().forEach((screen: any) => {
            if (screen.figmaId && screen.name) {
              names[screen.figmaId] = screen.name;
            }
          });
        } catch (e) {}
      }
    }

    setAllTestCases(testCases);
    setScreenNames(names);
  }, []);

  // Stats by status
  const statusStats = useMemo(() => {
    const stats: Record<QAStatus, number> = {
      'Reviewing': 0,
      'DevError': 0,
      'ProdError': 0,
      'DevDone': 0,
      'ProdDone': 0,
      'Hold': 0,
      'Rejected': 0,
      'Duplicate': 0,
    };
    allTestCases.forEach(tc => {
      stats[tc.status]++;
    });
    return stats;
  }, [allTestCases]);

  // Stats by priority
  const priorityStats = useMemo(() => {
    const stats: Record<QAPriority, number> = {
      'High': 0,
      'Medium': 0,
      'Low': 0,
    };
    allTestCases.forEach(tc => {
      stats[tc.priority]++;
    });
    return stats;
  }, [allTestCases]);

  // Stats by screen (coverage)
  const screenStats = useMemo(() => {
    const stats: Record<string, { total: number; resolved: number; errors: number }> = {};
    allTestCases.forEach(tc => {
      const screenId = tc.originScreenId || 'unknown';
      if (!stats[screenId]) {
        stats[screenId] = { total: 0, resolved: 0, errors: 0 };
      }
      stats[screenId].total++;
      if (tc.status === 'DevDone' || tc.status === 'ProdDone') {
        stats[screenId].resolved++;
      }
      if (tc.status === 'DevError' || tc.status === 'ProdError') {
        stats[screenId].errors++;
      }
    });
    return stats;
  }, [allTestCases]);

  // Stats by assignee
  const assigneeStats = useMemo(() => {
    const stats: Record<string, { total: number; resolved: number; inProgress: number }> = {};
    TEAM_MEMBERS.forEach(m => {
      stats[m] = { total: 0, resolved: 0, inProgress: 0 };
    });
    allTestCases.forEach(tc => {
      if (stats[tc.assignee]) {
        stats[tc.assignee].total++;
        if (tc.status === 'DevDone' || tc.status === 'ProdDone') {
          stats[tc.assignee].resolved++;
        } else if (tc.progress === 'Working' || tc.progress === 'Checking') {
          stats[tc.assignee].inProgress++;
        }
      }
    });
    return stats;
  }, [allTestCases]);

  // TC by date (last 14 days trend)
  const dateTrend = useMemo(() => {
    const trend: Record<string, number> = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      trend[date.toISOString().split('T')[0]] = 0;
    }
    allTestCases.forEach(tc => {
      if (trend[tc.date] !== undefined) {
        trend[tc.date]++;
      }
    });
    return trend;
  }, [allTestCases]);

  const totalTC = allTestCases.length;
  const resolvedTC = statusStats['DevDone'] + statusStats['ProdDone'];
  const errorTC = statusStats['DevError'] + statusStats['ProdError'];
  const resolutionRate = totalTC > 0 ? Math.round((resolvedTC / totalTC) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 h-12 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-1.5 hover:bg-slate-800 rounded-lg transition-all">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">QA 대시보드</h1>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Quality Assurance Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/developer')}
            className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-wide transition-colors"
          >
            담당자 뷰로 전환
          </button>
        </div>
      </header>

      <main className="p-4 max-w-[1800px] mx-auto">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">전체 TC</p>
            <p className="text-2xl font-bold text-slate-900">{totalTC}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide mb-1">해결됨</p>
            <p className="text-2xl font-bold text-green-700">{resolvedTC}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide mb-1">오류 상태</p>
            <p className="text-2xl font-bold text-red-700">{errorTC}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-wide mb-1">해결율</p>
            <p className="text-2xl font-bold text-yellow-700">{resolutionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Status Distribution */}
          <section className="bg-white p-4 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              상태별 현황
            </h2>
            <div className="space-y-2">
              {STATUS_CONFIG.map(status => {
                const count = statusStats[status.key];
                const percentage = totalTC > 0 ? (count / totalTC) * 100 : 0;
                return (
                  <div key={status.key} className="flex items-center gap-2">
                    <span className={`w-16 text-[10px] font-bold ${status.color}`}>{status.label}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${status.bgColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[10px] font-bold text-slate-700">{count}건</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Priority Distribution */}
          <section className="bg-white p-4 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              우선순위별 분류
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <p className="text-xl font-bold text-red-700">{priorityStats['High']}</p>
                <p className="text-[9px] font-bold text-red-600 uppercase">높음</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <p className="text-xl font-bold text-orange-700">{priorityStats['Medium']}</p>
                <p className="text-[9px] font-bold text-orange-600 uppercase">중간</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">L</span>
                </div>
                <p className="text-xl font-bold text-green-700">{priorityStats['Low']}</p>
                <p className="text-[9px] font-bold text-green-600 uppercase">낮음</p>
              </div>
            </div>
          </section>
        </div>

        {/* Screen Coverage */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            화면별 TC 커버리지
          </h2>
          {Object.keys(screenStats).length === 0 ? (
            <p className="text-slate-400 text-center py-4 text-xs font-medium">등록된 TC가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">화면</th>
                    <th className="px-3 py-2 text-center">전체 TC</th>
                    <th className="px-3 py-2 text-center">오류</th>
                    <th className="px-3 py-2 text-center">해결</th>
                    <th className="px-3 py-2 text-left">해결율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(screenStats).map(([screenId, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
                    return (
                      <tr key={screenId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900 text-xs">
                          {screenNames[screenId] || screenId}
                        </td>
                        <td className="px-3 py-2 text-center text-[10px] font-medium text-slate-700">{stats.total}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold ${stats.errors > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {stats.errors}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-[10px] font-bold text-green-600">{stats.resolved}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-700">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Assignee Stats */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
            담당자별 진행 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {TEAM_MEMBERS.map(member => {
              const stats = assigneeStats[member];
              const rate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
              return (
                <div key={member} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{member[0]}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 mb-1">{member}</p>
                  <div className="space-y-0.5 text-[9px]">
                    <p className="text-slate-500">
                      전체 <span className="font-bold text-slate-700">{stats.total}</span>
                    </p>
                    <p className="text-slate-500">
                      해결 <span className="font-bold text-green-600">{stats.resolved}</span>
                    </p>
                    <p className="text-slate-500">
                      진행 <span className="font-bold text-blue-600">{stats.inProgress}</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">{rate}%</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Timeline Trend */}
        <section className="bg-white p-4 rounded-lg border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            최근 14일 TC 등록 트렌드
          </h2>
          <div className="flex items-end gap-1 h-28">
            {Object.entries(dateTrend).map(([date, count]) => {
              const maxCount = Math.max(...Object.values(dateTrend), 1);
              const height = (count / maxCount) * 100;
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] font-bold text-slate-500">{count}</span>
                  <div
                    className={`w-full rounded-t transition-all ${isToday ? 'bg-yellow-500' : 'bg-indigo-400'}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[7px] text-slate-400 -rotate-45 origin-center whitespace-nowrap">
                    {date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
