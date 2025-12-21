# QA 상태 머신 및 전이 규칙

## 상태 다이어그램

```
                    ┌─────────────┐
                    │  Reviewing  │ ← 초기 상태
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┬───────────────┐
           ▼               ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ DevError │    │ DevDone  │    │   Hold   │    │ Rejected │
    └────┬─────┘    └────┬─────┘    └────┬─────┘    └──────────┘
         │               │               │
         │               ▼               │
         │         ┌──────────┐          │
         └────────►│ProdError │◄─────────┘
                   └────┬─────┘
                        │
                        ▼
                   ┌──────────┐
                   │ ProdDone │ ← 최종 상태
                   └──────────┘

    ┌──────────┐
    │Duplicate │ ← 어느 상태에서든 전이 가능
    └──────────┘
```

## 상태 정의

### Status (검토 상태)

```typescript
type Status =
  | 'Reviewing'   // 검토중 - 초기 상태
  | 'DevError'    // Dev 환경에서 오류 발견
  | 'ProdError'   // Prod 환경에서 오류 발견
  | 'DevDone'     // Dev 환경 테스트 완료
  | 'ProdDone'    // Prod 환경 테스트 완료 (최종)
  | 'Hold'        // 일시 보류
  | 'Rejected'    // 반려됨
  | 'Duplicate';  // 중복 케이스

const STATUS_CONFIG: Record<Status, StatusInfo> = {
  'Reviewing': {
    label: '검토중',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: '테스트케이스 검토 진행중'
  },
  'DevError': {
    label: 'Dev 오류',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: '개발 환경에서 오류 발견'
  },
  'ProdError': {
    label: 'Prod 오류',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: '운영 환경에서 오류 발견'
  },
  'DevDone': {
    label: 'Dev 완료',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: '개발 환경 테스트 완료'
  },
  'ProdDone': {
    label: 'Prod 완료',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: '운영 환경 테스트 완료'
  },
  'Hold': {
    label: '보류',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: '검토 일시 보류'
  },
  'Rejected': {
    label: '반려',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: '테스트케이스 반려됨'
  },
  'Duplicate': {
    label: '중복',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: '다른 케이스와 중복'
  }
};
```

### QAProgress (진행 단계)

```typescript
type QAProgress =
  | 'Waiting'       // 대기중
  | 'Checking'      // 확인중
  | 'Working'       // 작업중
  | 'DevDeployed'   // Dev 배포완료
  | 'ProdDeployed'; // Prod 배포완료

const PROGRESS_CONFIG: Record<QAProgress, ProgressInfo> = {
  'Waiting': {
    label: '대기',
    order: 0,
    color: 'gray'
  },
  'Checking': {
    label: '확인중',
    order: 1,
    color: 'yellow'
  },
  'Working': {
    label: '작업중',
    order: 2,
    color: 'blue'
  },
  'DevDeployed': {
    label: 'Dev 배포',
    order: 3,
    color: 'purple'
  },
  'ProdDeployed': {
    label: 'Prod 배포',
    order: 4,
    color: 'green'
  }
};
```

## 상태 전이 규칙

### 유효한 전이

```typescript
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  'Reviewing': ['DevError', 'DevDone', 'Hold', 'Rejected', 'Duplicate'],
  'DevError': ['Reviewing', 'DevDone', 'Hold', 'Duplicate'],
  'ProdError': ['DevDone', 'ProdDone', 'Hold', 'Duplicate'],
  'DevDone': ['ProdError', 'ProdDone', 'Hold', 'Duplicate'],
  'ProdDone': ['Duplicate'], // 최종 상태, 제한적 전이만 허용
  'Hold': ['Reviewing', 'DevError', 'ProdError', 'DevDone', 'ProdDone', 'Duplicate'],
  'Rejected': ['Reviewing', 'Duplicate'],
  'Duplicate': [] // 종료 상태
};

function canTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 전이 시 필수 조건

```typescript
interface TransitionRequirement {
  requiresReason?: boolean;      // 사유 필수
  requiresAssignee?: boolean;    // 담당자 필수
  requiresVerification?: boolean; // 검증 완료 필수
}

const TRANSITION_REQUIREMENTS: Record<string, TransitionRequirement> = {
  'Reviewing->Rejected': { requiresReason: true },
  'DevError->DevDone': { requiresVerification: true },
  'ProdError->ProdDone': { requiresVerification: true },
  '*->Hold': { requiresReason: true }
};
```

## 진행 단계 전이 규칙

```typescript
const PROGRESS_ORDER: QAProgress[] = [
  'Waiting',
  'Checking',
  'Working',
  'DevDeployed',
  'ProdDeployed'
];

function canProgressTo(from: QAProgress, to: QAProgress): boolean {
  const fromIndex = PROGRESS_ORDER.indexOf(from);
  const toIndex = PROGRESS_ORDER.indexOf(to);

  // 순차 진행 또는 이전 단계로 롤백 허용
  return Math.abs(fromIndex - toIndex) <= 1;
}

function getNextProgress(current: QAProgress): QAProgress | null {
  const index = PROGRESS_ORDER.indexOf(current);
  return index < PROGRESS_ORDER.length - 1
    ? PROGRESS_ORDER[index + 1]
    : null;
}
```

## 배포 환경 연동

```typescript
interface DeploymentEnvironment {
  dev: boolean;
  prod: boolean;
}

function getRequiredEnvironment(progress: QAProgress): keyof DeploymentEnvironment | null {
  switch (progress) {
    case 'DevDeployed':
      return 'dev';
    case 'ProdDeployed':
      return 'prod';
    default:
      return null;
  }
}

function validateDeploymentProgress(
  progress: QAProgress,
  deployment: DeploymentEnvironment
): boolean {
  const required = getRequiredEnvironment(progress);
  if (!required) return true;
  return deployment[required];
}
```
