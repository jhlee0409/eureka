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
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[9px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200">
          <tr>
            {isMasterView && <th className="px-3 py-2">화면명</th>}
            <th className="px-3 py-2">상세 업무명</th>
            <th className="px-3 py-2">담당자</th>
            <th className="px-3 py-2">일정</th>
            <th className="px-3 py-2">상태</th>
            {!isMasterView && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {wbsTasks.map(task => (
            <tr key={task.id} className="group hover:bg-slate-50">
              {isMasterView && (
                <td className="px-3 py-2">
                  <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-bold">
                    {getScreenNameById(task.originScreenId)}
                  </span>
                </td>
              )}
              <td className="px-3 py-2">
                {isMasterView ? (
                  <>
                    <p className="font-bold text-slate-900 text-xs">{task.name}</p>
                    {task.detail && <p className="text-[10px] text-slate-500 mt-0.5">{task.detail}</p>}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={task.name}
                      onChange={e => updateWbsTask(task.id, { name: e.target.value })}
                      className="w-full bg-transparent font-bold text-slate-900 text-xs outline-none focus:text-slate-900 border-b border-transparent focus:border-slate-300"
                    />
                    <input
                      type="text"
                      value={task.detail}
                      onChange={e => updateWbsTask(task.id, { detail: e.target.value })}
                      placeholder="상세 기술 내용..."
                      className="w-full bg-transparent text-[10px] text-slate-500 mt-0.5 outline-none"
                    />
                  </>
                )}
              </td>
              <td className="px-3 py-2">
                {isMasterView ? (
                  <span className="font-bold text-slate-700 text-[10px]">{task.assignee}</span>
                ) : (
                  <select
                    value={task.assignee}
                    onChange={e => updateWbsTask(task.id, { assignee: e.target.value })}
                    className="bg-transparent font-bold text-slate-700 text-[10px] outline-none cursor-pointer"
                  >
                    {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                )}
              </td>
              <td className="px-3 py-2">
                {isMasterView ? (
                  <div className="flex flex-col gap-0.5 text-[10px] font-bold text-slate-700">
                    <span>{task.startDate}</span>
                    <span className="text-slate-400">~ {task.endDate}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <input
                      type="date"
                      value={task.startDate}
                      onChange={e => updateWbsTask(task.id, { startDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 text-[10px] outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <input
                      type="date"
                      value={task.endDate}
                      onChange={e => updateWbsTask(task.id, { endDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 text-[10px] outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                )}
              </td>
              <td className="px-3 py-2">
                {isMasterView ? (
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                    task.status === 'Done' ? 'bg-green-100 text-green-700' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status === 'Planning' ? '대기' : task.status === 'In Progress' ? '진행중' : '완료'}
                  </span>
                ) : (
                  <select
                    value={task.status}
                    onChange={e => updateWbsTask(task.id, { status: e.target.value as WbsStatus })}
                    className="bg-transparent font-bold text-slate-700 text-[10px] outline-none"
                  >
                    <option value="Planning">대기</option>
                    <option value="In Progress">진행중</option>
                    <option value="Done">완료</option>
                  </select>
                )}
              </td>
              {!isMasterView && (
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => deleteWbsTask(task.id)}
                    className="text-slate-300 hover:text-red-500 text-lg font-bold transition-colors"
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
