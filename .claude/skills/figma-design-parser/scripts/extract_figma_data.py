#!/usr/bin/env python3
"""
Figma 데이터 추출 스크립트

사용법:
    python extract_figma_data.py <figma_json_path> [--output <output_path>]

예시:
    python extract_figma_data.py ./test.json --output screens.json
"""

import json
import re
import argparse
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class ScreenData:
    """스크린 데이터 구조"""
    id: str
    prefix: str
    number: str
    suffix: Optional[str]
    name: str
    description: str
    depth: Optional[int]
    labels: Dict[str, str]


SCREEN_ID_PATTERN = re.compile(r'^([A-Z]{4})_(\d{4})(?:_(.+))?$')

LABEL_KEYWORDS = [
    '화면ID', '화면명', '화면설명', '뎁스',
    'Screen ID', 'Screen Name', 'Description', 'Depth'
]


def parse_screen_id(name: str) -> Optional[Dict[str, str]]:
    """스크린 ID 파싱"""
    match = SCREEN_ID_PATTERN.match(name)
    if not match:
        return None

    return {
        'prefix': match.group(1),
        'number': match.group(2),
        'suffix': match.group(3),
        'full_id': match.group(0)
    }


def extract_text_nodes(node: Dict[str, Any], texts: List[str] = None) -> List[str]:
    """노드에서 모든 텍스트 추출 (재귀)"""
    if texts is None:
        texts = []

    if node.get('type') == 'TEXT':
        characters = node.get('characters', '').strip()
        if characters:
            texts.append(characters)

    for child in node.get('children', []):
        extract_text_nodes(child, texts)

    return texts


def extract_label_value_pairs(texts: List[str]) -> Dict[str, str]:
    """텍스트 목록에서 라벨-값 쌍 추출"""
    pairs = {}
    i = 0

    while i < len(texts):
        text = texts[i].strip()

        # 콜론으로 구분된 경우: "라벨: 값"
        if ':' in text:
            parts = text.split(':', 1)
            label = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ''

            if any(kw in label for kw in LABEL_KEYWORDS):
                pairs[label] = value
                i += 1
                continue

        # 다음 텍스트가 값인 경우
        if any(kw in text for kw in LABEL_KEYWORDS):
            if i + 1 < len(texts):
                pairs[text] = texts[i + 1].strip()
                i += 2
                continue

        i += 1

    return pairs


def find_screens(node: Dict[str, Any], screens: List[ScreenData] = None) -> List[ScreenData]:
    """Figma 노드 트리에서 스크린 찾기"""
    if screens is None:
        screens = []

    node_type = node.get('type', '')
    node_name = node.get('name', '')

    # FRAME이나 COMPONENT에서 스크린 ID 확인
    if node_type in ['FRAME', 'COMPONENT', 'INSTANCE']:
        parsed = parse_screen_id(node_name)

        if parsed:
            # 텍스트 추출
            texts = extract_text_nodes(node)
            labels = extract_label_value_pairs(texts)

            screen = ScreenData(
                id=parsed['full_id'],
                prefix=parsed['prefix'],
                number=parsed['number'],
                suffix=parsed['suffix'],
                name=labels.get('화면명', labels.get('Screen Name', '')),
                description=labels.get('화면설명', labels.get('Description', '')),
                depth=int(labels.get('뎁스', labels.get('Depth', 0)) or 0),
                labels=labels
            )
            screens.append(screen)

    # 자식 노드 재귀 탐색
    for child in node.get('children', []):
        find_screens(child, screens)

    return screens


def group_by_prefix(screens: List[ScreenData]) -> Dict[str, List[ScreenData]]:
    """접두사별로 스크린 그룹화"""
    groups = {}

    for screen in screens:
        base_id = f"{screen.prefix}_{screen.number}"
        if base_id not in groups:
            groups[base_id] = []
        groups[base_id].append(screen)

    return groups


def main():
    parser = argparse.ArgumentParser(description='Figma JSON에서 스크린 데이터 추출')
    parser.add_argument('input', help='Figma JSON 파일 경로')
    parser.add_argument('--output', '-o', help='출력 파일 경로 (기본: stdout)')
    parser.add_argument('--group', '-g', action='store_true', help='접두사별 그룹화')

    args = parser.parse_args()

    # JSON 로드
    with open(args.input, 'r', encoding='utf-8') as f:
        figma_data = json.load(f)

    # 스크린 추출
    screens = find_screens(figma_data)

    # 결과 준비
    if args.group:
        result = {
            k: [asdict(s) for s in v]
            for k, v in group_by_prefix(screens).items()
        }
    else:
        result = [asdict(s) for s in screens]

    # 출력
    output_json = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output_json)
        print(f"✅ {len(screens)}개 스크린 추출 완료: {args.output}")
    else:
        print(output_json)


if __name__ == '__main__':
    main()
