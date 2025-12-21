# Figma API Reference Guide

## 노드 순회 최적화

### 성능 최적화 패턴

```typescript
// ❌ 느림: 모든 노드 순회
const allNodes = figma.currentPage.findAll();

// ✅ 빠름: 타입 기반 필터링 + 불필요 노드 스킵
figma.skipInvisibleInstanceChildren = true;
const textNodes = figma.currentPage.findAllWithCriteria({
  types: ['TEXT']
});
```

**핵심 원칙**:
- `findAllWithCriteria`는 `findAll`보다 수백 배 빠름
- `skipInvisibleInstanceChildren = true` 설정 시 보이지 않는 노드 건너뜀
- 특정 노드 ID만 필요하면 `ids` 파라미터 사용

### REST API vs Plugin API

| 작업 | REST API | Plugin API |
|-----|----------|------------|
| 파일 전체 로드 | `GET /v1/files/:file_key` | `figma.loadAllPagesAsync()` |
| 특정 노드 | `?ids=1:2,1:3` | `figma.getNodeById('1:2')` |
| 이미지 렌더링 | `GET /v1/images/:file_key` | `node.exportAsync()` |

## 노드 타입별 처리

### FRAME (프레임)
```typescript
interface FrameNode {
  type: 'FRAME';
  name: string;           // 프레임 이름 (스크린 ID 포함)
  children: SceneNode[];  // 자식 노드들
  absoluteBoundingBox: Rectangle;
}
```

### TEXT (텍스트)
```typescript
interface TextNode {
  type: 'TEXT';
  characters: string;     // 텍스트 내용
  fontSize: number;
  fontName: FontName;
}
```

### 재귀 순회 패턴
```typescript
function traverse(node: SceneNode, depth = 0): void {
  // 깊이 제한으로 무한 재귀 방지
  if (depth > 10) return;

  // 타입별 처리
  switch (node.type) {
    case 'TEXT':
      processTextNode(node);
      break;
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      if ('children' in node) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
      break;
  }
}
```

## 에러 핸들링

### 지원하지 않는 노드 타입
```typescript
function safeProcess(node: SceneNode): void {
  const supportedTypes = ['FRAME', 'TEXT', 'GROUP', 'COMPONENT', 'INSTANCE'];

  if (!supportedTypes.includes(node.type)) {
    console.warn(`Unsupported node type: ${node.type}`);
    return;
  }

  // 처리 로직...
}
```

### API 요청 재시도
```typescript
async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 참고 자료

- [Figma Plugin API - Accessing Document](https://www.figma.com/plugin-docs/accessing-document/)
- [Figma Plugin API - findAllWithCriteria](https://www.figma.com/plugin-docs/api/properties/nodes-findallwithcriteria/)
- [Figma REST API Introduction](https://www.figma.com/developers/api)
