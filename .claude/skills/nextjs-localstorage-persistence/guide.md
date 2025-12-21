# 타입-안전 스토리지 유틸리티 및 Zustand 통합

## 완전한 타입-안전 스토리지 유틸리티

### 스토리지 스키마 정의

```tsx
// storage/schema.ts
import { z } from 'zod';

// 스키마 정의
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  notifications: z.boolean()
});

export const ScreenDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  testCases: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.string()
  }))
});

// 타입 추론
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type ScreenData = z.infer<typeof ScreenDataSchema>;
```

### 타입-안전 스토리지 클래스

```tsx
// storage/TypedStorage.ts
import { z } from 'zod';

interface StorageConfig<T> {
  key: string;
  schema: z.ZodType<T>;
  defaultValue: T;
  version?: number;
}

export class TypedStorage<T> {
  private config: StorageConfig<T>;

  constructor(config: StorageConfig<T>) {
    this.config = config;
  }

  private get versionedKey(): string {
    return this.config.version
      ? `${this.config.key}:v${this.config.version}`
      : this.config.key;
  }

  get(): T {
    if (typeof window === 'undefined') {
      return this.config.defaultValue;
    }

    try {
      const raw = localStorage.getItem(this.versionedKey);
      if (!raw) return this.config.defaultValue;

      const parsed = JSON.parse(raw);
      const validated = this.config.schema.parse(parsed);
      return validated;

    } catch (error) {
      console.error(`Storage validation failed for ${this.config.key}:`, error);
      return this.config.defaultValue;
    }
  }

  set(value: T): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // 저장 전 검증
      this.config.schema.parse(value);
      localStorage.setItem(this.versionedKey, JSON.stringify(value));
      return true;

    } catch (error) {
      console.error(`Failed to save ${this.config.key}:`, error);
      return false;
    }
  }

  update(updater: (current: T) => T): boolean {
    const current = this.get();
    const updated = updater(current);
    return this.set(updated);
  }

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.versionedKey);
  }

  // 마이그레이션 지원
  migrate(fromVersion: number, migrator: (old: unknown) => T): boolean {
    if (typeof window === 'undefined') return false;

    const oldKey = `${this.config.key}:v${fromVersion}`;
    const oldRaw = localStorage.getItem(oldKey);

    if (!oldRaw) return false;

    try {
      const oldData = JSON.parse(oldRaw);
      const migrated = migrator(oldData);
      this.set(migrated);
      localStorage.removeItem(oldKey);
      return true;

    } catch (error) {
      console.error(`Migration failed for ${this.config.key}:`, error);
      return false;
    }
  }
}

// 사용 예시
export const userPreferencesStorage = new TypedStorage({
  key: 'user:preferences',
  schema: UserPreferencesSchema,
  defaultValue: {
    theme: 'system',
    language: 'ko',
    notifications: true
  },
  version: 1
});
```

## Zustand Persist 통합

### 기본 설정

```tsx
// store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  recentScreens: string[];

  setTheme: (theme: AppState['theme']) => void;
  toggleSidebar: () => void;
  addRecentScreen: (screenId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      recentScreens: [],

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      addRecentScreen: (screenId) => set((state) => ({
        recentScreens: [
          screenId,
          ...state.recentScreens.filter(id => id !== screenId)
        ].slice(0, 10)
      })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 지속할 필드만 선택
        theme: state.theme,
        recentScreens: state.recentScreens,
        // sidebarOpen은 제외 (세션마다 초기화)
      }),
    }
  )
);
```

### 하이드레이션 처리

```tsx
// hooks/useHydration.ts
import { useEffect, useState } from 'react';

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

// 컴포넌트에서 사용
function ThemeProvider({ children }) {
  const hydrated = useHydration();
  const theme = useAppStore((state) => state.theme);

  // 하이드레이션 전에는 시스템 기본값 사용
  const appliedTheme = hydrated ? theme : 'system';

  return (
    <div data-theme={appliedTheme}>
      {children}
    </div>
  );
}
```

### Zustand 하이드레이션 상태 확인

```tsx
// store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // ... state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ... other state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'app-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// 사용
function Component() {
  const hasHydrated = useAppStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return <Loading />;
  }

  return <Content />;
}
```

## React Context와 통합

### 스토리지 Provider

```tsx
// context/StorageContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface StorageContextType<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  isLoading: boolean;
}

function createStorageContext<T>(key: string, defaultValue: T) {
  const Context = createContext<StorageContextType<T> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [data, setDataState] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setDataState(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const setData = (value: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const newValue = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value;

        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.error(`Failed to save ${key}:`, error);
        }

        return newValue;
      });
    };

    return (
      <Context.Provider value={{ data, setData, isLoading }}>
        {children}
      </Context.Provider>
    );
  }

  function useStorage() {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useStorage must be used within StorageProvider');
    }
    return context;
  }

  return { Provider, useStorage };
}

// 사용
export const {
  Provider: ScreenDataProvider,
  useStorage: useScreenData
} = createStorageContext<ScreenData | null>('screen-data', null);
```

## 디버깅 유틸리티

```tsx
// utils/storage-debug.ts

export function inspectStorage(): void {
  if (typeof window === 'undefined') return;

  console.group('📦 LocalStorage Contents');

  const keys = Object.keys(localStorage);
  const totalSize = keys.reduce((size, key) => {
    const item = localStorage.getItem(key) || '';
    return size + key.length + item.length;
  }, 0);

  console.log(`Total items: ${keys.length}`);
  console.log(`Approximate size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('---');

  keys.sort().forEach((key) => {
    const value = localStorage.getItem(key);
    const size = ((key.length + (value?.length || 0)) / 1024).toFixed(2);

    try {
      const parsed = JSON.parse(value || '');
      console.log(`${key} (${size} KB):`, parsed);
    } catch {
      console.log(`${key} (${size} KB):`, value);
    }
  });

  console.groupEnd();
}

export function clearAppStorage(prefix: string = 'app:'): void {
  if (typeof window === 'undefined') return;

  Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    });
}

// 개발 중 사용
// inspectStorage();
// clearAppStorage('app:');
```
