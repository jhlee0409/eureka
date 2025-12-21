'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WbsTask, TestCase, QAProgress } from '../../types';
import { UserSelect } from '../../components/ui';

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
      <header className="bg-slate-900 h-12 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-1.5 hover:bg-slate-800 rounded-lg transition-all">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">담당자 대시보드</h1>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Developer View</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">현재 사용자:</span>
          <UserSelect
            value={currentUser}
            onChange={setCurrentUser}
            options={TEAM_MEMBERS}
            size="xs"
          />
        </div>
      </header>

      <main className="p-4 max-w-[1800px] mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">내 WBS 작업</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalWbs}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-1">진행 중</p>
            <p className="text-xl font-bold text-blue-700">{stats.wbsInProgress}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide mb-1">WBS 완료</p>
            <p className="text-xl font-bold text-green-700">{stats.wbsDone}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">내 TC 이슈</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalTc}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide mb-1">오류 상태</p>
            <p className="text-xl font-bold text-red-700">{stats.tcErrors}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-1">TC 해결</p>
            <p className="text-xl font-bold text-emerald-700">{stats.tcResolved}</p>
          </div>
        </div>

        {/* My WBS Tasks */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            내 WBS 작업
          </h2>
          {myWbsTasks.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-slate-400 text-xs font-medium">
              할당된 WBS 작업이 없습니다.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">작업명</th>
                    <th className="px-3 py-2 text-left">상세</th>
                    <th className="px-3 py-2 text-left">일정</th>
                    <th className="px-3 py-2 text-left">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myWbsTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold text-slate-900 text-xs">{task.name}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-600">{task.detail || '-'}</td>
                      <td className="px-3 py-2 text-[10px] font-medium text-slate-500">
                        {task.startDate} ~ {task.endDate}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
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
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            내 TC 진행 현황 (칸반 보드)
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {PROGRESS_COLUMNS.map(col => (
              <div key={col.key} className={`${col.color} rounded-lg border p-2 min-h-[300px]`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">{col.label}</h3>
                  <span className="bg-white px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600">
                    {tcByProgress[col.key].length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {tcByProgress[col.key].map(tc => (
                    <div
                      key={tc.id}
                      className="bg-white p-2 rounded border border-slate-200 hover:shadow-sm transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          tc.priority === 'High' ? 'bg-red-500' :
                          tc.priority === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
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
                      <p className="text-[10px] font-bold text-slate-900 mb-1 line-clamp-2">{tc.scenario}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="font-medium">{tc.position}</span>
                        <span className="font-medium">{tc.date}</span>
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
