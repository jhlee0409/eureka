'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, QAPriority, QAPosition, IssueType, WbsTask } from '../../../types';
import { TEAM_MEMBERS } from '../hooks/useScreenData';
import { collectDeviceInfo, formatDeviceInfoString, AUTO_COLLECTIBLE_ITEMS, DeviceInfo } from '../../../utils/deviceInfo';

interface TcAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tc: TestCase) => void;
  wbsTasks: WbsTask[];
  originScreenId: string;
}

const ISSUE_TYPE_CONFIG: { key: IssueType; label: string; icon: string; color: string }[] = [
  { key: 'bug', label: '버그', icon: '🐛', color: 'bg-red-100 border-red-300 text-red-700' },
  { key: 'improvement', label: '개선사항', icon: '✨', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { key: 'question', label: '문의사항', icon: '❓', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { key: 'task', label: '작업요청', icon: '📋', color: 'bg-green-100 border-green-300 text-green-700' },
];

const POSITION_CONFIG: { key: QAPosition; label: string; icon: string }[] = [
  { key: 'Design', label: 'Design', icon: '🎨' },
  { key: 'Front-end', label: 'Front-end', icon: '💻' },
  { key: 'Back-end', label: 'Back-end', icon: '⚙️' },
  { key: 'PM', label: 'PM', icon: '📋' },
];

const PRIORITY_CONFIG: { key: QAPriority; label: string; color: string }[] = [
  { key: 'High', label: '높음', color: 'bg-red-500 text-white' },
  { key: 'Medium', label: '보통', color: 'bg-orange-500 text-white' },
  { key: 'Low', label: '낮음', color: 'bg-green-500 text-white' },
];

export function TcAddModal({ isOpen, onClose, onAdd, wbsTasks, originScreenId }: TcAddModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    issueType: 'bug' as IssueType,
    checkpoint: '',
    scenario: '',
    issueContent: '',
    reproductionSteps: '',
    expectedResult: '',
    environment: '',
    position: 'Front-end' as QAPosition,
    priority: 'Medium' as QAPriority,
    assignee: TEAM_MEMBERS[1],
    reporter: TEAM_MEMBERS[0],
    relatedWbsId: '',
    referenceLink: '',
  });

  const [step, setStep] = useState(1);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);

  // 모달 열릴 때 디바이스 정보 자동 수집
  useEffect(() => {
    if (isOpen && !deviceInfo) {
      const info = collectDeviceInfo();
      setDeviceInfo(info);
      // 환경 정보 자동 설정
      setFormData(prev => ({
        ...prev,
        environment: formatDeviceInfoString(info),
      }));
    }
  }, [isOpen, deviceInfo]);

  // 디바이스 정보 새로고침
  const refreshDeviceInfo = () => {
    const info = collectDeviceInfo();
    setDeviceInfo(info);
    setFormData(prev => ({
      ...prev,
      environment: formatDeviceInfoString(info),
    }));
  };

  const handleSubmit = () => {
    if (!formData.scenario.trim()) return;

    const newTC: TestCase = {
      id: crypto.randomUUID(),
      checkpoint: formData.checkpoint,
      scenario: formData.scenario,
      issueContent: formData.issueContent,
      reproductionSteps: formData.reproductionSteps,
      expectedResult: formData.expectedResult,
      environment: formData.environment,
      referenceLink: formData.referenceLink,
      date: today,
      status: 'Reviewing',
      reporter: formData.reporter,
      priority: formData.priority,
      position: formData.position,
      assignee: formData.assignee,
      progress: 'Waiting',
      comments: [],
      originScreenId,
      issueType: formData.issueType,
      relatedWbsId: formData.relatedWbsId || undefined,
      activityLog: [{
        id: crypto.randomUUID(),
        tcId: '',
        action: 'created',
        actor: formData.reporter,
        actorRole: 'qa',
        timestamp: new Date().toISOString(),
      }],
    };

    onAdd(newTC);
    onClose();

    // Reset form
    setFormData({
      issueType: 'bug',
      checkpoint: '',
      scenario: '',
      issueContent: '',
      reproductionSteps: '',
      expectedResult: '',
      environment: '',
      position: 'Front-end',
      priority: 'Medium',
      assignee: TEAM_MEMBERS[1],
      reporter: TEAM_MEMBERS[0],
      relatedWbsId: '',
      referenceLink: '',
    });
    setStep(1);
    setDeviceInfo(null);
    setShowDeviceDetails(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">이슈 등록</h2>
            <p className="text-xs text-slate-500 mt-1">Step {step} / 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  s <= step ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <>
              {/* Issue Type */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  이슈 유형
                </label>
                <div className="flex flex-wrap gap-2">
                  {ISSUE_TYPE_CONFIG.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setFormData({ ...formData, issueType: type.key })}
                      className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${
                        formData.issueType === type.key
                          ? type.color + ' shadow-md scale-105'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  담당 영역
                </label>
                <div className="flex flex-wrap gap-2">
                  {POSITION_CONFIG.map(pos => (
                    <button
                      key={pos.key}
                      onClick={() => setFormData({ ...formData, position: pos.key })}
                      className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${
                        formData.position === pos.key
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pos.icon} {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  우선순위
                </label>
                <div className="flex gap-2">
                  {PRIORITY_CONFIG.map(pri => (
                    <button
                      key={pri.key}
                      onClick={() => setFormData({ ...formData, priority: pri.key })}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-black border-2 transition-all ${
                        formData.priority === pri.key
                          ? pri.color + ' border-transparent shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Checkpoint */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">체크포인트 (위치)</label>
                <input
                  type="text"
                  value={formData.checkpoint}
                  onChange={(e) => setFormData({ ...formData, checkpoint: e.target.value })}
                  placeholder="예: 로그인 버튼, 결제 폼, 헤더..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Scenario */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">이슈 요약 *</label>
                <input
                  type="text"
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  placeholder="버튼 클릭 시 오류 발생"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Reproduction Steps */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">재현 방법</label>
                <textarea
                  value={formData.reproductionSteps}
                  onChange={(e) => setFormData({ ...formData, reproductionSteps: e.target.value })}
                  placeholder="1. 로그인 페이지 접속&#10;2. 이메일 입력&#10;3. 비밀번호 입력 후 로그인 버튼 클릭&#10;4. 오류 발생"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
                />
              </div>

              {/* Expected Result */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">기대 결과</label>
                <textarea
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  placeholder="로그인 성공 후 대시보드로 이동해야 함"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
                />
              </div>

              {/* Issue Content */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">상세 설명</label>
                <textarea
                  value={formData.issueContent}
                  onChange={(e) => setFormData({ ...formData, issueContent: e.target.value })}
                  placeholder="이슈에 대한 상세 설명..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Environment - Auto Collected */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">발생 환경 (자동 수집됨)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeviceDetails(!showDeviceDetails)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      {showDeviceDetails ? '간략히' : '상세보기'}
                    </button>
                    <button
                      type="button"
                      onClick={refreshDeviceInfo}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      새로고침
                    </button>
                  </div>
                </div>

                {/* 자동 수집된 정보 표시 */}
                {deviceInfo && (
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {/* 간략 요약 */}
                    <div className="p-4 flex items-center gap-3">
                      <div className="text-2xl">
                        {deviceInfo.deviceType === 'mobile' ? '📱' : deviceInfo.deviceType === 'tablet' ? '📱' : '🖥️'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">
                          {deviceInfo.browser} {deviceInfo.browserVersion}
                        </p>
                        <p className="text-xs text-slate-500">
                          {deviceInfo.os} · {deviceInfo.viewportSize}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${deviceInfo.online ? 'bg-green-500' : 'bg-red-500'}`} title={deviceInfo.online ? '온라인' : '오프라인'} />
                    </div>

                    {/* 상세 정보 */}
                    {showDeviceDetails && (
                      <div className="border-t border-slate-200 p-4 grid grid-cols-2 gap-3">
                        {AUTO_COLLECTIBLE_ITEMS.map(item => {
                          const value = deviceInfo[item.key as keyof DeviceInfo];
                          if (value === undefined || value === '') return null;
                          return (
                            <div key={item.key} className="flex items-start gap-2">
                              <span className="text-sm">{item.icon}</span>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                <p className="text-xs font-bold text-slate-700 break-all">
                                  {typeof value === 'boolean' ? (value ? '지원' : '미지원') : String(value)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 수동 입력/수정 */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">추가 환경 정보 (수동 입력)</label>
                  <textarea
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    placeholder="추가 환경 정보가 있다면 입력하세요..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 resize-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Assignee & Reporter */}
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">보고자</label>
                  <select
                    value={formData.reporter}
                    onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Related WBS */}
              {wbsTasks.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                    관련 WBS 연결 (선택)
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="relatedWbs"
                        value=""
                        checked={formData.relatedWbsId === ''}
                        onChange={() => setFormData({ ...formData, relatedWbsId: '' })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-500">연결 없음</span>
                    </label>
                    {wbsTasks.map(task => (
                      <label
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          formData.relatedWbsId === task.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="relatedWbs"
                          value={task.id}
                          checked={formData.relatedWbsId === task.id}
                          onChange={() => setFormData({ ...formData, relatedWbsId: task.id })}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{task.name}</p>
                          <p className="text-[10px] text-slate-500">{task.assignee} · {task.status}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Link */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">참조 링크</label>
                <input
                  type="text"
                  value={formData.referenceLink}
                  onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                  placeholder="https://figma.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-3 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-all"
          >
            {step > 1 ? '이전' : '취소'}
          </button>
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && !formData.scenario.trim()}
                className="px-8 py-3 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.scenario.trim()}
                className="px-8 py-3 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                등록
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
