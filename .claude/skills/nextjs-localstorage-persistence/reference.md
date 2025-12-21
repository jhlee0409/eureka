# SSR/CSR 라이프사이클 및 하이드레이션 가이드

## Next.js 렌더링 이해하기

### 서버 사이드 렌더링 (SSR)

```
1. 서버에서 React 컴포넌트 렌더링
2. HTML 문자열 생성
3. 클라이언트로 HTML 전송
4. 클라이언트에서 JavaScript 로드
5. 하이드레이션: React가 기존 HTML에 이벤트 리스너 연결
```

### 하이드레이션 에러 원인

```tsx
// ❌ 서버와 클라이언트 결과가 다름
function Component() {
  // 서버: undefined (window 없음)
  // 클라이언트: "value"
  const value = localStorage.getItem('key');

  return <div>{value}</div>;
}
```

**에러 메시지**:
```
Error: Hydration failed because the initial UI does not match
what was rendered on the server.
```

## localStorage 안전하게 사용하기

### 패턴 1: useEffect 내에서 사용

```tsx
'use client';

function Component() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // 클라이언트에서만 실행
    const stored = localStorage.getItem('key');
    setData(stored);
  }, []);

  return <div>{data ?? 'Loading...'}</div>;
}
```

### 패턴 2: window 객체 체크

```tsx
function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
}
```

### 패턴 3: 하이드레이션 상태 관리

```tsx
'use client';

function Component() {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    setData(localStorage.getItem('key'));
  }, []);

  // 하이드레이션 전에는 로딩 표시
  if (!hydrated) {
    return <div>Loading...</div>;
  }

  return <div>{data}</div>;
}
```

### 패턴 4: 커스텀 훅

```tsx
'use client';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// 사용
function Component() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  // ...
}
```

## 동적 임포트 (SSR 비활성화)

특정 컴포넌트에서 SSR 완전히 비활성화:

```tsx
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
);

function Page() {
  return (
    <div>
      <h1>Server Rendered</h1>
      <ClientOnlyComponent /> {/* 클라이언트에서만 렌더링 */}
    </div>
  );
}
```

## 에러 핸들링

### localStorage 사용 불가 상황

```tsx
function safeLocalStorage() {
  const isAvailable = (() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })();

  return {
    getItem: (key: string): string | null => {
      if (!isAvailable) return null;
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (!isAvailable) return;
      localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (!isAvailable) return;
      localStorage.removeItem(key);
    }
  };
}
```

### 용량 초과 처리

```tsx
function setItemWithQuotaHandling(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // 오래된 데이터 정리 또는 사용자에게 알림
      return false;
    }
    throw e;
  }
}
```

## JSON 직렬화/역직렬화

### 타입-안전 래퍼

```tsx
function getJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}
```

## 키 관리

### 중앙화된 키 정의

```tsx
// storage-keys.ts
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'app:user:preferences',
  AUTH_TOKEN: 'app:auth:token',
  THEME: 'app:ui:theme',
  RECENT_ITEMS: 'app:cache:recent',

  // 동적 키 생성 함수
  screenData: (screenId: string) => `app:screen:${screenId}`,
  testCases: (screenId: string) => `app:testcases:${screenId}`,
} as const;

// 사용
localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
localStorage.setItem(STORAGE_KEYS.screenData('AUTO_0001'), JSON.stringify(data));
```

## 참고 자료

- [LocalStorage in Next.js 14: Best Practices](https://codefiner.com/post/local-storage-in-next-js-14-best-practices-and)
- [Fix Next.js Hydration Error with Zustand](https://medium.com/@koalamango/fix-next-js-hydration-error-with-zustand-state-management-0ce51a0176ad)
- [State Management with Next.js App Router](https://www.pronextjs.dev/tutorials/state-management)
