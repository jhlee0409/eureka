# 새 상수 추가 및 수정 패턴

## 상수 추가 체크리스트

새 상수를 추가할 때 다음 사항을 확인하세요:

- [ ] 중앙 상수 파일 (`constants.ts`)에 정의 추가
- [ ] TypeScript 타입 업데이트
- [ ] 관련 유틸리티 함수 업데이트
- [ ] 사용하는 컴포넌트에서 import 확인
- [ ] 한글 라벨 추가

## 새 상태 추가

### 1. STATUS_CONFIG에 추가

```typescript
// app/screen/[prefix]/config/constants.ts

export const STATUS_CONFIG = {
  // 기존 상태들...

  // 새 상태 추가
  'InReview': {
    label: '재검토',           // 한글 라벨
    color: 'text-orange-700',  // 텍스트 색상
    bgColor: 'bg-orange-100',  // 배경 색상
    borderColor: 'border-orange-300',
    description: '재검토 필요'
  }
} as const;
```

### 2. 타입 자동 추론 확인

```typescript
// Status 타입은 자동으로 업데이트됨
export type Status = keyof typeof STATUS_CONFIG;
// 이제 'InReview'도 Status 타입에 포함
```

### 3. 상태 전이 규칙 업데이트

```typescript
// qa-workflow-manager 스킬의 전이 규칙도 업데이트 필요
export const VALID_TRANSITIONS = {
  // ...
  'InReview': ['Reviewing', 'DevDone', 'Rejected'],
  // 기존 상태에서 새 상태로의 전이 추가
  'DevDone': ['ProdError', 'ProdDone', 'Hold', 'InReview', 'Duplicate'],
};
```

## 새 스크린 접두사 추가

### 1. SCREEN_PREFIXES에 추가

```typescript
export const SCREEN_PREFIXES = {
  // 기존 접두사들...

  // 새 접두사 추가
  'RPRT': {
    label: '리포트 화면',
    description: '보고서 및 통계 화면',
    color: 'indigo'
  }
} as const;
```

### 2. 접두사 검증 함수 확인

```typescript
// isValidPrefix 함수는 자동으로 새 접두사 인식
if (isValidPrefix('RPRT')) {
  // 유효함
}
```

## 새 팀원 추가

```typescript
export const TEAM_MEMBERS = [
  // 기존 팀원들...

  // 새 팀원 추가
  { id: 'user5', name: '최민수', role: 'QA' }
] as const;
```

## 색상 시스템

### Tailwind CSS 색상 매핑

| 의미 | 색상 | 텍스트 | 배경 | 테두리 |
|------|------|--------|------|--------|
| 성공 | green | text-green-700 | bg-green-100 | border-green-300 |
| 경고 | yellow | text-yellow-700 | bg-yellow-100 | border-yellow-300 |
| 오류 | red | text-red-700 | bg-red-100 | border-red-300 |
| 정보 | blue | text-blue-700 | bg-blue-100 | border-blue-300 |
| 중립 | gray | text-gray-700 | bg-gray-100 | border-gray-300 |
| 진행 | purple | text-purple-700 | bg-purple-100 | border-purple-300 |

### 색상 일관성 유지

```typescript
// 좋은 예: 일관된 색상 체계
const NEW_STATUS = {
  'Custom': {
    label: '커스텀',
    color: 'text-teal-700',      // 700 계열
    bgColor: 'bg-teal-100',      // 100 계열
    borderColor: 'border-teal-300' // 300 계열
  }
};

// 나쁜 예: 불일치하는 색상 체계
const BAD_STATUS = {
  'Custom': {
    color: 'text-teal-500',      // ❌ 다른 숫자
    bgColor: 'bg-teal-200',      // ❌ 다른 숫자
    borderColor: 'border-teal-400' // ❌ 다른 숫자
  }
};
```

## 상수 사용 패턴

### 컴포넌트에서 사용

```tsx
import { STATUS_CONFIG, getStatusLabel, getStatusColorClass } from '../config/constants';

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`px-2 py-1 rounded ${config.color} ${config.bgColor}`}>
      {config.label}
    </span>
  );
}
```

### Select 옵션 생성

```tsx
import { STATUS_CONFIG, Status } from '../config/constants';

const statusOptions = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value: value as Status,
  label: config.label
}));
```

### 조건부 스타일링

```tsx
import { STATUS_CONFIG } from '../config/constants';

function getStatusStyle(status: Status) {
  const config = STATUS_CONFIG[status];
  return {
    color: config.color.replace('text-', ''),
    backgroundColor: config.bgColor.replace('bg-', '')
  };
}
```

## 마이그레이션 가이드

기존 하드코딩된 상수를 중앙 상수로 마이그레이션:

### Before

```tsx
// ❌ 여러 파일에 분산된 상수
// StatusSelect.tsx
const STATUS_OPTIONS = {
  'Reviewing': { label: '검토중', color: 'yellow' },
  // ...
};

// ExpandableTestCaseCard.tsx
const STATUSES = {
  'Reviewing': '검토중',
  // ...
};
```

### After

```tsx
// ✅ 중앙 상수 파일에서 import
import { STATUS_CONFIG, Status } from '../config/constants';

// 모든 컴포넌트에서 동일한 상수 사용
const label = STATUS_CONFIG['Reviewing'].label;
```

## 타입 안전성

```typescript
// 상수에서 타입 추론
type Status = keyof typeof STATUS_CONFIG;
type QAProgress = keyof typeof PROGRESS_CONFIG;
type ScreenPrefix = keyof typeof SCREEN_PREFIXES;

// 함수 매개변수에 타입 적용
function updateStatus(id: string, status: Status): void {
  // status는 STATUS_CONFIG의 키만 허용
}

// 잘못된 값 사용 시 컴파일 에러
updateStatus('1', 'InvalidStatus'); // ❌ 컴파일 에러
updateStatus('1', 'Reviewing');     // ✅ OK
```
