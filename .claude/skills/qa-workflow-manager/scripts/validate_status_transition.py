#!/usr/bin/env python3
"""
QA 상태 전이 검증 스크립트

사용법:
    python validate_status_transition.py <from_status> <to_status>
    python validate_status_transition.py Reviewing DevDone
    python validate_status_transition.py --all  # 모든 유효 전이 출력

예시:
    python validate_status_transition.py Reviewing DevError
    # 출력: ✅ 유효한 전이: Reviewing → DevError
"""

import sys
import argparse
from typing import Dict, List, Set


# 상태 정의
STATUSES = [
    'Reviewing',   # 검토중
    'DevError',    # Dev 오류
    'ProdError',   # Prod 오류
    'DevDone',     # Dev 완료
    'ProdDone',    # Prod 완료
    'Hold',        # 보류
    'Rejected',    # 반려
    'Duplicate',   # 중복
]

# 상태별 한글 라벨
STATUS_LABELS = {
    'Reviewing': '검토중',
    'DevError': 'Dev 오류',
    'ProdError': 'Prod 오류',
    'DevDone': 'Dev 완료',
    'ProdDone': 'Prod 완료',
    'Hold': '보류',
    'Rejected': '반려',
    'Duplicate': '중복',
}

# 유효한 상태 전이
VALID_TRANSITIONS: Dict[str, List[str]] = {
    'Reviewing': ['DevError', 'DevDone', 'Hold', 'Rejected', 'Duplicate'],
    'DevError': ['Reviewing', 'DevDone', 'Hold', 'Duplicate'],
    'ProdError': ['DevDone', 'ProdDone', 'Hold', 'Duplicate'],
    'DevDone': ['ProdError', 'ProdDone', 'Hold', 'Duplicate'],
    'ProdDone': ['Duplicate'],
    'Hold': ['Reviewing', 'DevError', 'ProdError', 'DevDone', 'ProdDone', 'Duplicate'],
    'Rejected': ['Reviewing', 'Duplicate'],
    'Duplicate': [],
}

# 전이 시 필수 조건
TRANSITION_REQUIREMENTS: Dict[str, Dict[str, bool]] = {
    'Reviewing->Rejected': {'requires_reason': True},
    'DevError->DevDone': {'requires_verification': True},
    'ProdError->ProdDone': {'requires_verification': True},
    '*->Hold': {'requires_reason': True},
}


def can_transition(from_status: str, to_status: str) -> bool:
    """상태 전이 가능 여부 확인"""
    if from_status not in VALID_TRANSITIONS:
        return False
    return to_status in VALID_TRANSITIONS[from_status]


def get_requirements(from_status: str, to_status: str) -> Dict[str, bool]:
    """전이 시 필수 조건 조회"""
    # 특정 전이 조건 확인
    key = f"{from_status}->{to_status}"
    if key in TRANSITION_REQUIREMENTS:
        return TRANSITION_REQUIREMENTS[key]

    # 와일드카드 조건 확인
    wildcard_key = f"*->{to_status}"
    if wildcard_key in TRANSITION_REQUIREMENTS:
        return TRANSITION_REQUIREMENTS[wildcard_key]

    return {}


def get_available_transitions(from_status: str) -> List[str]:
    """현재 상태에서 가능한 전이 목록"""
    return VALID_TRANSITIONS.get(from_status, [])


def validate_transition(from_status: str, to_status: str) -> tuple:
    """
    상태 전이 검증

    Returns:
        (is_valid, message, requirements)
    """
    # 상태 유효성 확인
    if from_status not in STATUSES:
        return False, f"알 수 없는 상태: {from_status}", {}

    if to_status not in STATUSES:
        return False, f"알 수 없는 상태: {to_status}", {}

    # 동일 상태
    if from_status == to_status:
        return False, "동일한 상태로의 전이는 허용되지 않습니다.", {}

    # 전이 가능 여부
    if not can_transition(from_status, to_status):
        available = get_available_transitions(from_status)
        available_str = ', '.join(available) if available else '없음'
        return False, f"{from_status}에서 {to_status}(으)로 전이할 수 없습니다. 가능한 전이: {available_str}", {}

    # 필수 조건
    requirements = get_requirements(from_status, to_status)

    return True, f"유효한 전이: {from_status} → {to_status}", requirements


