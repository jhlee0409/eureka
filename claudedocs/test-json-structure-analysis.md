# test.json 구조 분석 보고서

## 📊 파일 기본 정보

- **파일명**: test.json
- **크기**: 13MB
- **총 라인 수**: 296,131줄
- **용도**: Figma API 응답 데이터 (공통 화면설계서)

---

## 🏗️ 최상위 JSON 구조

```json
{
  "name": "공통 화면설계서",
  "lastModified": "2025-12-15T02:03:21Z",
  "thumbnailUrl": "https://s3-alpha.figma.com/thumbnails/...",
  "version": "2297636521254742852",
  "role": "viewer",
  "editorType": "figma",
  "linkAccess": "inherit",
  "nodes": {
    "34:2749": {
      "document": { /* CANVAS 노드 */ }
    }
  }
}
```

### 주요 필드 설명

| 필드 | 설명 | 예시 값 |
|------|------|---------|
| `name` | Figma 파일 이름 | "공통 화면설계서" |
| `lastModified` | 마지막 수정 시간 | "2025-12-15T02:03:21Z" |
| `thumbnailUrl` | 파일 썸네일 URL | AWS S3 signed URL |
| `version` | 파일 버전 ID | "2297636521254742852" |
| `role` | 사용자 권한 | "viewer" |
| `nodes` | 노드 트리 구조 | 객체 |

---

## 🌳 노드 트리 구조

### 계층 구조
```
nodes
└─ "34:2749" (노드 ID)
    └─ document (CANVAS)
        └─ children[]
            ├─ GROUP
            │   └─ children[]
            │       ├─ GROUP
            │       │   └─ children[]
            │       │       ├─ RECTANGLE
            │       │       └─ TEXT ("AUTO_0002")
            │       └─ FRAME
            │           └─ children[]
            │               ├─ TEXT ("화면 ID")
            │               ├─ TEXT ("작성일")
            │               ├─ TEXT ("Screen Information")
            │               └─ GROUP ("description")
            │                   └─ FRAME ("full_list")
            │                       └─ TEXT (상세 내용)
            └─ ...
```

---

## 📦 노드 타입 통계

| 노드 타입 | 개수 | 용도 |
|-----------|------|------|
| `SOLID` | 4,044 | 색상 정의 (fill, stroke) |
| `GROUP` | 1,657 | 요소 그룹화 |
| `RECTANGLE` | 1,425 | 사각형 도형 |
| `TEXT` | 1,423 | **텍스트 노드 (파싱 대상)** |
| `FRAME` | 499 | 레이아웃 프레임 |
| `VECTOR` | 436 | 벡터 도형 |
| `INSTANCE` | 136 | 컴포넌트 인스턴스 |
| `ELLIPSE` | 131 | 원형 도형 |
| `IMAGE` | 49 | 이미지 |
| `CANVAS` | 1 | 최상위 캔버스 |

---

## 🎯 TEXT 노드 구조 (파싱 핵심)

### TEXT 노드 전체 구조
```json
{
  "id": "99:511",
  "name": "AUTO_0002",
  "type": "TEXT",
  "scrollBehavior": "SCROLLS",
  "blendMode": "PASS_THROUGH",
  "fills": [ /* 색상 정보 */ ],
  "strokes": [],
  "strokeWeight": 1,
  "absoluteBoundingBox": { /* 위치 정보 */ },
  "constraints": { /* 제약 조건 */ },
  "characters": "AUTO_0002",  // ⭐ 실제 텍스트 내용
  "characterStyleOverrides": [],
  "styleOverrideTable": {},
  "lineTypes": ["NONE"],
  "style": {
    "fontFamily": "Pretendard",
    "fontWeight": 700,
    "fontSize": 20,
    "textAlignHorizontal": "CENTER",
    "lineHeightPx": 30
  },
  "effects": [],
  "interactions": []
}
```

### 중요 필드
- **`name`**: 노드 이름 (Figma에서 설정)
- **`characters`**: ⭐ **실제 텍스트 내용** (파싱 대상)
- **`type`**: "TEXT" (TEXT 노드 식별)

---

## 🏷️ Label-Value 패턴 구조

### 패턴 1: 화면 메타데이터
```
GROUP
├─ TEXT (name: "화면 ID")       → Label
│   └─ characters: "화면 ID"
└─ [다음 TEXT 노드]
    └─ characters: "-"         → Value
```

### 패턴 2: Screen Information
```
GROUP
├─ TEXT (name: "Screen Information")
│   └─ characters: "Screen Information"   → Label
└─ FRAME (name: "screen info")
    └─ TEXT
        └─ characters: "프리셋 기능이 추가된 케이스"  → Value
```

### 패턴 3: Description (full_list)
```
GROUP (name: "description")
└─ FRAME (name: "full_list")
    ├─ TEXT (name: "1")
    │   └─ characters: "1"
    └─ TEXT (긴 텍스트)
        └─ characters: "emptycase\n\n구성 : 파일 업로드..."  → 상세 설명
```

---

## 🔍 파싱 전략

### 1단계: TEXT 노드 수집
```typescript
function collectAllTextNodes(node: FigmaNode): TextNodeInfo[] {
  const texts: TextNodeInfo[] = [];

  if (node.type === 'TEXT' && node.characters) {
    texts.push({
      name: node.name,
      characters: node.characters,
      parentName: getParentName(node)
    });
  }

  if (node.children) {
    node.children.forEach(child => {
      texts.push(...collectAllTextNodes(child));
    });
  }

  return texts;
}
```

