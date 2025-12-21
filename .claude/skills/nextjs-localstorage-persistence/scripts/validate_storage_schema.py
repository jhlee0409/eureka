#!/usr/bin/env python3
"""
LocalStorage 스키마 검증 유틸리티

사용법:
    python validate_storage_schema.py <json_file> --schema <schema_name>
    python validate_storage_schema.py storage.json --schema screen_data

예시:
    python validate_storage_schema.py data.json --schema screen_data
    echo '{"id": "AUTO_0001", "name": "Test"}' | python validate_storage_schema.py - --schema screen_data
"""

import sys
import json
import argparse
from typing import Dict, Any, List, Optional


# 스키마 정의
SCHEMAS: Dict[str, Dict[str, Any]] = {
    'screen_data': {
        'type': 'object',
        'required': ['id', 'name'],
        'properties': {
            'id': {'type': 'string', 'pattern': r'^[A-Z]{4}_\d{4}'},
            'name': {'type': 'string', 'minLength': 1},
            'description': {'type': 'string'},
            'depth': {'type': 'integer', 'minimum': 0},
            'testCases': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'required': ['id', 'title'],
                    'properties': {
                        'id': {'type': 'string'},
                        'title': {'type': 'string'},
                        'status': {'type': 'string'}
                    }
                }
            }
        }
    },
    'user_preferences': {
        'type': 'object',
        'required': ['theme', 'language'],
        'properties': {
            'theme': {'type': 'string', 'enum': ['light', 'dark', 'system']},
            'language': {'type': 'string'},
            'notifications': {'type': 'boolean'}
        }
    },
    'test_case': {
        'type': 'object',
        'required': ['id', 'title', 'status'],
        'properties': {
            'id': {'type': 'string'},
            'title': {'type': 'string', 'minLength': 1},
            'status': {
                'type': 'string',
                'enum': ['Reviewing', 'DevError', 'ProdError', 'DevDone',
                        'ProdDone', 'Hold', 'Rejected', 'Duplicate']
            },
            'progress': {
                'type': 'string',
                'enum': ['Waiting', 'Checking', 'Working', 'DevDeployed', 'ProdDeployed']
            },
            'assignee': {'type': 'string'},
            'activityLog': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'required': ['id', 'timestamp', 'action', 'user'],
                    'properties': {
                        'id': {'type': 'string'},
                        'timestamp': {'type': 'string'},
                        'action': {'type': 'string'},
                        'user': {'type': 'string'},
                        'details': {'type': 'string'}
                    }
                }
            }
        }
    },
    'wbs_item': {
        'type': 'object',
        'required': ['id', 'title'],
        'properties': {
            'id': {'type': 'string'},
            'title': {'type': 'string'},
            'startDate': {'type': 'string'},
            'endDate': {'type': 'string'},
            'progress': {'type': 'integer', 'minimum': 0, 'maximum': 100},
            'assignee': {'type': 'string'}
        }
    }
}


def validate_type(value: Any, expected_type: str) -> bool:
    """값의 타입 검증"""
    type_map = {
        'string': str,
        'integer': int,
        'number': (int, float),
        'boolean': bool,
        'array': list,
        'object': dict,
        'null': type(None)
    }

    expected = type_map.get(expected_type)
    if expected is None:
        return True

    return isinstance(value, expected)