def print_all_transitions():
    """모든 유효 전이 출력"""
    print("=" * 60)
    print("QA 상태 전이 규칙")
    print("=" * 60)

    for from_status, to_statuses in VALID_TRANSITIONS.items():
        from_label = STATUS_LABELS[from_status]
        print(f"\n{from_status} ({from_label}):")

        if not to_statuses:
            print("  (종료 상태 - 전이 불가)")
            continue

        for to_status in to_statuses:
            to_label = STATUS_LABELS[to_status]
            requirements = get_requirements(from_status, to_status)

            req_str = ""
            if requirements:
                reqs = []
                if requirements.get('requires_reason'):
                    reqs.append("사유 필수")
                if requirements.get('requires_verification'):
                    reqs.append("검증 필수")
                if requirements.get('requires_assignee'):
                    reqs.append("담당자 필수")
                req_str = f" [{', '.join(reqs)}]"

            print(f"  → {to_status} ({to_label}){req_str}")


def print_status_diagram():
    """상태 다이어그램 출력"""
    diagram = """
                    ┌─────────────┐
                    │  Reviewing  │ ← 초기 상태
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┬───────────────┐
           ▼               ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ DevError │    │ DevDone  │    │   Hold   │    │ Rejected │
    └────┬─────┘    └────┬─────┘    └────┬─────┘    └──────────┘
         │               │               │
         │               ▼               │
         │         ┌──────────┐          │
         └────────►│ProdError │◄─────────┘
                   └────┬─────┘
                        │
                        ▼
                   ┌──────────┐
                   │ ProdDone │ ← 최종 상태
                   └──────────┘

    ┌──────────┐
    │Duplicate │ ← 어느 상태에서든 전이 가능
    └──────────┘
    """
    print(diagram)


def main():
    parser = argparse.ArgumentParser(description='QA 상태 전이 검증')
    parser.add_argument('from_status', nargs='?', help='현재 상태')
    parser.add_argument('to_status', nargs='?', help='목표 상태')
    parser.add_argument('--all', '-a', action='store_true', help='모든 전이 규칙 출력')
    parser.add_argument('--diagram', '-d', action='store_true', help='상태 다이어그램 출력')
    parser.add_argument('--available', '-v', help='특정 상태에서 가능한 전이 목록')

    args = parser.parse_args()

    if args.diagram:
        print_status_diagram()
        return

    if args.all:
        print_all_transitions()
        return

    if args.available:
        available = get_available_transitions(args.available)
        if not available:
            if args.available not in STATUSES:
                print(f"❌ 알 수 없는 상태: {args.available}")
            else:
                print(f"ℹ️  {args.available}은(는) 종료 상태입니다.")
        else:
            print(f"📋 {args.available}에서 가능한 전이:")
            for status in available:
                print(f"   → {status} ({STATUS_LABELS[status]})")
        return

    if not args.from_status or not args.to_status:
        parser.print_help()
        return

    is_valid, message, requirements = validate_transition(args.from_status, args.to_status)

    if is_valid:
        print(f"✅ {message}")
        if requirements:
            print("   필수 조건:")
            if requirements.get('requires_reason'):
                print("   - 사유 입력 필요")
            if requirements.get('requires_verification'):
                print("   - 검증 완료 필요")
            if requirements.get('requires_assignee'):
                print("   - 담당자 지정 필요")
    else:
        print(f"❌ {message}")
        sys.exit(1)


if __name__ == '__main__':
    main()
