#!/bin/bash
#
# 드롭다운 컴포넌트 템플릿 생성 스크립트
#
# 사용법:
#   ./generate_dropdown.sh <ComponentName> [output_dir]
#
# 예시:
#   ./generate_dropdown.sh StatusSelect ./components
#   ./generate_dropdown.sh UserPicker ./app/components/ui
#

set -e

COMPONENT_NAME="${1:-Dropdown}"
OUTPUT_DIR="${2:-.}"

# 파스칼 케이스를 케밥 케이스로 변환
KEBAB_NAME=$(echo "$COMPONENT_NAME" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE="$OUTPUT_DIR/$COMPONENT_NAME.tsx"

cat > "$OUTPUT_FILE" << 'TEMPLATE'
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId
} from 'react';
import { createPortal } from 'react-dom';

// ============================================================
// Types
// ============================================================

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface COMPONENT_NAMEProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

// ============================================================
// Hooks
// ============================================================

function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  onClickOutside: () => void,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside = refs.every(
        ref => ref.current && !ref.current.contains(target)
      );
      if (isOutside) onClickOutside();
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [refs, onClickOutside, isActive]);
}

function useEscapeKey(onEscape: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}

function useAnchorPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean
): Position {
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    width: 0
  });

  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, anchorRef]);

  return position;
}

// ============================================================
// Component
// ============================================================

export default function COMPONENT_NAME({
  options,
  value,
  onChange,
  label,
  placeholder = '선택하세요',
  disabled = false,
  className = ''
}: COMPONENT_NAMEProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedOption = options.find(o => o.value === value);
  const selectedIndex = options.findIndex(o => o.value === value);
  const position = useAnchorPosition(triggerRef, isOpen);

  // 클라이언트 마운트 확인 (Portal용)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 열릴 때 선택된 항목 하이라이트
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // 외부 클릭 닫기
  useClickOutside(
    [triggerRef, contentRef],
    () => setIsOpen(false),
    isOpen
  );

  // ESC 닫기
  useEscapeKey(() => setIsOpen(false), isOpen);

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            Math.min(prev + 1, options.length - 1)
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => Math.max(prev - 1, 0));
          break;

        case 'Home':
          event.preventDefault();
          setHighlightedIndex(0);
          break;

        case 'End':
          event.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          break;

        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, options, highlightedIndex, onChange]
  );

  const handleSelect = (option: Option) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={className}>
      {label && (
        <label
          id={`${id}-label`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-3 py-2 text-left
          border border-gray-300 rounded-md
          bg-white shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          flex items-center justify-between
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {mounted && isOpen && createPortal(
        <ul
          ref={contentRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${id}-option-${highlightedIndex}`
              : undefined
          }
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          className="
            bg-white border border-gray-300 rounded-md shadow-lg
            max-h-60 overflow-auto
            focus:outline-none
          "
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 9999
          }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={value === option.value}
              aria-disabled={option.disabled}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                px-3 py-2 cursor-pointer
                ${index === highlightedIndex ? 'bg-blue-50' : ''}
                ${value === option.value ? 'bg-blue-100 font-medium' : ''}
                ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}
              `}
            >
              {option.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
TEMPLATE

# 컴포넌트 이름 치환
sed -i "s/COMPONENT_NAME/$COMPONENT_NAME/g" "$OUTPUT_FILE"

echo "✅ 생성 완료: $OUTPUT_FILE"
echo ""
echo "사용 예시:"
echo ""
echo "import $COMPONENT_NAME from './$COMPONENT_NAME';"
echo ""
echo "const options = ["
echo "  { value: 'option1', label: '옵션 1' },"
echo "  { value: 'option2', label: '옵션 2' },"
echo "  { value: 'option3', label: '옵션 3', disabled: true },"
echo "];"
echo ""
echo "<$COMPONENT_NAME"
echo "  options={options}"
echo "  value={selectedValue}"
echo "  onChange={setSelectedValue}"
echo "  label=\"라벨\""
echo "  placeholder=\"선택하세요\""
echo "/>"
