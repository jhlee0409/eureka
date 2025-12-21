#!/usr/bin/env python3
"""
스크린 ID 파싱 유틸리티

사용법:
    python parse_screen_id.py <screen_id>
    python parse_screen_id.py AUTO_0001
    python parse_screen_id.py PSET_0002_1
    python parse_screen_id.py --validate AUTO_0001,PSET_0002,INVALID
"""

import re
import sys
import argparse
from typing import Optional, Dict, List


SCREEN_ID_PATTERN = re.compile(r'^([A-Z]{4})_(\d{4})(?:_(.+))?$')

# 알려진 접두사들
KNOWN_PREFIXES = {
    'AUTO': '자동화 화면',
    'PSET': '설정 화면',
    'LINK': '연결 화면',
    'MENU': '메뉴 화면',
    'HOME': '홈 화면',
    'DASH': '대시보드',
    'SRCH': '검색 화면',
    'LIST': '목록 화면',
    'DETL': '상세 화면',
    'EDIT': '편집 화면',
}


def parse_screen_id(screen_id: str) -> Optional[Dict[str, str]]:
    """
    스크린 ID 파싱

    Args:
        screen_id: 파싱할 스크린 ID (예: AUTO_0001, PSET_0002_1)

    Returns:
        파싱 결과 딕셔너리 또는 None
    """
    match = SCREEN_ID_PATTERN.match(screen_id.strip())
    if not match:
        return None

    prefix = match.group(1)
    number = match.group(2)
    suffix = match.group(3)

    return {
        'full_id': match.group(0),
        'prefix': prefix,
        'prefix_name': KNOWN_PREFIXES.get(prefix, '알 수 없음'),
        'number': number,
        'number_int': int(number),
        'suffix': suffix,
        'base_id': f"{prefix}_{number}",
        'is_variant': suffix is not None,
    }


def validate_screen_ids(ids: List[str]) -> Dict[str, List[str]]:
    """
    여러 스크린 ID 유효성 검사

    Args:
        ids: 검사할 ID 목록

    Returns:
        {'valid': [...], 'invalid': [...]}
    """
    result = {'valid': [], 'invalid': []}

    for screen_id in ids:
        screen_id = screen_id.strip()
        if not screen_id:
            continue

        parsed = parse_screen_id(screen_id)
        if parsed:
            result['valid'].append(screen_id)
        else:
            result['invalid'].append(screen_id)

    return result


def generate_next_id(prefix: str, existing_ids: List[str]) -> str:
    """
    다음 사용 가능한 스크린 ID 생성

    Args:
        prefix: 접두사 (예: AUTO, PSET)
        existing_ids: 기존 ID 목록

    Returns:
        다음 ID (예: AUTO_0003)
    """
    max_number = 0

    for screen_id in existing_ids:
        parsed = parse_screen_id(screen_id)
        if parsed and parsed['prefix'] == prefix:
            max_number = max(max_number, parsed['number_int'])

    return f"{prefix}_{str(max_number + 1).zfill(4)}"


def main():
    parser = argparse.ArgumentParser(description='스크린 ID 파싱 및 검증')
    parser.add_argument('screen_id', nargs='?', help='파싱할 스크린 ID')
    parser.add_argument('--validate', '-v', help='쉼표로 구분된 ID 목록 검증')
    parser.add_argument('--next', '-n', help='다음 ID 생성 (접두사, 기존 ID)')
    parser.add_argument('--prefixes', '-p', action='store_true', help='알려진 접두사 목록')

    args = parser.parse_args()

    if args.prefixes:
        print("알려진 스크린 접두사:")
        for prefix, name in KNOWN_PREFIXES.items():
            print(f"  {prefix}: {name}")
        return

    if args.validate:
        ids = args.validate.split(',')
        result = validate_screen_ids(ids)
        print(f"✅ 유효: {len(result['valid'])}개")
        for id in result['valid']:
            print(f"   {id}")
        print(f"❌ 무효: {len(result['invalid'])}개")
        for id in result['invalid']:
            print(f"   {id}")
        return

    if args.next:
        parts = args.next.split(':')
        prefix = parts[0]
        existing = parts[1].split(',') if len(parts) > 1 else []
        next_id = generate_next_id(prefix, existing)
        print(f"다음 ID: {next_id}")
        return

    if args.screen_id:
        parsed = parse_screen_id(args.screen_id)
        if parsed:
            print(f"✅ 유효한 스크린 ID")
            print(f"   전체 ID: {parsed['full_id']}")
            print(f"   접두사: {parsed['prefix']} ({parsed['prefix_name']})")
            print(f"   번호: {parsed['number']} (정수: {parsed['number_int']})")
            print(f"   접미사: {parsed['suffix'] or '없음'}")
            print(f"   기본 ID: {parsed['base_id']}")
            print(f"   변형 여부: {'예' if parsed['is_variant'] else '아니오'}")
        else:
            print(f"❌ 유효하지 않은 스크린 ID: {args.screen_id}")
            print(f"   올바른 형식: PREFIX_0000 또는 PREFIX_0000_suffix")
            print(f"   예: AUTO_0001, PSET_0002_1, LINK_0003_ㅅ")
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
