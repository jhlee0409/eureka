'use client';

import React, { useState } from 'react';
import { WbsTask, WbsCategory, WbsDifficulty, WbsSubTask, TestCase } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { UserSelect } from '../../../components/ui';

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">WBS 기능 추가</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-all">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1: Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Step 1. 기능 분류
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_CONFIG.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setFormData({ ...formData, category: cat.key })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    formData.category === cat.key
                      ? cat.color + ' shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Details */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Step 2. 기능 상세
            </label>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">기능명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 소셜 로그인 추가"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">상세 설명</label>
              <textarea
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                placeholder="기능에 대한 상세 설명..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">담당자</label>
                <UserSelect
                  value={formData.assignee}
                  onChange={(v) => setFormData({ ...formData, assignee: v })}
                  options={TEAM_MEMBERS}
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">난이도</label>
                <div className="flex gap-1.5">
                  {DIFFICULTY_CONFIG.map(diff => (
                    <button
                      key={diff.key}
                      onClick={() => setFormData({ ...formData, difficulty: diff.key })}
                      className={`flex-1 px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        formData.difficulty === diff.key
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {'●'.repeat(diff.dots)}{'○'.repeat(3 - diff.dots)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related TCs */}
          {unresolvedTcs.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                관련 TC 연결 (선택)
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                {unresolvedTcs.map(tc => (
                  <label
                    key={tc.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      formData.relatedTcIds.includes(tc.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.relatedTcIds.includes(tc.id)}
                      onChange={() => handleTcToggle(tc.id)}
                      className="w-3 h-3 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-900 truncate">{tc.scenario}</p>
                      <p className="text-[9px] text-slate-500">{tc.checkpoint || tc.position} · {tc.assignee}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Step 3. 하위 작업 (선택)
              </label>
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
              >
                {showSubtasks ? '접기' : '펼치기'}
              </button>
            </div>

            {showSubtasks && (
              <div className="space-y-2">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => handleSubtaskChange(idx, 'name', e.target.value)}
                      placeholder="하위 작업명"
                      className="flex-1 px-2 py-1 rounded border border-slate-200 text-[10px] font-medium outline-none"
                    />
                    <UserSelect
                      value={st.assignee}
                      onChange={(v) => handleSubtaskChange(idx, 'assignee', v)}
                      options={TEAM_MEMBERS}
                      size="xs"
                    />
                    <input
                      type="date"
                      value={st.startDate}
                      onChange={(e) => handleSubtaskChange(idx, 'startDate', e.target.value)}
                      className="px-1.5 py-1 rounded border border-slate-200 text-[10px] font-medium outline-none w-28"
                    />
                    <span className="text-slate-400 text-[10px]">~</span>
                    <input
                      type="date"
                      value={st.endDate}
                      onChange={(e) => handleSubtaskChange(idx, 'endDate', e.target.value)}
                      className="px-1.5 py-1 rounded border border-slate-200 text-[10px] font-medium outline-none w-28"
                    />
                    <button
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddSubtask}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-all"
                >
                  + 하위 작업 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
