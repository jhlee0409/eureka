# Gemini 구조화 출력 베스트 프랙티스

## 구조화 출력 개요

Gemini API는 JSON Schema를 기반으로 응답 형식을 강제할 수 있습니다. 이를 통해:
- 예측 가능하고 파싱 가능한 결과 보장
- 형식 및 타입 안전성 확보
- 프로그래밍 방식의 거부 감지

## SDK 설정

### TypeScript (권장)

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Zod 스키마 사용 (권장)
import { z } from 'zod';

const ChecklistSchema = z.array(z.object({
  item: z.string().describe('체크리스트 항목'),
  category: z.enum(['functionality', 'ui', 'performance', 'security']),
  priority: z.enum(['high', 'medium', 'low'])
}));
```

### 기본 구조화 출력

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          category: { type: Type.STRING },
          priority: { type: Type.STRING }
        },
        required: ['item', 'category', 'priority']
      }
    }
  }
});
```

## 스키마 설계 원칙

### 1. 속성 순서 지정 (Gemini 2.5+)

```typescript
const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    items: { type: Type.ARRAY }
  },
  propertyOrdering: ['title', 'description', 'items']  // 순서 보장
};
```

### 2. 스키마 단순화

**❌ 너무 복잡한 스키마**
```typescript
const complexSchema = {
  type: Type.OBJECT,
  properties: {
    level1: {
      type: Type.OBJECT,
      properties: {
        level2: {
          type: Type.OBJECT,
          properties: {
            level3: { ... }  // 깊은 중첩 피하기
          }
        }
      }
    }
  }
};
```

**✅ 단순화된 스키마**
```typescript
const simpleSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      value: { type: Type.STRING }
    }
  }
};
```

### 3. 설명 추가

```typescript
const schema = {
  type: Type.OBJECT,
  properties: {
    item: {
      type: Type.STRING,
      description: '테스트해야 할 구체적인 기능 또는 동작'
    },
    priority: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: '우선순위 - high: 핵심 기능, medium: 중요 기능, low: 부가 기능'
    }
  }
};
```

## Temperature 설정

```typescript
// 구조화 출력에는 낮은 temperature 권장
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
  config: {
    temperature: 0.1,  // 0.0 ~ 0.3 권장
    responseMimeType: 'application/json',
    responseSchema: schema
  }
});
```

| Temperature | 용도 |
|------------|------|
| 0.0 - 0.1 | 일관된 분류, 데이터 추출 |
| 0.2 - 0.3 | 체크리스트 생성, 구조화 분석 |
| 0.5+ | 창의적 출력 (구조화에 비권장) |

## 에러 핸들링

### 재시도 로직

```typescript
async function generateWithRetry<T>(
  prompt: string,
  schema: object,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      return JSON.parse(response.text) as T;

    } catch (error) {
      lastError = error as Error;

      // 재시도 가능한 에러인지 확인
      if (isRetryableError(error)) {
        await sleep(Math.pow(2, i) * 1000);  // 지수 백오프
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('rate limit') ||
           error.message.includes('timeout') ||
           error.message.includes('503');
  }
  return false;
}
```

### 응답 검증

```typescript
import { z } from 'zod';

const ChecklistItemSchema = z.object({
  item: z.string().min(1),
  category: z.enum(['functionality', 'ui', 'performance', 'security']),
  priority: z.enum(['high', 'medium', 'low'])
});

const ChecklistSchema = z.array(ChecklistItemSchema);

function validateResponse(response: unknown): ChecklistItem[] {
  const result = ChecklistSchema.safeParse(response);

  if (!result.success) {
    console.error('Validation failed:', result.error.issues);
    throw new Error('Invalid response structure');
  }

  return result.data;
}
```

## 비용 최적화

### 토큰 사용량 줄이기

```typescript
// 프롬프트에서 예시 최소화
const prompt = `
다음 화면 스펙을 분석하여 QA 체크리스트를 생성하세요.
간결하게 핵심 테스트 항목만 포함합니다.

스펙:
${specification}
`.trim();

// 불필요한 필드 제거
const minimalSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING  // 복잡한 객체 대신 문자열 배열
  }
};
```

### 캐싱 전략

```typescript
const cache = new Map<string, string[]>();

async function getCachedChecklist(specHash: string): Promise<string[] | null> {
  return cache.get(specHash) ?? null;
}

async function generateChecklist(spec: string): Promise<string[]> {
  const hash = await hashSpec(spec);
  const cached = await getCachedChecklist(hash);

  if (cached) return cached;

  const result = await generateWithRetry<string[]>(
    buildPrompt(spec),
    checklistSchema
  );

  cache.set(hash, result);
  return result;
}
```

## 참고 자료

- [Gemini API Structured Output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Google Developers Blog - Schema Adherence](https://developers.googleblog.com/en/mastering-controlled-generation-with-gemini-15-schema-adherence/)
- [Firebase AI Logic - Generate Structured Output](https://firebase.google.com/docs/ai-logic/generate-structured-output)
