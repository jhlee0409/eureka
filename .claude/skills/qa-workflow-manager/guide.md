# 액티비티 로깅 및 검증 체크리스트 가이드

## 액티비티 로그 구조

### 데이터 모델

```typescript
interface ActivityLog {
  id: string;
  timestamp: string;        // ISO 8601 형식
  action: ActivityAction;
  user: string;
  details?: string;
  metadata?: Record<string, any>;
}

type ActivityAction =
  | 'created'           // 테스트케이스 생성
  | 'status_changed'    // 상태 변경
  | 'progress_changed'  // 진행 단계 변경
  | 'assigned'          // 담당자 지정
  | 'comment_added'     // 코멘트 추가
  | 'checklist_updated' // 체크리스트 업데이트
  | 'rejected'          // 반려
  | 'verified'          // 검증 완료
  | 'deployed';         // 배포 완료
```

### 로그 생성 패턴

```typescript
function createActivityLog(
  action: ActivityAction,
  user: string,
  details?: string,
  metadata?: Record<string, any>
): ActivityLog {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    user,
    details,
    metadata
  };
}

// 사용 예시
const log = createActivityLog(
  'status_changed',
  '홍길동',
  'Reviewing → DevDone',
  { from: 'Reviewing', to: 'DevDone' }
);
```

### 액션별 상세 메시지

```typescript
const ACTION_MESSAGES: Record<ActivityAction, (log: ActivityLog) => string> = {
  'created': () => '테스트케이스가 생성되었습니다.',
  'status_changed': (log) => {
    const { from, to } = log.metadata || {};
    return `상태가 ${from}에서 ${to}(으)로 변경되었습니다.`;
  },
  'progress_changed': (log) => {
    const { from, to } = log.metadata || {};
    return `진행 단계가 ${from}에서 ${to}(으)로 변경되었습니다.`;
  },
  'assigned': (log) => `${log.details}님에게 할당되었습니다.`,
  'comment_added': () => '코멘트가 추가되었습니다.',
  'checklist_updated': (log) => {
    const { completed, total } = log.metadata || {};
    return `체크리스트 업데이트 (${completed}/${total})`;
  },
  'rejected': (log) => `반려됨: ${log.details}`,
  'verified': () => '검증이 완료되었습니다.',
  'deployed': (log) => `${log.metadata?.environment} 환경에 배포되었습니다.`
};
```

## 검증 체크리스트

### 체크리스트 데이터 모델

```typescript
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
}

interface Checklist {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}
```

### 체크리스트 관리

```typescript
function createChecklist(items: string[]): Checklist {
  return {
    items: items.map((text, index) => ({
      id: `item-${index}`,
      text,
      checked: false
    })),
    completedCount: 0,
    totalCount: items.length,
    isComplete: false
  };
}

function toggleChecklistItem(
  checklist: Checklist,
  itemId: string,
  user: string
): Checklist {
  const items = checklist.items.map(item => {
    if (item.id !== itemId) return item;

    const checked = !item.checked;
    return {
      ...item,
      checked,
      checkedAt: checked ? new Date().toISOString() : undefined,
      checkedBy: checked ? user : undefined
    };
  });

  const completedCount = items.filter(i => i.checked).length;

  return {
    items,
    completedCount,
    totalCount: checklist.totalCount,
    isComplete: completedCount === checklist.totalCount
  };
}
```

### QA 기본 체크리스트 템플릿

```typescript
const QA_CHECKLIST_TEMPLATES = {
  functionality: [
    '기능이 요구사항대로 동작하는가?',
    '예외 상황 처리가 적절한가?',
    '에러 메시지가 사용자 친화적인가?',
    '데이터 유효성 검증이 동작하는가?'
  ],
  ui: [
    'UI가 디자인 시안과 일치하는가?',
    '반응형 레이아웃이 정상 동작하는가?',
    '로딩 상태 표시가 적절한가?',
    '접근성 요구사항을 충족하는가?'
  ],
  performance: [
    '페이지 로딩 시간이 3초 이내인가?',
    '대량 데이터 처리 시 성능 저하가 없는가?',
    '메모리 누수가 없는가?'
  ],
  security: [
    'XSS 취약점이 없는가?',
    '인증/인가가 정상 동작하는가?',
    '민감 데이터가 노출되지 않는가?'
  ]
};

function getDefaultChecklist(type: keyof typeof QA_CHECKLIST_TEMPLATES): Checklist {
  return createChecklist(QA_CHECKLIST_TEMPLATES[type]);
}
```

## 반려 처리

### 반려 사유 구조

```typescript
interface RejectionInfo {
  reason: RejectionReason;
  details: string;
  rejectedBy: string;
  rejectedAt: string;
}

type RejectionReason =
  | 'invalid_spec'        // 스펙 오류
  | 'duplicate'           // 중복 케이스
  | 'out_of_scope'        // 범위 외
  | 'not_reproducible'    // 재현 불가
  | 'insufficient_info'   // 정보 부족
  | 'other';              // 기타

const REJECTION_REASONS: Record<RejectionReason, string> = {
  'invalid_spec': '스펙 오류',
  'duplicate': '중복 케이스',
  'out_of_scope': '테스트 범위 외',
  'not_reproducible': '재현 불가',
  'insufficient_info': '정보 부족',
  'other': '기타'
};
```

### 반려 처리 함수

```typescript
function rejectTestCase(
  testCase: TestCase,
  reason: RejectionReason,
  details: string,
  user: string
): TestCase {
  const rejection: RejectionInfo = {
    reason,
    details,
    rejectedBy: user,
    rejectedAt: new Date().toISOString()
  };

  const log = createActivityLog(
    'rejected',
    user,
    `${REJECTION_REASONS[reason]}: ${details}`,
    { reason, details }
  );

  return {
    ...testCase,
    status: 'Rejected',
    rejection,
    activityLog: [...testCase.activityLog, log]
  };
}
```

## 타임라인 표시

```typescript
function formatActivityTimeline(logs: ActivityLog[]): string[] {
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(log => {
      const date = new Date(log.timestamp);
      const formattedDate = date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const message = ACTION_MESSAGES[log.action](log);
      return `[${formattedDate}] ${log.user}: ${message}`;
    });
}
```
