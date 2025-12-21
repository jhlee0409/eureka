# QA 체크리스트 생성 프롬프트 가이드

## 프롬프트 엔지니어링 원칙

### 1. 역할 정의
```
당신은 경험 많은 QA 엔지니어입니다.
주어진 화면 스펙을 분석하여 포괄적인 테스트 체크리스트를 생성합니다.
```

### 2. 명확한 지시사항
```
다음 규칙을 따라 체크리스트를 생성하세요:
1. 각 항목은 구체적이고 검증 가능해야 합니다
2. "~하는지 확인" 형태로 작성합니다
3. 기능, UI, 성능, 보안 카테고리로 분류합니다
4. 중복 항목을 제거합니다
```

### 3. 출력 형식 명시
```
JSON 배열 형식으로 응답합니다.
각 항목은 다음 필드를 포함합니다:
- item: 체크리스트 항목 (문자열)
- category: 카테고리 (functionality/ui/performance/security)
- priority: 우선순위 (high/medium/low)
```

## QA 체크리스트 생성 프롬프트

### 기본 프롬프트

```typescript
const QA_CHECKLIST_PROMPT = `
당신은 경험 많은 QA 엔지니어입니다.
주어진 화면 스펙을 분석하여 포괄적인 테스트 체크리스트를 생성합니다.

## 규칙
1. 각 항목은 구체적이고 검증 가능해야 합니다
2. "~하는지 확인" 또는 "~동작하는지 검증" 형태로 작성합니다
3. 중복 항목을 제거합니다
4. 최소 5개, 최대 15개 항목을 생성합니다

## 카테고리 기준
- functionality: 핵심 기능 동작 검증
- ui: 디자인 일치, 레이아웃, 반응형
- performance: 로딩 시간, 최적화
- security: 입력 검증, 인증, 데이터 보호

## 우선순위 기준
- high: 핵심 기능, 치명적 버그 가능성
- medium: 중요하지만 우회 가능
- low: 사용자 경험 개선

---

화면 스펙:
{{SPECIFICATION}}

---

위 스펙에 대한 QA 체크리스트를 생성하세요.
`;
```

### 카테고리별 프롬프트

```typescript
const CATEGORY_PROMPTS = {
  functionality: `
다음 화면의 기능적 테스트 항목을 생성하세요:
- 사용자 입력 처리
- 버튼/링크 동작
- 데이터 저장/로드
- 상태 변경
- 에러 처리
`,

  ui: `
다음 화면의 UI 테스트 항목을 생성하세요:
- 디자인 시안 일치
- 반응형 레이아웃 (모바일/태블릿/데스크톱)
- 색상, 폰트, 간격
- 로딩/에러 상태 표시
- 접근성 (스크린리더, 키보드 네비게이션)
`,

  performance: `
다음 화면의 성능 테스트 항목을 생성하세요:
- 초기 로딩 시간 (< 3초)
- 인터랙션 응답 시간
- 대량 데이터 처리
- 메모리 사용량
- 네트워크 요청 최적화
`,

  security: `
다음 화면의 보안 테스트 항목을 생성하세요:
- XSS 취약점
- 입력 유효성 검증
- 인증/인가 확인
- 민감 데이터 노출
- CSRF 보호
`
};
```

## 프롬프트 템플릿

### 화면 스펙 기반

```typescript
function buildSpecPrompt(spec: ScreenSpec): string {
  return `
화면 정보:
- 화면 ID: ${spec.id}
- 화면명: ${spec.name}
- 화면 설명: ${spec.description}

기능 요구사항:
${spec.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

UI 요소:
${spec.uiElements.map(e => `- ${e.type}: ${e.description}`).join('\n')}

이 화면에 대한 QA 체크리스트를 생성하세요.
  `.trim();
}
```

### 에러 케이스 포함

```typescript
function buildErrorCasePrompt(spec: ScreenSpec): string {
  return `
${buildSpecPrompt(spec)}

추가로 다음 에러 시나리오도 고려하세요:
- 네트워크 오프라인 상태
- 서버 에러 (500)
- 타임아웃
- 잘못된 입력값
- 권한 없음
  `.trim();
}
```

## 응답 스키마

### TypeScript 타입

```typescript
interface ChecklistItem {
  item: string;
  category: 'functionality' | 'ui' | 'performance' | 'security';
  priority: 'high' | 'medium' | 'low';
}

type Checklist = ChecklistItem[];
```

### Gemini 스키마

```typescript
import { Type } from '@google/genai';

const CHECKLIST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      item: {
        type: Type.STRING,
        description: '테스트 항목 설명'
      },
      category: {
        type: Type.STRING,
        enum: ['functionality', 'ui', 'performance', 'security'],
        description: '테스트 카테고리'
      },
      priority: {
        type: Type.STRING,
        enum: ['high', 'medium', 'low'],
        description: '테스트 우선순위'
      }
    },
    required: ['item', 'category', 'priority'],
    propertyOrdering: ['item', 'category', 'priority']
  }
};
```

## 체크리스트 후처리

### 중복 제거

```typescript
function deduplicateChecklist(items: ChecklistItem[]): ChecklistItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const normalized = item.item.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
```

### 우선순위 정렬

```typescript
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortByPriority(items: ChecklistItem[]): ChecklistItem[] {
  return [...items].sort((a, b) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}
```

### 카테고리 그룹화

```typescript
function groupByCategory(
  items: ChecklistItem[]
): Record<string, ChecklistItem[]> {
  return items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>);
}
```

## 완전한 구현 예시

```typescript
import { GoogleGenAI, Type } from '@google/genai';

export async function generateQAChecklist(
  specification: string
): Promise<ChecklistItem[]> {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
  });

  const prompt = QA_CHECKLIST_PROMPT.replace(
    '{{SPECIFICATION}}',
    specification
  );

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: CHECKLIST_SCHEMA
    }
  });

  const items = JSON.parse(response.text) as ChecklistItem[];

  return sortByPriority(deduplicateChecklist(items));
}
```
