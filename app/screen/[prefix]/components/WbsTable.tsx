'use client';

import React from 'react';
import { WbsTask, WbsStatus } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface WbsTableProps {
  wbsTasks: WbsTask[];
  isMasterView: boolean;
  getScreenNameById: (figmaId: string | undefined) => string;
  updateWbsTask: (id: string, updates: Partial<WbsTask>) => void;
  deleteWbsTask: (id: string) => void;
}

export function WbsTable({
  wbsTasks,
  isMasterView,
  getScreenNameById,
  updateWbsTask,
  deleteWbsTask
}: WbsTableProps) {
  return (
    <div className="bg-white border border-slate-300 rounded-[2.5rem] overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300">
          <tr>
            {isMasterView && <th className="px-6 py-5">화면명</th>}
            <th className="px-8 py-5">상세 업무명</th>
            <th className="px-8 py-5">담당자</th>
            <th className="px-8 py-5">일정 (시작/종료)</th>
            <th className="px-8 py-5">상태</th>
            {!isMasterView && <th className="px-8 py-5"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {wbsTasks.map(task => (
            <tr key={task.id} className="group hover:bg-slate-50">
              {isMasterView && (
                <td className="px-6 py-5">
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide">
                    {getScreenNameById(task.originScreenId)}
                  </span>
                </td>
              )}
              <td className="px-8 py-5">
                {isMasterView ? (
                  <>
                    <p className="font-black text-slate-900 text-sm">{task.name}</p>
                    {task.detail && <p className="text-[11px] font-bold text-slate-500 mt-1">{task.detail}</p>}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={task.name}
                      onChange={e => updateWbsTask(task.id, { name: e.target.value })}
                      className="w-full bg-transparent font-black text-slate-900 text-sm outline-none focus:text-slate-900 border-b border-transparent focus:border-slate-300"
                    />
                    <input
                      type="text"
                      value={task.detail}
                      onChange={e => updateWbsTask(task.id, { detail: e.target.value })}
                      placeholder="상세 기술 내용..."
                      className="w-full bg-transparent text-[11px] font-bold text-slate-500 mt-1 outline-none"
                    />
                  </>
                )}
              </td>
              <td className="px-8 py-5">
                {isMasterView ? (
                  <span className="font-black text-slate-900 text-xs">{task.assignee}</span>
                ) : (
                  <select
                    value={task.assignee}
                    onChange={e => updateWbsTask(task.id, { assignee: e.target.value })}
                    className="bg-transparent font-black text-slate-900 text-xs outline-none cursor-pointer"
                  >
                    {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                )}
              </td>
              <td className="px-8 py-5">
                {isMasterView ? (
                  <div className="flex flex-col gap-1 text-xs font-black text-slate-900">
                    <span>{task.startDate}</span>
                    <span className="text-slate-400">~ {task.endDate}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={task.startDate}
                      onChange={e => updateWbsTask(task.id, { startDate: e.target.value })}
                      className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-black text-slate-900 text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <input
                      type="date"
                      value={task.endDate}
                      onChange={e => updateWbsTask(task.id, { endDate: e.target.value })}
                      className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-black text-slate-900 text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                )}
              </td>
              <td className="px-8 py-5">
                {isMasterView ? (
                  <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${
                    task.status === 'Done' ? 'bg-green-100 text-green-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {task.status === 'Planning' ? '대기' : task.status === 'In Progress' ? '진행중' : '완료'}
                  </span>
                ) : (
                  <select
                    value={task.status}
                    onChange={e => updateWbsTask(task.id, { status: e.target.value as WbsStatus })}
                    className="bg-transparent font-black text-slate-900 text-xs outline-none uppercase"
                  >
                    <option value="Planning">대기</option>
                    <option value="In Progress">진행중</option>
                    <option value="Done">완료</option>
                  </select>
                )}
              </td>
              {!isMasterView && (
                <td className="px-8 py-5 text-right">
                  <button
                    onClick={() => deleteWbsTask(task.id)}
                    className="text-slate-300 hover:text-red-600 text-2xl font-black transition-colors"
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
