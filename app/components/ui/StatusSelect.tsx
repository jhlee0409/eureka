'use client';

import React, { useState, useRef, useEffect } from 'react';

// Status configurations with colors
export const STATUS_CONFIG = {
  // WBS Status
  'Planning': { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', label: 'Planning' },
  'In Progress': { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: 'In Progress' },
  'Done': { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', label: 'Done' },

  // QA Status
  'Reviewing': { color: 'bg-slate-400', textColor: 'text-slate-700', bgColor: 'bg-slate-50', label: '검토중' },
  'DevError': { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', label: 'Dev 오류' },
  'ProdError': { color: 'bg-rose-600', textColor: 'text-rose-700', bgColor: 'bg-rose-50', label: 'Prod 오류' },
  'DevDone': { color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', label: 'Dev 완료' },
  'ProdDone': { color: 'bg-green-600', textColor: 'text-green-700', bgColor: 'bg-green-50', label: 'Prod 완료' },
  'Hold': { color: 'bg-gray-400', textColor: 'text-gray-700', bgColor: 'bg-gray-50', label: '보류' },
  'Rejected': { color: 'bg-red-400', textColor: 'text-red-700', bgColor: 'bg-red-50', label: '반려' },
  'Duplicate': { color: 'bg-purple-400', textColor: 'text-purple-700', bgColor: 'bg-purple-50', label: '중복' },

  // QA Progress
  'Waiting': { color: 'bg-slate-300', textColor: 'text-slate-600', bgColor: 'bg-slate-50', label: '대기' },
  'Checking': { color: 'bg-blue-400', textColor: 'text-blue-700', bgColor: 'bg-blue-50', label: '확인중' },
  'Working': { color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: '작업중' },
  'DevDeployed': { color: 'bg-cyan-500', textColor: 'text-cyan-700', bgColor: 'bg-cyan-50', label: 'Dev 배포' },
  'ProdDeployed': { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', label: 'Prod 배포' },

  // Priority
  'High': { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', label: 'High' },
  'Medium': { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: 'Medium' },
  'Low': { color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50', label: 'Low' },

  // Position
  'Front-end': { color: 'bg-sky-500', textColor: 'text-sky-700', bgColor: 'bg-sky-50', label: 'Front-end' },
  'Back-end': { color: 'bg-violet-500', textColor: 'text-violet-700', bgColor: 'bg-violet-50', label: 'Back-end' },
  'Design': { color: 'bg-pink-500', textColor: 'text-pink-700', bgColor: 'bg-pink-50', label: 'Design' },
  'PM': { color: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50', label: 'PM' },

  // WBS Category
  'ui': { color: 'bg-pink-500', textColor: 'text-pink-700', bgColor: 'bg-pink-50', label: 'UI' },
  'feature': { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', label: 'Feature' },
  'bugfix': { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', label: 'Bugfix' },
  'planning': { color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50', label: 'Planning' },
  'optimization': { color: 'bg-teal-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50', label: 'Optimization' },

  // Difficulty
  'easy': { color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', label: 'Easy' },
  'medium': { color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: 'Medium' },
  'hard': { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', label: 'Hard' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

interface StatusSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'minimal' | 'badge';
  className?: string;
  disabled?: boolean;
}

export function StatusSelect<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  variant = 'default',
  className = '',
  disabled = false,
}: StatusSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const config = STATUS_CONFIG[value as StatusKey] || {
    color: 'bg-slate-400',
    textColor: 'text-slate-700',
    bgColor: 'bg-slate-50',
    label: value
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-2.5 py-1.5 text-xs',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 rounded-md font-medium transition-all
          ${sizeClasses[size]}
          ${variant === 'badge'
            ? `${config.bgColor} ${config.textColor}`
            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`${dotSizes[size]} rounded-full ${config.color} shrink-0`} />
        <span className="truncate">{config.label}</span>
        {!disabled && (
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[140px] bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-in fade-in zoom-in duration-150">
          {options.map((option) => {
            const optConfig = STATUS_CONFIG[option as StatusKey] || {
              color: 'bg-slate-400',
              textColor: 'text-slate-700',
              bgColor: 'bg-slate-50',
              label: option
            };
            const isSelected = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors
                  ${isSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}
                `}
              >
                <span className={`w-2 h-2 rounded-full ${optConfig.color} shrink-0`} />
                <span className="text-slate-700">{optConfig.label}</span>
                {isSelected && (
                  <svg className="w-3 h-3 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
