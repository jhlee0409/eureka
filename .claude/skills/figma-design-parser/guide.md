# 텍스트 추출 및 라벨-값 파싱 가이드

## 텍스트 노드 추출 전략

### 1. 직접 자식 텍스트
```typescript
function extractDirectText(frame: FrameNode): string[] {
  return frame.children
    .filter((node): node is TextNode => node.type === 'TEXT')
    .map(node => node.characters.trim())
    .filter(text => text.length > 0);
}
```

### 2. 재귀적 텍스트 수집
```typescript
function collectAllText(node: SceneNode): string[] {
  const texts: string[] = [];

  if (node.type === 'TEXT') {
    texts.push(node.characters.trim());
  }

  if ('children' in node) {
    for (const child of node.children) {
      texts.push(...collectAllText(child));
    }
  }

  return texts;
}
```

## 라벨-값 쌍 추출 패턴

### 이 프로젝트의 라벨 패턴

| 라벨 | 설명 | 예시 값 |
|------|------|---------|
| 화면ID | 스크린 식별자 | AUTO_0001 |
| 화면명 | 스크린 이름 | 로그인 화면 |
| 화면설명 | 상세 설명 | 사용자 로그인을 처리합니다 |
| 뎁스 | 화면 깊이 | 1 |

### 라벨-값 추출 로직
```typescript
const LABEL_PATTERNS = [
  '화면ID', '화면명', '화면설명', '뎁스',
  'Screen ID', 'Screen Name', 'Description', 'Depth'
];

interface LabelValuePair {
  label: string;
  value: string;
}

function extractLabelValuePairs(texts: string[]): LabelValuePair[] {
  const pairs: LabelValuePair[] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i].trim();

    // 콜론으로 구분된 경우: "라벨: 값"
    if (text.includes(':')) {
      const [label, ...valueParts] = text.split(':');
      const value = valueParts.join(':').trim();
      if (LABEL_PATTERNS.some(p => label.includes(p))) {
        pairs.push({ label: label.trim(), value });
      }
      continue;
    }

    // 다음 텍스트가 값인 경우
    if (LABEL_PATTERNS.some(p => text.includes(p)) && i + 1 < texts.length) {
      pairs.push({ label: text, value: texts[i + 1].trim() });
      i++; // 값은 건너뜀
    }
  }

  return pairs;
}
```

## 스크린 ID 파싱

### 정규식 패턴
```typescript
const SCREEN_ID_REGEX = /^([A-Z]{4})_(\d{4})(?:_(.+))?$/;

interface ParsedScreenId {
  prefix: string;    // AUTO, PSET, LINK 등
  number: string;    // 0001, 0002 등
  suffix?: string;   // 1, ㅅ, _v2 등
  fullId: string;    // 전체 ID
}

function parseScreenId(name: string): ParsedScreenId | null {
  const match = name.match(SCREEN_ID_REGEX);
  if (!match) return null;

  return {
    prefix: match[1],
    number: match[2],
    suffix: match[3],
    fullId: match[0]
  };
}
```

### 스크린 그룹화
```typescript
function groupScreensByPrefix(
  screens: ParsedScreenId[]
): Map<string, ParsedScreenId[]> {
  const groups = new Map<string, ParsedScreenId[]>();

  for (const screen of screens) {
    const baseId = `${screen.prefix}_${screen.number}`;
    if (!groups.has(baseId)) {
      groups.set(baseId, []);
    }
    groups.get(baseId)!.push(screen);
  }

  return groups;
}
```

## Cover 프레임 감지

### Cover 프레임 규칙
1. 이름에 'Cover' 또는 '커버' 포함
2. 스크린 ID의 접두사와 일치하는 프레임
3. 가장 큰 크기의 프레임 우선

```typescript
function findCoverFrame(
  frames: FrameNode[],
  screenPrefix: string
): FrameNode | null {
  // 1. 명시적 Cover 이름
  const explicitCover = frames.find(f =>
    f.name.toLowerCase().includes('cover') ||
    f.name.includes('커버')
  );
  if (explicitCover) return explicitCover;

  // 2. 접두사 매칭
  const prefixMatch = frames.find(f =>
    f.name.startsWith(screenPrefix)
  );
  if (prefixMatch) return prefixMatch;

  // 3. 가장 큰 프레임
  return frames.reduce((largest, frame) => {
    const area = frame.width * frame.height;
    const largestArea = largest.width * largest.height;
    return area > largestArea ? frame : largest;
  });
}
```

## 텍스트 위치 기반 추출

Cover 프레임에서 텍스트 위치 정보 추출:

```typescript
interface TextPosition {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

function extractTextWithPosition(frame: FrameNode): TextPosition[] {
  const positions: TextPosition[] = [];

  function traverse(node: SceneNode) {
    if (node.type === 'TEXT') {
      const bounds = node.absoluteBoundingBox;
      if (bounds) {
        positions.push({
          text: node.characters,
          x: bounds.x - frame.absoluteBoundingBox.x,
          y: bounds.y - frame.absoluteBoundingBox.y,
          width: bounds.width,
          height: bounds.height,
          fontSize: node.fontSize as number
        });
      }
    }
    if ('children' in node) {
      node.children.forEach(traverse);
    }
  }

  traverse(frame);
  return positions;
}
```
