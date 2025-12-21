#!/usr/bin/env python3
"""
QA 액티비티 로그 생성 스크립트

사용법:
    python generate_activity_log.py <action> <user> [--details <details>] [--metadata <json>]

예시:
    python generate_activity_log.py status_changed 홍길동 --details "Reviewing → DevDone"
    python generate_activity_log.py rejected 김철수 --details "스펙 오류" --metadata '{"reason": "invalid_spec"}'
"""

import json
import uuid
import argparse
from datetime import datetime
from typing import Dict, Any, Optional


# 액션 타입
ACTIONS = [
    'created',           # 테스트케이스 생성
    'status_changed',    # 상태 변경
    'progress_changed',  # 진행 단계 변경
    'assigned',          # 담당자 지정
    'comment_added',     # 코멘트 추가
    'checklist_updated', # 체크리스트 업데이트
    'rejected',          # 반려
    'verified',          # 검증 완료
    'deployed',          # 배포 완료
]

# 액션별 메시지 템플릿
ACTION_MESSAGES = {
    'created': '테스트케이스가 생성되었습니다.',
    'status_changed': '상태가 변경되었습니다.',
    'progress_changed': '진행 단계가 변경되었습니다.',
    'assigned': '담당자가 할당되었습니다.',
    'comment_added': '코멘트가 추가되었습니다.',
    'checklist_updated': '체크리스트가 업데이트되었습니다.',
    'rejected': '테스트케이스가 반려되었습니다.',
    'verified': '검증이 완료되었습니다.',
    'deployed': '배포가 완료되었습니다.',
}


def generate_activity_log(
    action: str,
    user: str,
    details: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """액티비티 로그 생성"""
    if action not in ACTIONS:
        raise ValueError(f"알 수 없는 액션: {action}. 가능한 액션: {', '.join(ACTIONS)}")

    log = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'action': action,
        'user': user,
    }

    if details:
        log['details'] = details

    if metadata:
        log['metadata'] = metadata

    return log


def format_log_message(log: Dict[str, Any]) -> str:
    """로그 메시지 포맷팅"""
    action = log['action']
    user = log['user']
    details = log.get('details', '')
    metadata = log.get('metadata', {})

    base_message = ACTION_MESSAGES.get(action, '알 수 없는 작업')

    # 액션별 상세 메시지
    if action == 'status_changed' and metadata:
        from_status = metadata.get('from', '?')
        to_status = metadata.get('to', '?')
        base_message = f"상태가 {from_status}에서 {to_status}(으)로 변경되었습니다."
    elif action == 'progress_changed' and metadata:
        from_progress = metadata.get('from', '?')
        to_progress = metadata.get('to', '?')
        base_message = f"진행 단계가 {from_progress}에서 {to_progress}(으)로 변경되었습니다."
    elif action == 'assigned' and details:
        base_message = f"{details}님에게 할당되었습니다."
    elif action == 'rejected' and details:
        base_message = f"반려됨: {details}"
    elif action == 'deployed' and metadata:
        env = metadata.get('environment', '?')
        base_message = f"{env} 환경에 배포되었습니다."
    elif action == 'checklist_updated' and metadata:
        completed = metadata.get('completed', 0)
        total = metadata.get('total', 0)
        base_message = f"체크리스트 업데이트 ({completed}/{total})"

    timestamp = datetime.fromisoformat(log['timestamp'])
    formatted_time = timestamp.strftime('%m월 %d일 %H:%M')

    return f"[{formatted_time}] {user}: {base_message}"


def generate_sample_logs() -> list:
    """샘플 로그 목록 생성"""
    return [
        generate_activity_log('created', '홍길동'),
        generate_activity_log(
            'status_changed',
            '홍길동',
            'Reviewing → DevDone',
            {'from': 'Reviewing', 'to': 'DevDone'}
        ),
        generate_activity_log('assigned', '김철수', '이영희'),
        generate_activity_log(
            'checklist_updated',
            '이영희',
            None,
            {'completed': 3, 'total': 5}
        ),
        generate_activity_log(
            'progress_changed',
            '이영희',
            'Working → DevDeployed',
            {'from': 'Working', 'to': 'DevDeployed'}
        ),
        generate_activity_log(
            'deployed',
            '박지성',
            None,
            {'environment': 'Dev'}
        ),
        generate_activity_log('verified', '이영희'),
    ]


def main():
    parser = argparse.ArgumentParser(description='QA 액티비티 로그 생성')
    parser.add_argument('action', nargs='?', help=f'액션 타입: {", ".join(ACTIONS)}')
    parser.add_argument('user', nargs='?', help='사용자 이름')
    parser.add_argument('--details', '-d', help='상세 내용')
    parser.add_argument('--metadata', '-m', help='메타데이터 (JSON 문자열)')
    parser.add_argument('--sample', '-s', action='store_true', help='샘플 로그 생성')
    parser.add_argument('--format', '-f', choices=['json', 'message'], default='json',
                        help='출력 형식 (json 또는 message)')

    args = parser.parse_args()

    if args.sample:
        logs = generate_sample_logs()
        if args.format == 'message':
            print("📋 샘플 액티비티 타임라인:")
            for log in logs:
                print(f"   {format_log_message(log)}")
        else:
            print(json.dumps(logs, ensure_ascii=False, indent=2))
        return

    if not args.action or not args.user:
        parser.print_help()
        print(f"\n사용 가능한 액션: {', '.join(ACTIONS)}")
        return

    # 메타데이터 파싱
    metadata = None
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError as e:
            print(f"❌ 메타데이터 JSON 파싱 오류: {e}")
            return

    try:
        log = generate_activity_log(args.action, args.user, args.details, metadata)

        if args.format == 'message':
            print(format_log_message(log))
        else:
            print(json.dumps(log, ensure_ascii=False, indent=2))

    except ValueError as e:
        print(f"❌ {e}")


if __name__ == '__main__':
    main()
