'use client';

import React, { useState, useRef, useEffect } from 'react';

// User avatar color generator
function getUserColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  size?: 'xs' | 'sm' | 'md';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserSelect({
  value,
  onChange,
  options,
  size = 'sm',
  placeholder = '담당자 선택',
  className = '',
  disabled = false,
}: UserSelectProps) {
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

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-2.5 py-1.5 text-xs',
  };

  const avatarSizes = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-6 h-6 text-[10px]',
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 rounded-md font-medium transition-all
          bg-white border border-slate-200 text-slate-700 hover:border-slate-300
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {value ? (
          <>
            <span className={`${avatarSizes[size]} rounded-full ${getUserColor(value)} text-white flex items-center justify-center font-bold shrink-0`}>
              {getInitial(value)}
            </span>
            <span className="truncate">{value}</span>
          </>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
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
                <span className={`w-5 h-5 rounded-full ${getUserColor(option)} text-white flex items-center justify-center font-bold text-[9px] shrink-0`}>
                  {getInitial(option)}
                </span>
                <span className="text-slate-700">{option}</span>
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
