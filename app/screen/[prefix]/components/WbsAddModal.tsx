'use client';

import React, { useState } from 'react';
import { WbsTask, WbsCategory, WbsDifficulty, WbsSubTask, TestCase } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';

interface WbsAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: WbsTask) => void;
  testCases: TestCase[];  // 연결 가능한 TC 목록
  originScreenId: string;
}

const CATEGORY_CONFIG: { key: WbsCategory; label: string; icon: string; color: string }[] = [
  { key: 'ui', label: 'UI/UX', icon: '🎨', color: 'bg-pink-100 border-pink-300 text-pink-700' },
  { key: 'feature', label: '기능개발', icon: '💻', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { key: 'bugfix', label: '버그수정', icon: '🔧', color: 'bg-red-100 border-red-300 text-red-700' },
  { key: 'planning', label: '기획변경', icon: '📝', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { key: 'optimization', label: '최적화', icon: '⚡', color: 'bg-purple-100 border-purple-300 text-purple-700' },
];

const DIFFICULTY_CONFIG: { key: WbsDifficulty; label: string; dots: number }[] = [
  { key: 'easy', label: '쉬움', dots: 1 },
  { key: 'medium', label: '보통', dots: 2 },
  { key: 'hard', label: '어려움', dots: 3 },
];

export function WbsAddModal({ isOpen, onClose, onAdd, testCases, originScreenId }: WbsAddModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    detail: '',
    category: 'feature' as WbsCategory,
    difficulty: 'medium' as WbsDifficulty,
    assignee: TEAM_MEMBERS[0],
    startDate: today,
    endDate: today,
    relatedTcIds: [] as string[],
  });

  const [subtasks, setSubtasks] = useState<Omit<WbsSubTask, 'id'>[]>([]);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, {
      name: '',
      assignee: TEAM_MEMBERS[0],
      startDate: today,
      endDate: today,
      completed: false,
    }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, field: keyof Omit<WbsSubTask, 'id'>, value: string | boolean) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const handleTcToggle = (tcId: string) => {
    if (formData.relatedTcIds.includes(tcId)) {
      setFormData({ ...formData, relatedTcIds: formData.relatedTcIds.filter(id => id !== tcId) });
    } else {
      setFormData({ ...formData, relatedTcIds: [...formData.relatedTcIds, tcId] });
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const newTask: WbsTask = {
      id: crypto.randomUUID(),
      name: formData.name,
      detail: formData.detail,
      status: 'Planning',
      assignee: formData.assignee,
      startDate: formData.startDate,
      endDate: formData.endDate,
      originScreenId,
      category: formData.category,
      difficulty: formData.difficulty,
      relatedTcIds: formData.relatedTcIds.length > 0 ? formData.relatedTcIds : undefined,
      subtasks: subtasks.length > 0 ? subtasks.map(st => ({ ...st, id: crypto.randomUUID() })) : undefined,
    };

    onAdd(newTask);
    onClose();

    // Reset form
    setFormData({
      name: '',
      detail: '',
      category: 'feature',
      difficulty: 'medium',
      assignee: TEAM_MEMBERS[0],
      startDate: today,
      endDate: today,
      relatedTcIds: [],
    });
    setSubtasks([]);
    setShowSubtasks(false);
  };

  if (!isOpen) return null;

  // 미해결 TC만 표시
  const unresolvedTcs = testCases.filter(tc =>
    tc.status !== 'DevDone' && tc.status !== 'ProdDone' && tc.status !== 'Rejected'
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">WBS 기능 추가</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Category */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
              Step 1. 기능 분류
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_CONFIG.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setFormData({ ...formData, category: cat.key })}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${
                    formData.category === cat.key
                      ? cat.color + ' shadow-md scale-105'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Details */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
              Step 2. 기능 상세
            </label>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">기능명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 소셜 로그인 추가"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">상세 설명</label>
              <textarea
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                placeholder="기능에 대한 상세 설명..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">담당자</label>
                <select
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900"
                >
                  {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">난이도</label>
                <div className="flex gap-2">
                  {DIFFICULTY_CONFIG.map(diff => (
                    <button
                      key={diff.key}
                      onClick={() => setFormData({ ...formData, difficulty: diff.key })}
                      className={`flex-1 px-3 py-3 rounded-xl border-2 text-xs font-black transition-all ${
                        formData.difficulty === diff.key
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {'●'.repeat(diff.dots)}{'○'.repeat(3 - diff.dots)}
                      <span className="ml-1">{diff.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related TCs */}
          {unresolvedTcs.length > 0 && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                관련 TC 연결 (선택)
              </label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                {unresolvedTcs.map(tc => (
                  <label
                    key={tc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      formData.relatedTcIds.includes(tc.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.relatedTcIds.includes(tc.id)}
                      onChange={() => handleTcToggle(tc.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{tc.scenario}</p>
                      <p className="text-[10px] text-slate-500">{tc.checkpoint || tc.position} · {tc.assignee}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                      tc.priority === 'High' ? 'bg-red-100 text-red-700' :
                      tc.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {tc.priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                Step 3. 하위 작업 (선택)
              </label>
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                {showSubtasks ? '접기' : '펼치기'}
              </button>
            </div>

            {showSubtasks && (
              <div className="space-y-3">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => handleSubtaskChange(idx, 'name', e.target.value)}
                      placeholder="하위 작업명"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold outline-none"
                    />
                    <select
                      value={st.assignee}
                      onChange={(e) => handleSubtaskChange(idx, 'assignee', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold outline-none"
                    >
                      {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      type="date"
                      value={st.startDate}
                      onChange={(e) => handleSubtaskChange(idx, 'startDate', e.target.value)}
                      className="px-2 py-2 rounded-lg border border-slate-300 text-xs font-bold outline-none w-32"
                    />
                    <span className="text-slate-400">~</span>
                    <input
                      type="date"
                      value={st.endDate}
                      onChange={(e) => handleSubtaskChange(idx, 'endDate', e.target.value)}
                      className="px-2 py-2 rounded-lg border border-slate-300 text-xs font-bold outline-none w-32"
                    />
                    <button
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddSubtask}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-all"
                >
                  + 하위 작업 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="px-8 py-3 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
