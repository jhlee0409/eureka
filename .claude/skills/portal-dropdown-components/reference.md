# Portal 아키텍처 및 포지셔닝 가이드

## Portal이 필요한 이유

### CSS Overflow 문제

```
┌─────────────────────────────────────┐
│  Container (overflow: hidden)       │
│  ┌─────────────────────────────┐    │
│  │  Button [▼]                 │    │
│  │  ┌──────────────┐           │    │
│  │  │ Dropdown     │ ← 잘림!   │    │
│  │  │ Option 1     │           │    │
│  └──│─Option 2─────│───────────┘    │
│     └──────────────┘ (보이지 않음)   │
└─────────────────────────────────────┘
```

### Stacking Context 문제

- `z-index`는 같은 stacking context 내에서만 작동
- 부모에 `position: relative` + `z-index` 있으면 새로운 context 생성
- 자식의 z-index가 아무리 높아도 부모 context를 벗어날 수 없음

### Portal 해결책

```
┌─────────────────────────────────────┐
│  Container (overflow: hidden)       │
│  ┌─────────────────────────────┐    │
│  │  Button [▼] ─────────┐      │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                          │
                          ▼
┌──────────────┐ (document.body에 직접 렌더링)
│ Dropdown     │
│ Option 1     │
│ Option 2     │
└──────────────┘
```

## 기본 Portal 구현

### createPortal 사용

```tsx
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface PortalProps {
  children: React.ReactNode;
  container?: Element;
}

function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    children,
    container ?? document.body
  );
}
```

## 포지셔닝 전략

### 앵커 요소 기준 위치 계산

```tsx
interface Position {
  top: number;
  left: number;
  width?: number;
}

function calculatePosition(
  anchorRect: DOMRect,
  placement: 'bottom' | 'top' | 'left' | 'right' = 'bottom'
): Position {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  switch (placement) {
    case 'bottom':
      return {
        top: anchorRect.bottom + scrollY,
        left: anchorRect.left + scrollX,
        width: anchorRect.width
      };
    case 'top':
      return {
        top: anchorRect.top + scrollY,
        left: anchorRect.left + scrollX,
        width: anchorRect.width
      };
    case 'left':
      return {
        top: anchorRect.top + scrollY,
        left: anchorRect.left + scrollX
      };
    case 'right':
      return {
        top: anchorRect.top + scrollY,
        left: anchorRect.right + scrollX
      };
  }
}
```

### 뷰포트 경계 처리

```tsx
function adjustForViewport(
  position: Position,
  dropdownRect: { width: number; height: number }
): Position {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  let { top, left, width } = position;

  // 오른쪽 경계
  if (left + (width ?? dropdownRect.width) > viewport.width) {
    left = viewport.width - (width ?? dropdownRect.width) - 8;
  }

  // 왼쪽 경계
  if (left < 8) {
    left = 8;
  }

  // 아래쪽 경계 (위로 플립)
  if (top + dropdownRect.height > viewport.height + window.scrollY) {
    top = top - dropdownRect.height - 8;
  }

  return { top, left, width };
}
```

## 스크롤 핸들링

### 스크롤 시 위치 업데이트

```tsx
function useAnchorPosition(
  anchorRef: React.RefObject<HTMLElement>,
  isOpen: boolean
) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition(calculatePosition(rect));
    };

    updatePosition();

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, anchorRef]);

  return position;
}
```

### 스크롤 시 닫기 옵션

```tsx
function useCloseOnScroll(
  isOpen: boolean,
  onClose: () => void,
  closeOnScroll: boolean = true
) {
  useEffect(() => {
    if (!isOpen || !closeOnScroll) return;

    const handleScroll = (e: Event) => {
      // 드롭다운 자체 스크롤은 무시
      if ((e.target as Element)?.closest?.('[data-dropdown-content]')) {
        return;
      }
      onClose();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, onClose, closeOnScroll]);
}
```

## 외부 클릭 감지

```tsx
function useClickOutside(
  refs: React.RefObject<HTMLElement>[],
  onClickOutside: () => void,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      const isOutside = refs.every(ref =>
        ref.current && !ref.current.contains(target)
      );

      if (isOutside) {
        onClickOutside();
      }
    };

    // mousedown 사용 (클릭 완료 전에 감지)
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [refs, onClickOutside, isActive]);
}
```

## ESC 키 닫기

```tsx
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
```

## 완전한 드롭다운 구현

```tsx
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: 'bottom' | 'top';
  closeOnScroll?: boolean;
  closeOnClickOutside?: boolean;
}

function Dropdown({
  trigger,
  children,
  placement = 'bottom',
  closeOnScroll = true,
  closeOnClickOutside = true
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const position = useAnchorPosition(triggerRef, isOpen);

  useClickOutside(
    [triggerRef, contentRef],
    () => setIsOpen(false),
    isOpen && closeOnClickOutside
  );

  useEscapeKey(() => setIsOpen(false), isOpen);
  useCloseOnScroll(isOpen, () => setIsOpen(false), closeOnScroll);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {trigger}
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            data-dropdown-content
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999
            }}
            role="listbox"
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}
```

## 참고 자료

- [Teleportation in React: Positioning, Stacking Context, and Portals](https://www.developerway.com/posts/positioning-and-portals-in-react)
- [React Portals: The Fix for Scrollable CSS Overflow](https://medium.com/@haridharanka20/a-real-world-css-challenge-addressed-through-a-powerful-react-feature-d872920c0eb0)
- [React Portals Official Docs](https://legacy.reactjs.org/docs/portals.html)
