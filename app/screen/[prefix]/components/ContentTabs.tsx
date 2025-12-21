'use client';

import React from 'react';
import { useScreen } from '../context/ScreenContext';
import { TabType } from '../config/constants';

export function ContentTabs() {
  const { activeTab, setActiveTab, testCases } = useScreen();

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'wbs', label: '기획/개발 (WBS)' },
    { key: 'qa', label: '품질관리 (TC)', count: testCases.length },
  ];

  return (
    <nav className="h-10 border-b border-slate-200 flex items-center px-6 gap-6 shrink-0 bg-white">
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`h-full text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all ${
            activeTab === key
              ? 'border-slate-800 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {label}
          {count !== undefined && ` (${count})`}
        </button>
      ))}
    </nav>
  );
}
