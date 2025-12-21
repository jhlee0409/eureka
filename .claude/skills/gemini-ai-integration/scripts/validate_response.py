#!/usr/bin/env python3
"""
Gemini API 응답 검증 유틸리티

사용법:
    python validate_response.py <response_file>
    python validate_response.py response.json

예시:
    echo '[{"item": "test", "category": "ui", "priority": "high"}]' | python validate_response.py -
"""

import sys
import json
import argparse
from typing import List, Dict, Any, Tuple


# 스키마 정의
VALID_CATEGORIES = ['functionality', 'ui', 'performance', 'security']
VALID_PRIORITIES = ['high', 'medium', 'low']


def validate_checklist_item(item: Dict[str, Any], index: int) -> List[str]:
    """단일 체크리스트 항목 검증"""
    errors = []

    # 필수 필드 확인
    required_fields = ['item', 'category', 'priority']
    for field in required_fields:
        if field not in item:
            errors.append(f"항목 {index}: 필수 필드 '{field}' 누락")

    # item 필드 검증
    if 'item' in item:
        if not isinstance(item['item'], str):
            errors.append(f"항목 {index}: 'item'은 문자열이어야 합니다")
        elif len(item['item'].strip()) == 0:
            errors.append(f"항목 {index}: 'item'이 비어있습니다")
        elif len(item['item']) > 500:
            errors.append(f"항목 {index}: 'item'이 너무 깁니다 (최대 500자)")

    # category 필드 검증
    if 'category' in item:
        if item['category'] not in VALID_CATEGORIES:
            errors.append(
                f"항목 {index}: 유효하지 않은 category '{item['category']}'. "
                f"허용값: {', '.join(VALID_CATEGORIES)}"
            )

    # priority 필드 검증
    if 'priority' in item:
        if item['priority'] not in VALID_PRIORITIES:
            errors.append(
                f"항목 {index}: 유효하지 않은 priority '{item['priority']}'. "
                f"허용값: {', '.join(VALID_PRIORITIES)}"
            )

    return errors


def validate_checklist(data: Any) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    체크리스트 전체 검증

    Returns:
        (is_valid, errors, stats)
    """
    errors = []
    stats = {
        'total_items': 0,
        'by_category': {},
        'by_priority': {},
        'warnings': []
    }

    # 배열인지 확인
    if not isinstance(data, list):
        errors.append("응답이 배열이 아닙니다")
        return False, errors, stats

    stats['total_items'] = len(data)

    # 빈 배열 확인
    if len(data) == 0:
        stats['warnings'].append("체크리스트가 비어있습니다")

    # 개별 항목 검증
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"항목 {i}: 객체가 아닙니다")
            continue

        item_errors = validate_checklist_item(item, i)
        errors.extend(item_errors)

        # 통계 수집
        if 'category' in item and item['category'] in VALID_CATEGORIES:
            cat = item['category']
            stats['by_category'][cat] = stats['by_category'].get(cat, 0) + 1

        if 'priority' in item and item['priority'] in VALID_PRIORITIES:
            pri = item['priority']
            stats['by_priority'][pri] = stats['by_priority'].get(pri, 0) + 1

    # 경고 생성
    if stats['total_items'] < 5:
        stats['warnings'].append(f"항목이 너무 적습니다 ({stats['total_items']}개, 권장: 5-15개)")
    elif stats['total_items'] > 15:
        stats['warnings'].append(f"항목이 너무 많습니다 ({stats['total_items']}개, 권장: 5-15개)")

    # 카테고리 분포 확인
    if stats['by_category']:
        missing_categories = set(VALID_CATEGORIES) - set(stats['by_category'].keys())
        if missing_categories:
            stats['warnings'].append(f"누락된 카테고리: {', '.join(missing_categories)}")

    is_valid = len(errors) == 0
    return is_valid, errors, stats


def print_validation_result(is_valid: bool, errors: List[str], stats: Dict[str, Any]):
    """검증 결과 출력"""
    print("=" * 60)
    print("Gemini 응답 검증 결과")
    print("=" * 60)

    if is_valid:
        print("✅ 검증 성공\n")
    else:
        print("❌ 검증 실패\n")

    # 통계
    print(f"📊 통계:")
    print(f"   총 항목 수: {stats['total_items']}")

    if stats['by_category']:
        print(f"   카테고리별:")
        for cat, count in sorted(stats['by_category'].items()):
            print(f"      - {cat}: {count}")

    if stats['by_priority']:
        print(f"   우선순위별:")
        for pri, count in sorted(stats['by_priority'].items(), key=lambda x: ['high', 'medium', 'low'].index(x[0])):
            emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}[pri]
            print(f"      - {emoji} {pri}: {count}")

    # 에러
    if errors:
        print(f"\n❌ 에러 ({len(errors)}개):")
        for error in errors:
            print(f"   - {error}")

    # 경고
    if stats['warnings']:
        print(f"\n⚠️  경고:")
        for warning in stats['warnings']:
            print(f"   - {warning}")


def main():
    parser = argparse.ArgumentParser(description='Gemini 응답 검증')
    parser.add_argument('input', nargs='?', default='-',
                        help='입력 파일 경로 (- for stdin)')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='간단한 출력')
    parser.add_argument('--json', '-j', action='store_true',
                        help='JSON 형식으로 결과 출력')

    args = parser.parse_args()

    # 입력 읽기
    try:
        if args.input == '-':
            content = sys.stdin.read()
        else:
            with open(args.input, 'r', encoding='utf-8') as f:
                content = f.read()

        data = json.loads(content)

    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ 파일을 찾을 수 없습니다: {args.input}")
        sys.exit(1)

    # 검증
    is_valid, errors, stats = validate_checklist(data)

    # 출력
    if args.json:
        result = {
            'valid': is_valid,
            'errors': errors,
            'stats': stats
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.quiet:
        if is_valid:
            print(f"✅ 유효 ({stats['total_items']}개 항목)")
        else:
            print(f"❌ 유효하지 않음 ({len(errors)}개 에러)")
    else:
        print_validation_result(is_valid, errors, stats)

    # 종료 코드
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
