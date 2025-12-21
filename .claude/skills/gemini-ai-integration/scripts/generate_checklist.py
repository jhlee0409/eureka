#!/usr/bin/env python3
"""
QA 체크리스트 생성 스크립트 (Gemini API 사용)

사용법:
    python generate_checklist.py <specification_file> [--output <output_file>]
    python generate_checklist.py spec.txt --output checklist.json

환경변수:
    GEMINI_API_KEY: Google Gemini API 키
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any, Optional

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


# 체크리스트 생성 프롬프트
QA_CHECKLIST_PROMPT = """
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

## 출력 형식
JSON 배열로 응답합니다. 각 항목:
{
  "item": "테스트 항목 설명",
  "category": "functionality|ui|performance|security",
  "priority": "high|medium|low"
}

---

화면 스펙:
{specification}

---

위 스펙에 대한 QA 체크리스트를 생성하세요.
"""


def generate_checklist_with_gemini(
    specification: str,
    api_key: str,
    model: str = "gemini-2.0-flash"
) -> List[Dict[str, Any]]:
    """Gemini API를 사용하여 체크리스트 생성"""
    if not GENAI_AVAILABLE:
        raise ImportError("google-generativeai 패키지가 설치되지 않았습니다. pip install google-generativeai")

    genai.configure(api_key=api_key)

    model_instance = genai.GenerativeModel(
        model_name=model,
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json"
        }
    )

    prompt = QA_CHECKLIST_PROMPT.format(specification=specification)
    response = model_instance.generate_content(prompt)

    return json.loads(response.text)


def generate_checklist_mock(specification: str) -> List[Dict[str, Any]]:
    """API 없이 모의 체크리스트 생성 (테스트용)"""
    # 스펙에서 키워드 추출
    keywords = []
    if '로그인' in specification or 'login' in specification.lower():
        keywords.append('로그인')
    if '버튼' in specification or 'button' in specification.lower():
        keywords.append('버튼')
    if '입력' in specification or 'input' in specification.lower():
        keywords.append('입력')
    if '목록' in specification or 'list' in specification.lower():
        keywords.append('목록')

    checklist = []

    # 기본 체크리스트 항목
    checklist.append({
        "item": "페이지가 정상적으로 로드되는지 확인",
        "category": "functionality",
        "priority": "high"
    })

    if '로그인' in keywords:
        checklist.extend([
            {"item": "유효한 자격증명으로 로그인이 성공하는지 확인", "category": "functionality", "priority": "high"},
            {"item": "잘못된 비밀번호 입력 시 에러 메시지가 표시되는지 확인", "category": "functionality", "priority": "high"},
            {"item": "비밀번호 필드가 마스킹 처리되는지 확인", "category": "security", "priority": "high"},
        ])

    if '버튼' in keywords:
        checklist.extend([
            {"item": "버튼 클릭 시 의도한 동작이 실행되는지 확인", "category": "functionality", "priority": "high"},
            {"item": "버튼 호버 상태가 디자인과 일치하는지 확인", "category": "ui", "priority": "medium"},
            {"item": "버튼 비활성화 상태가 올바르게 표시되는지 확인", "category": "ui", "priority": "medium"},
        ])

    if '입력' in keywords:
        checklist.extend([
            {"item": "입력 필드에 포커스 시 스타일이 변경되는지 확인", "category": "ui", "priority": "low"},
            {"item": "필수 입력 필드 누락 시 유효성 검사가 동작하는지 확인", "category": "functionality", "priority": "high"},
            {"item": "XSS 스크립트 입력 시 이스케이프 처리되는지 확인", "category": "security", "priority": "high"},
        ])

    if '목록' in keywords:
        checklist.extend([
            {"item": "목록이 올바르게 렌더링되는지 확인", "category": "functionality", "priority": "high"},
            {"item": "빈 목록 상태에서 적절한 메시지가 표시되는지 확인", "category": "ui", "priority": "medium"},
            {"item": "대량 항목(100개+) 로드 시 성능이 저하되지 않는지 확인", "category": "performance", "priority": "medium"},
        ])

    # 공통 항목
    checklist.extend([
        {"item": "반응형 레이아웃이 모바일에서 정상 동작하는지 확인", "category": "ui", "priority": "medium"},
        {"item": "키보드 네비게이션이 가능한지 확인", "category": "ui", "priority": "low"},
    ])

    return checklist


def sort_by_priority(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """우선순위별 정렬"""
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    return sorted(items, key=lambda x: priority_order.get(x.get('priority', 'low'), 2))


def deduplicate(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """중복 제거"""
    seen = set()
    result = []
    for item in items:
        normalized = item['item'].lower().strip()
        if normalized not in seen:
            seen.add(normalized)
            result.append(item)
    return result


def group_by_category(items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """카테고리별 그룹화"""
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for item in items:
        category = item.get('category', 'other')
        if category not in groups:
            groups[category] = []
        groups[category].append(item)
    return groups


def format_checklist(items: List[Dict[str, Any]], format_type: str = 'json') -> str:
    """체크리스트 포맷팅"""
    if format_type == 'json':
        return json.dumps(items, ensure_ascii=False, indent=2)

    elif format_type == 'markdown':
        grouped = group_by_category(items)
        lines = ['# QA 체크리스트\n']

        category_names = {
            'functionality': '기능 테스트',
            'ui': 'UI 테스트',
            'performance': '성능 테스트',
            'security': '보안 테스트'
        }

        for category, category_items in grouped.items():
            lines.append(f"\n## {category_names.get(category, category)}\n")
            for item in category_items:
                priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(item['priority'], '⚪')
                lines.append(f"- [ ] {priority_emoji} {item['item']}")

        return '\n'.join(lines)

    else:
        return json.dumps(items, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description='QA 체크리스트 생성')
    parser.add_argument('specification', nargs='?', help='스펙 파일 경로 또는 텍스트')
    parser.add_argument('--output', '-o', help='출력 파일 경로')
    parser.add_argument('--format', '-f', choices=['json', 'markdown'], default='json',
                        help='출력 형식')
    parser.add_argument('--mock', '-m', action='store_true',
                        help='API 없이 모의 생성')
    parser.add_argument('--model', default='gemini-2.0-flash',
                        help='Gemini 모델 (기본: gemini-2.0-flash)')

    args = parser.parse_args()

    # 스펙 읽기
    if not args.specification:
        parser.print_help()
        print("\n예시:")
        print("  python generate_checklist.py spec.txt")
        print("  python generate_checklist.py '로그인 화면 - 이메일/비밀번호 입력' --mock")
        return

    if os.path.isfile(args.specification):
        with open(args.specification, 'r', encoding='utf-8') as f:
            specification = f.read()
    else:
        specification = args.specification

    # 체크리스트 생성
    if args.mock:
        print("⚠️  모의 모드: API 없이 생성합니다")
        items = generate_checklist_mock(specification)
    else:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            print("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
            print("   --mock 옵션으로 모의 생성을 사용하거나 API 키를 설정하세요.")
            sys.exit(1)

        print(f"🔄 Gemini API로 체크리스트 생성 중... (모델: {args.model})")
        items = generate_checklist_with_gemini(specification, api_key, args.model)

    # 후처리
    items = deduplicate(items)
    items = sort_by_priority(items)

    # 출력
    output = format_checklist(items, args.format)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"✅ {len(items)}개 항목 생성 완료: {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()
