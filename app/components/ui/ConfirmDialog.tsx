'use client';

import React, { useEffect, useCallback } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
}: ConfirmDialogProps) {
  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-amber-100',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mx-auto mb-4`}>
              {style.icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-slate-600 text-center leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-bl-xl"
            >
              {cancelText}
            </button>
            <div className="w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-br-xl ${style.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '확인',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  });

  const confirm = useCallback((options: {
    title?: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || '확인',
        message: options.message,
        variant: options.variant || 'danger',
        onConfirm: () => resolve(true),
      });
    });
  }, []);

  const close = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const DialogComponent = (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={close}
      onConfirm={dialogState.onConfirm}
      title={dialogState.title}
      message={dialogState.message}
      variant={dialogState.variant}
    />
  );

  return { confirm, DialogComponent };
}
