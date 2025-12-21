# 도메인 상수 전체 목록 및 가이드

## 상태 설정 (Status Config)

### QA 상태

```typescript
// app/screen/[prefix]/config/constants.ts

export const STATUS_CONFIG = {
  'Reviewing': {
    label: '검토중',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    description: '테스트케이스 검토 진행중'
  },
  'DevError': {
    label: 'Dev 오류',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    description: '개발 환경에서 오류 발견'
  },
  'ProdError': {
    label: 'Prod 오류',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    description: '운영 환경에서 오류 발견'
  },
  'DevDone': {
    label: 'Dev 완료',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    description: '개발 환경 테스트 완료'
  },
  'ProdDone': {
    label: 'Prod 완료',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    description: '운영 환경 테스트 완료'
  },
  'Hold': {
    label: '보류',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: '검토 일시 보류'
  },
  'Rejected': {
    label: '반려',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    description: '테스트케이스 반려됨'
  },
  'Duplicate': {
    label: '중복',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: '다른 케이스와 중복'
  }
} as const;

export type Status = keyof typeof STATUS_CONFIG;
```

### QA 진행 단계

```typescript
export const PROGRESS_CONFIG = {
  'Waiting': {
    label: '대기',
    order: 0,
    color: 'gray',
    icon: '⏳'
  },
  'Checking': {
    label: '확인중',
    order: 1,
    color: 'yellow',
    icon: '🔍'
  },
  'Working': {
    label: '작업중',
    order: 2,
    color: 'blue',
    icon: '🔧'
  },
  'DevDeployed': {
    label: 'Dev 배포',
    order: 3,
    color: 'purple',
    icon: '🚀'
  },
  'ProdDeployed': {
    label: 'Prod 배포',
    order: 4,
    color: 'green',
    icon: '✅'
  }
} as const;

export type QAProgress = keyof typeof PROGRESS_CONFIG;

// 진행 순서 배열
export const PROGRESS_ORDER: QAProgress[] = [
  'Waiting',
  'Checking',
  'Working',
  'DevDeployed',
  'ProdDeployed'
];
```

## 스크린 접두사 (Screen Prefixes)

```typescript
export const SCREEN_PREFIXES = {
  'AUTO': {
    label: '자동화 화면',
    description: '자동화 테스트가 적용된 화면',
    color: 'blue'
  },
  'PSET': {
    label: '설정 화면',
    description: '사용자 설정 관련 화면',
    color: 'gray'
  },
  'LINK': {
    label: '연결 화면',
    description: '외부 연동 관련 화면',
    color: 'purple'
  },
  'MENU': {
    label: '메뉴 화면',
    description: '네비게이션 메뉴 화면',
    color: 'green'
  },
  'HOME': {
    label: '홈 화면',
    description: '메인/홈 화면',
    color: 'indigo'
  },
  'DASH': {
    label: '대시보드',
    description: '대시보드/현황 화면',
    color: 'cyan'
  },
  'SRCH': {
    label: '검색 화면',
    description: '검색 기능 화면',
    color: 'yellow'
  },
  'LIST': {
    label: '목록 화면',
    description: '리스트/목록 화면',
    color: 'orange'
  },
  'DETL': {
    label: '상세 화면',
    description: '상세 정보 화면',
    color: 'teal'
  },
  'EDIT': {
    label: '편집 화면',
    description: '생성/수정 폼 화면',
    color: 'pink'
  }
} as const;

export type ScreenPrefix = keyof typeof SCREEN_PREFIXES;
```

## WBS 관련 상수

```typescript
export const WBS_STATUS = {
  'Planning': {
    label: '계획',
    color: 'gray'
  },
  'InProgress': {
    label: '진행중',
    color: 'blue'
  },
  'Done': {
    label: '완료',
    color: 'green'
  },
  'Blocked': {
    label: '차단됨',
    color: 'red'
  }
} as const;

export const PRIORITY_CONFIG = {
  'high': {
    label: '높음',
    color: 'text-red-600',
    icon: '🔴'
  },
  'medium': {
    label: '보통',
    color: 'text-yellow-600',
    icon: '🟡'
  },
  'low': {
    label: '낮음',
    color: 'text-green-600',
    icon: '🟢'
  }
} as const;
```

## 팀원 목록

```typescript
export const TEAM_MEMBERS = [
  { id: 'user1', name: '홍길동', role: 'QA' },
  { id: 'user2', name: '김철수', role: 'Developer' },
  { id: 'user3', name: '이영희', role: 'Developer' },
  { id: 'user4', name: '박지성', role: 'PM' }
] as const;

export const TEAM_ROLES = {
  'QA': { label: 'QA 엔지니어', color: 'purple' },
  'Developer': { label: '개발자', color: 'blue' },
  'PM': { label: '프로젝트 매니저', color: 'green' },
  'Designer': { label: '디자이너', color: 'pink' }
} as const;
```

## 테마 및 UI 설정

```typescript
export const THEME_CONFIG = {
  colors: {
    primary: '#3b82f6',    // blue-500
    secondary: '#6b7280',  // gray-500
    success: '#22c55e',    // green-500
    warning: '#eab308',    // yellow-500
    error: '#ef4444',      // red-500
    info: '#06b6d4'        // cyan-500
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  }
} as const;
```

## 유틸리티 함수

```typescript
// 상태 라벨 가져오기
export function getStatusLabel(status: Status): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

// 상태 색상 클래스 가져오기
export function getStatusColorClass(status: Status): string {
  const config = STATUS_CONFIG[status];
  return config ? `${config.color} ${config.bgColor}` : '';
}

// 진행 단계 인덱스 가져오기
export function getProgressIndex(progress: QAProgress): number {
  return PROGRESS_ORDER.indexOf(progress);
}

// 다음 진행 단계 가져오기
export function getNextProgress(current: QAProgress): QAProgress | null {
  const index = getProgressIndex(current);
  return index < PROGRESS_ORDER.length - 1
    ? PROGRESS_ORDER[index + 1]
    : null;
}

// 스크린 접두사 유효성 검사
export function isValidPrefix(prefix: string): prefix is ScreenPrefix {
  return prefix in SCREEN_PREFIXES;
}
```