### 2단계: Label-Value 쌍 감지
```typescript
function extractLabelValuePairs(textNodes: TextNodeInfo[]): LabelValuePair[] {
  const pairs: LabelValuePair[] = [];
  const labels = ['화면 ID', 'Screen Information', 'Description', ...];

  for (let i = 0; i < textNodes.length; i++) {
    const current = textNodes[i];
    const isLabel = labels.includes(current.characters);

    if (isLabel && i + 1 < textNodes.length) {
      const next = textNodes[i + 1];
      pairs.push({
        label: current.characters,
        value: next.characters
      });
    }
  }

  return pairs;
}
```

### 3단계: full_list 우선 처리
```typescript
function extractDescription(textNodes: TextNodeInfo[]): string {
  // 1. full_list 노드 우선 검색
  const fullListNodes = textNodes.filter(node =>
    node.name.includes('full_list') ||
    node.parentName.includes('full_list')
  );

  if (fullListNodes.length > 0) {
    return fullListNodes
      .map(node => node.characters)
      .filter(Boolean)
      .join('\n\n');
  }

  // 2. description 키워드 검색 (fallback)
  const descNode = textNodes.find(node =>
    node.name.toLowerCase().includes('description')
  );

  return descNode?.characters || '';
}
```

---

## 📋 화면 ID 패턴

### 발견된 화면 ID 패턴
```
AUTO_0002           (기본 화면)
AUTO_0004_1         (변형 1)
AUTO_0004_2         (변형 2)
AUTO_0004_4         (변형 4)
AUTO_0004_5         (변형 5)
AUTO_0004 / LINK_0001  (관련 링크 화면)
```

### 정규식 패턴
```typescript
const SCREEN_ID_REGEX = /^([A-Z]+_[0-9]+)(_([0-9]+))?$/;

// 매칭 예시:
// "AUTO_0002" → ["AUTO_0002", "AUTO_0002", undefined, undefined]
// "AUTO_0004_1" → ["AUTO_0004_1", "AUTO_0004", "_1", "1"]
```

---

## 💡 핵심 발견 사항

### 1. characters 필드의 중요성
- TEXT 노드의 실제 텍스트는 **`characters`** 필드에 저장됨
- `name` 필드는 Figma에서 설정한 노드 이름 (메타데이터)

### 2. 계층 구조의 의미
- **GROUP**: 논리적 그룹핑 (화면 ID, Screen Info, Description 등)
- **FRAME**: 레이아웃 컨테이너 (full_list, screen info 등)
- **TEXT**: 실제 텍스트 내용

### 3. Label-Value 순서
```
[Label TEXT] → [Value TEXT 또는 FRAME]
```
- Label 다음에 오는 TEXT/FRAME의 내용이 해당 Label의 값

### 4. full_list의 특수성
- `name: "full_list"` → 상세 설명을 담는 컨테이너
- 여러 TEXT 노드를 포함할 수 있음
- 긴 텍스트 (756px 높이)와 복잡한 포매팅 (bullet points) 지원

---

## 🎨 실제 데이터 예시

### 화면 ID 영역
```json
{
  "name": "Group 130",
  "type": "GROUP",
  "children": [
    {
      "name": "Screen Information",
      "type": "TEXT",
      "characters": "Screen Information"
    }
  ]
}
```

### Screen Information 영역
```json
{
  "name": "screen info",
  "type": "FRAME",
  "children": [
    {
      "name": "프리셋 기능이 추가된 케이스",
      "type": "TEXT",
      "characters": "프리셋 기능이 추가된 케이스"
    }
  ]
}
```

### Description (full_list) 영역
```json
{
  "name": "full_list",
  "type": "FRAME",
  "children": [
    {
      "name": "1",
      "type": "TEXT",
      "characters": "1"
    },
    {
      "name": "긴 텍스트 노드",
      "type": "TEXT",
      "characters": "emptycase\n\n구성 : 파일 업로드, url 업로드\n\nurl 업로드\n업로드 가능 링크\n..."
    }
  ]
}
```

---

## ✅ 파싱 검증 체크리스트

- [x] 최상위 `nodes` 객체 접근
- [x] `document.children` 재귀 탐색
- [x] TEXT 노드의 `characters` 필드 추출
- [x] 부모 노드 이름(`parentName`) 추적
- [x] Label-Value 순차 패턴 감지
- [x] `full_list` 노드 우선 처리
- [x] 화면 ID 정규식 매칭

---

## 🚀 최적화 제안

### 1. 캐싱 전략
```typescript
// 한 번 파싱한 노드는 캐시에 저장
const nodeCache = new Map<string, ParsedNodeData>();
```

### 2. 선택적 깊이 탐색
```typescript
// 필요한 깊이까지만 탐색
function parseWithDepth(node: FigmaNode, maxDepth: number = 10) {
  // ...
}
```

### 3. 병렬 처리
```typescript
// 각 화면 노드를 병렬로 파싱
const parsedScreens = await Promise.all(
  screenNodes.map(node => parseScreen(node))
);
```

---

## 📝 요약

test.json은 Figma API의 응답 데이터로, 다음과 같은 특징을 가집니다:

1. **계층적 노드 트리**: CANVAS → GROUP → FRAME → TEXT
2. **TEXT 노드 중심**: 1,423개의 TEXT 노드에 실제 텍스트 저장
3. **Label-Value 패턴**: 순차적으로 배치된 TEXT 노드로 메타데이터 표현
4. **full_list 컨테이너**: 상세 설명을 담는 특수 FRAME
5. **characters 필드**: TEXT 노드의 실제 텍스트 내용

이 구조를 이해하면 효과적으로 Figma 화면 설계서를 파싱하고, 화면 ID, Screen Information, Description을 정확히 추출할 수 있습니다.
