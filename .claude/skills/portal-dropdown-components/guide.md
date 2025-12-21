# 접근성 및 키보드 네비게이션 가이드

## ARIA 속성

### 드롭다운 버튼

```tsx
<button
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-controls="dropdown-content"
  aria-label="옵션 선택"
>
  {selectedLabel}
</button>
```

### 드롭다운 콘텐츠

```tsx
<ul
  id="dropdown-content"
  role="listbox"
  aria-label="옵션 목록"
  tabIndex={-1}
>
  {options.map((option, index) => (
    <li
      key={option.value}
      role="option"
      aria-selected={selectedIndex === index}
      tabIndex={isOpen ? 0 : -1}
    >
      {option.label}
    </li>
  ))}
</ul>
```

## 키보드 네비게이션

### 지원해야 할 키

| 키 | 동작 |
|---|------|
| Enter / Space | 선택 또는 열기/닫기 |
| Escape | 닫기 |
| Arrow Down | 다음 항목으로 이동 |
| Arrow Up | 이전 항목으로 이동 |
| Home | 첫 번째 항목으로 |
| End | 마지막 항목으로 |
| Tab | 포커스 이동 (닫기) |

### 구현

```tsx
function useKeyboardNavigation(
  isOpen: boolean,
  options: Option[],
  selectedIndex: number,
  onSelect: (index: number) => void,
  onClose: () => void
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        onSelect(Math.min(selectedIndex + 1, options.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        onSelect(Math.max(selectedIndex - 1, 0));
        break;

      case 'Home':
        event.preventDefault();
        onSelect(0);
        break;

      case 'End':
        event.preventDefault();
        onSelect(options.length - 1);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        // 현재 선택 확정
        onClose();
        break;

      case 'Escape':
        event.preventDefault();
        onClose();
        break;

      case 'Tab':
        // 포커스 이동 시 닫기
        onClose();
        break;
    }
  }, [isOpen, options.length, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

## 포커스 관리

### 열릴 때 포커스 이동

```tsx
function Dropdown({ isOpen, contentRef }) {
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // 첫 번째 옵션 또는 선택된 옵션에 포커스
      const firstOption = contentRef.current.querySelector('[role="option"]');
      firstOption?.focus();
    }
  }, [isOpen]);
}
```

### 닫힐 때 포커스 복원

```tsx
function Dropdown({ triggerRef, isOpen, onClose }) {
  const handleClose = useCallback(() => {
    onClose();
    // 트리거 버튼으로 포커스 복원
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);
}
```

## 포커스 트랩 (모달용)

```tsx
function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref, isActive]);
}
```

## 스크린 리더 지원

### Live Region 알림

```tsx
function DropdownWithAnnouncement({ options, selectedIndex }) {
  return (
    <>
      {/* 스크린 리더용 알림 */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {options[selectedIndex]?.label} 선택됨
      </div>

      {/* 드롭다운 UI */}
      <Dropdown>...</Dropdown>
    </>
  );
}
```

### sr-only CSS

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 완전한 접근성 지원 Select

```tsx
interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

function AccessibleSelect({
  options,
  value,
  onChange,
  label,
  placeholder = '선택하세요'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedOption = options.find(o => o.value === value);
  const selectedIndex = options.findIndex(o => o.value === value);

  // 열릴 때 선택된 항목 하이라이트
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // 키보드 네비게이션
  useKeyboardNavigation(
    isOpen,
    options,
    highlightedIndex,
    setHighlightedIndex,
    () => {
      if (highlightedIndex >= 0) {
        onChange(options[highlightedIndex].value);
      }
      setIsOpen(false);
    }
  );

  return (
    <div>
      <label id={`${id}-label`} className="block mb-1">
        {label}
      </label>

      <button
        ref={triggerRef}
        type="button"
        aria-labelledby={`${id}-label`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded text-left"
      >
        {selectedOption?.label || placeholder}
      </button>

      {isOpen && (
        <Portal>
          <ul
            ref={contentRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${id}-option-${highlightedIndex}`
                : undefined
            }
            className="absolute bg-white border rounded shadow-lg"
            style={/* position styles */}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  px-3 py-2 cursor-pointer
                  ${index === highlightedIndex ? 'bg-blue-100' : ''}
                  ${value === option.value ? 'font-bold' : ''}
                `}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </Portal>
      )}
    </div>
  );
}
```

## 테스트 체크리스트

- [ ] 키보드만으로 열기/닫기/선택 가능
- [ ] ESC로 닫기 가능
- [ ] 화살표 키로 옵션 탐색 가능
- [ ] Enter/Space로 선택 가능
- [ ] 스크린 리더가 현재 상태 읽음
- [ ] 포커스 표시가 명확함
- [ ] 닫힐 때 포커스가 트리거로 복원됨