def validate_value(
    value: Any,
    schema: Dict[str, Any],
    path: str = ''
) -> List[str]:
    """값을 스키마에 대해 검증"""
    errors = []

    # 타입 검증
    if 'type' in schema:
        if not validate_type(value, schema['type']):
            errors.append(f"{path}: 예상 타입 {schema['type']}, 실제 {type(value).__name__}")
            return errors

    # null 허용
    if value is None:
        if schema.get('nullable', False):
            return errors
        errors.append(f"{path}: null 값 허용되지 않음")
        return errors

    # 문자열 검증
    if schema.get('type') == 'string':
        if 'minLength' in schema and len(value) < schema['minLength']:
            errors.append(f"{path}: 최소 길이 {schema['minLength']}, 실제 {len(value)}")
        if 'maxLength' in schema and len(value) > schema['maxLength']:
            errors.append(f"{path}: 최대 길이 {schema['maxLength']}, 실제 {len(value)}")
        if 'pattern' in schema:
            import re
            if not re.match(schema['pattern'], value):
                errors.append(f"{path}: 패턴 '{schema['pattern']}'과 일치하지 않음")
        if 'enum' in schema and value not in schema['enum']:
            errors.append(f"{path}: 허용값 {schema['enum']} 중 하나여야 함, 실제 '{value}'")

    # 숫자 검증
    if schema.get('type') in ('integer', 'number'):
        if 'minimum' in schema and value < schema['minimum']:
            errors.append(f"{path}: 최소값 {schema['minimum']}, 실제 {value}")
        if 'maximum' in schema and value > schema['maximum']:
            errors.append(f"{path}: 최대값 {schema['maximum']}, 실제 {value}")

    # 배열 검증
    if schema.get('type') == 'array' and isinstance(value, list):
        if 'items' in schema:
            for i, item in enumerate(value):
                item_errors = validate_value(item, schema['items'], f"{path}[{i}]")
                errors.extend(item_errors)

    # 객체 검증
    if schema.get('type') == 'object' and isinstance(value, dict):
        # 필수 필드 확인
        for required_field in schema.get('required', []):
            if required_field not in value:
                errors.append(f"{path}: 필수 필드 '{required_field}' 누락")

        # 속성 검증
        properties = schema.get('properties', {})
        for prop_name, prop_value in value.items():
            if prop_name in properties:
                prop_path = f"{path}.{prop_name}" if path else prop_name
                prop_errors = validate_value(prop_value, properties[prop_name], prop_path)
                errors.extend(prop_errors)

    return errors


def validate_json(data: Any, schema_name: str) -> tuple:
    """JSON 데이터를 스키마에 대해 검증"""
    if schema_name not in SCHEMAS:
        return False, [f"알 수 없는 스키마: {schema_name}"], {}

    schema = SCHEMAS[schema_name]
    errors = validate_value(data, schema)

    stats = {
        'schema': schema_name,
        'valid': len(errors) == 0,
        'error_count': len(errors),
        'data_type': type(data).__name__
    }

    if isinstance(data, dict):
        stats['field_count'] = len(data)
    elif isinstance(data, list):
        stats['item_count'] = len(data)

    return len(errors) == 0, errors, stats


def list_schemas():
    """사용 가능한 스키마 목록 출력"""
    print("사용 가능한 스키마:")
    for name, schema in SCHEMAS.items():
        required = schema.get('required', [])
        props = list(schema.get('properties', {}).keys())
        print(f"\n  {name}:")
        print(f"    필수 필드: {', '.join(required) if required else '없음'}")
        print(f"    속성: {', '.join(props)}")


def main():
    parser = argparse.ArgumentParser(description='LocalStorage 스키마 검증')
    parser.add_argument('input', nargs='?', default='-',
                        help='JSON 파일 경로 (- for stdin)')
    parser.add_argument('--schema', '-s', help='스키마 이름')
    parser.add_argument('--list', '-l', action='store_true',
                        help='사용 가능한 스키마 목록')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='간단한 출력')

    args = parser.parse_args()

    if args.list:
        list_schemas()
        return

    if not args.schema:
        parser.print_help()
        print("\n사용 예시:")
        print("  python validate_storage_schema.py data.json --schema screen_data")
        print("  python validate_storage_schema.py --list")
        return

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
    is_valid, errors, stats = validate_json(data, args.schema)

    # 출력
    if args.quiet:
        if is_valid:
            print(f"✅ 유효 ({args.schema})")
        else:
            print(f"❌ 유효하지 않음 ({len(errors)}개 오류)")
    else:
        print("=" * 60)
        print(f"스키마 검증 결과: {args.schema}")
        print("=" * 60)

        if is_valid:
            print("✅ 검증 성공\n")
        else:
            print("❌ 검증 실패\n")

        print(f"📊 통계:")
        for key, value in stats.items():
            print(f"   {key}: {value}")

        if errors:
            print(f"\n❌ 오류 ({len(errors)}개):")
            for error in errors:
                print(f"   - {error}")

    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
