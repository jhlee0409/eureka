'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WbsTask, TestCase, QAProgress } from '../../types';

const TEAM_MEMBERS = ['테스', '잭', '멜러리', '이리나', '미쉘', '션', '키요'];

const PROGRESS_COLUMNS: { key: QAProgress; label: string; color: string }[] = [
  { key: 'Waiting', label: '대기', color: 'bg-slate-100 border-slate-300' },
  { key: 'Checking', label: '확인', color: 'bg-cyan-50 border-cyan-300' },
  { key: 'Working', label: '작업 중', color: 'bg-purple-50 border-purple-300' },
  { key: 'DevDeployed', label: 'Dev 배포', color: 'bg-blue-50 border-blue-300' },
  { key: 'ProdDeployed', label: 'Prod 배포', color: 'bg-emerald-50 border-emerald-300' },
];

export default function DeveloperDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(TEAM_MEMBERS[0]);
  const [allWbsTasks, setAllWbsTasks] = useState<WbsTask[]>([]);
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);

  // Load all data from localStorage
  useEffect(() => {
    const wbsTasks: WbsTask[] = [];
    const testCases: TestCase[] = [];

    // Scan all localStorage keys for wbs_ and qa_ prefixes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('wbs_')) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        wbsTasks.push(...data.map((t: WbsTask) => ({ ...t, originScreenId: key.replace('wbs_', '') })));
      }
      if (key?.startsWith('qa_')) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        testCases.push(...data.map((t: TestCase) => ({ ...t, originScreenId: key.replace('qa_', '') })));
      }
    }

    setAllWbsTasks(wbsTasks);
    setAllTestCases(testCases);
  }, []);

  // Filter by current user
  const myWbsTasks = useMemo(() =>
    allWbsTasks.filter(t => t.assignee === currentUser),
    [allWbsTasks, currentUser]
  );

  const myTestCases = useMemo(() =>
    allTestCases.filter(t => t.assignee === currentUser),
    [allTestCases, currentUser]
  );

  // Group test cases by progress for Kanban
  const tcByProgress = useMemo(() => {
    const grouped: Record<QAProgress, TestCase[]> = {
      'Waiting': [],
      'Checking': [],
      'Working': [],
      'DevDeployed': [],
      'ProdDeployed': [],
    };
    myTestCases.forEach(tc => {
      if (grouped[tc.progress]) {
        grouped[tc.progress].push(tc);
      }
    });
    return grouped;
  }, [myTestCases]);

  // Stats
  const stats = useMemo(() => ({
    totalWbs: myWbsTasks.length,
    wbsInProgress: myWbsTasks.filter(t => t.status === 'In Progress').length,
    wbsDone: myWbsTasks.filter(t => t.status === 'Done').length,
    totalTc: myTestCases.length,
    tcResolved: myTestCases.filter(t => t.status === 'DevDone' || t.status === 'ProdDone').length,
    tcErrors: myTestCases.filter(t => t.status === 'DevError' || t.status === 'ProdError').length,
  }), [myWbsTasks, myTestCases]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 h-16 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">담당자 대시보드</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Developer View</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">현재 사용자:</span>
          <select
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-black border border-slate-700 outline-none"
          >
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      <main className="p-8 max-w-[1800px] mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">내 WBS 작업</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalWbs}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">진행 중</p>
            <p className="text-3xl font-black text-blue-700">{stats.wbsInProgress}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-200 shadow-sm">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">WBS 완료</p>
            <p className="text-3xl font-black text-green-700">{stats.wbsDone}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">내 TC 이슈</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalTc}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">오류 상태</p>
            <p className="text-3xl font-black text-red-700">{stats.tcErrors}</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">TC 해결</p>
            <p className="text-3xl font-black text-emerald-700">{stats.tcResolved}</p>
          </div>
        </div>

        {/* My WBS Tasks */}
        <section className="mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            내 WBS 작업
          </h2>
          {myWbsTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 font-bold">
              할당된 WBS 작업이 없습니다.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">작업명</th>
                    <th className="px-6 py-4 text-left">상세</th>
                    <th className="px-6 py-4 text-left">일정</th>
                    <th className="px-6 py-4 text-left">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myWbsTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-black text-slate-900">{task.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{task.detail || '-'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {task.startDate} ~ {task.endDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          task.status === 'Done' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.status === 'Planning' ? '대기' : task.status === 'In Progress' ? '진행중' : '완료'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TC Kanban Board by Progress */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            내 TC 진행 현황 (칸반 보드)
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {PROGRESS_COLUMNS.map(col => (
              <div key={col.key} className={`${col.color} rounded-2xl border-2 p-4 min-h-[400px]`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{col.label}</h3>
                  <span className="bg-white px-2 py-1 rounded-lg text-xs font-black text-slate-600">
                    {tcByProgress[col.key].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tcByProgress[col.key].map(tc => (
                    <div
                      key={tc.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          tc.priority === 'High' ? 'bg-red-500' :
                          tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          tc.status === 'DevDone' || tc.status === 'ProdDone' ? 'bg-green-100 text-green-700' :
                          tc.status === 'DevError' || tc.status === 'ProdError' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tc.status === 'Reviewing' ? '검토중' :
                           tc.status === 'DevError' ? 'Dev오류' :
                           tc.status === 'ProdError' ? 'Prod오류' :
                           tc.status === 'DevDone' ? 'Dev완료' :
                           tc.status === 'ProdDone' ? 'Prod완료' : '보류'}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900 mb-2 line-clamp-2">{tc.scenario}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold">{tc.position}</span>
                        <span className="font-bold">{tc.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
