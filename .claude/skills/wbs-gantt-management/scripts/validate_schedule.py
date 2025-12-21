#!/usr/bin/env python3
"""
WBS 스케줄 검증 유틸리티

사용법:
    python validate_schedule.py <schedule_json>
    python validate_schedule.py schedule.json

예시:
    python validate_schedule.py tasks.json
    echo '[{"id": "1", "title": "Task", "startDate": "2024-01-01", "endDate": "2024-01-10"}]' | python validate_schedule.py -
"""

import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional


def parse_date(date_str: str) -> Optional[datetime]:
    """날짜 문자열 파싱"""
    formats = [
        '%Y-%m-%d',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S.%fZ'
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str.split('T')[0], '%Y-%m-%d')
        except ValueError:
            continue

    return None


def validate_task(task: Dict[str, Any], index: int) -> List[str]:
    """단일 태스크 검증"""
    errors = []
    task_id = task.get('id', f'index_{index}')

    # 필수 필드 확인
    required_fields = ['id', 'title', 'startDate', 'endDate']
    for field in required_fields:
        if field not in task:
            errors.append(f"태스크 {task_id}: 필수 필드 '{field}' 누락")

    # 날짜 형식 검증
    start_date = None
    end_date = None

    if 'startDate' in task:
        start_date = parse_date(task['startDate'])
        if start_date is None:
            errors.append(f"태스크 {task_id}: 잘못된 시작일 형식 '{task['startDate']}'")

    if 'endDate' in task:
        end_date = parse_date(task['endDate'])
        if end_date is None:
            errors.append(f"태스크 {task_id}: 잘못된 종료일 형식 '{task['endDate']}'")

    # 날짜 순서 검증
    if start_date and end_date:
        if start_date > end_date:
            errors.append(f"태스크 {task_id}: 시작일({task['startDate']})이 종료일({task['endDate']})보다 늦음")

    # 진행률 검증
    if 'progress' in task:
        progress = task['progress']
        if not isinstance(progress, (int, float)):
            errors.append(f"태스크 {task_id}: 진행률은 숫자여야 함")
        elif progress < 0 or progress > 100:
            errors.append(f"태스크 {task_id}: 진행률은 0-100 사이여야 함 (현재: {progress})")

    return errors


def validate_dependencies(tasks: List[Dict[str, Any]]) -> List[str]:
    """의존성 검증"""
    errors = []
    task_map = {task['id']: task for task in tasks}

    for task in tasks:
        task_id = task.get('id', 'unknown')
        dependencies = task.get('dependencies', [])

        for dep in dependencies:
            dep_task_id = dep.get('taskId') if isinstance(dep, dict) else dep

            if dep_task_id not in task_map:
                errors.append(f"태스크 {task_id}: 존재하지 않는 의존성 '{dep_task_id}'")
                continue

            dep_task = task_map[dep_task_id]

            # Finish-to-Start 검증
            dep_type = dep.get('type', 'finish-to-start') if isinstance(dep, dict) else 'finish-to-start'

            if dep_type == 'finish-to-start':
                task_start = parse_date(task.get('startDate', ''))
                dep_end = parse_date(dep_task.get('endDate', ''))

                if task_start and dep_end and task_start < dep_end:
                    errors.append(
                        f"태스크 {task_id}: 의존 태스크 {dep_task_id} 종료 전에 시작함 "
                        f"(시작: {task['startDate']}, 의존 종료: {dep_task['endDate']})"
                    )

    return errors


def detect_circular_dependencies(tasks: List[Dict[str, Any]]) -> List[str]:
    """순환 의존성 탐지"""
    errors = []
    task_map = {task['id']: task for task in tasks}

    def has_cycle(task_id: str, visited: set, path: set) -> bool:
        if task_id in path:
            return True
        if task_id in visited:
            return False

        visited.add(task_id)
        path.add(task_id)

        task = task_map.get(task_id, {})
        dependencies = task.get('dependencies', [])

        for dep in dependencies:
            dep_task_id = dep.get('taskId') if isinstance(dep, dict) else dep
            if has_cycle(dep_task_id, visited, path):
                return True

        path.remove(task_id)
        return False

    for task in tasks:
        task_id = task.get('id', '')
        if has_cycle(task_id, set(), set()):
            errors.append(f"순환 의존성 감지: 태스크 {task_id}")

    return errors


def calculate_schedule_stats(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """스케줄 통계 계산"""
    if not tasks:
        return {'task_count': 0}

    start_dates = []
    end_dates = []
    total_days = 0
    progress_sum = 0
    tasks_with_progress = 0

    for task in tasks:
        start = parse_date(task.get('startDate', ''))
        end = parse_date(task.get('endDate', ''))

        if start:
            start_dates.append(start)
        if end:
            end_dates.append(end)

        if start and end:
            total_days += (end - start).days + 1

        if 'progress' in task:
            progress_sum += task['progress']
            tasks_with_progress += 1

    stats = {
        'task_count': len(tasks),
        'total_days': total_days
    }

    if start_dates:
        min_start = min(start_dates)
        stats['earliest_start'] = min_start.strftime('%Y-%m-%d')

    if end_dates:
        max_end = max(end_dates)
        stats['latest_end'] = max_end.strftime('%Y-%m-%d')

    if start_dates and end_dates:
        stats['project_duration'] = (max(end_dates) - min(start_dates)).days + 1

    if tasks_with_progress > 0:
        stats['average_progress'] = round(progress_sum / tasks_with_progress, 1)

    # 오버랩 분석
    if len(tasks) > 1:
        overlaps = 0
        for i, t1 in enumerate(tasks):
            for t2 in tasks[i+1:]:
                s1, e1 = parse_date(t1.get('startDate', '')), parse_date(t1.get('endDate', ''))
                s2, e2 = parse_date(t2.get('startDate', '')), parse_date(t2.get('endDate', ''))
                if s1 and e1 and s2 and e2:
                    if not (e1 < s2 or e2 < s1):
                        overlaps += 1
        stats['overlapping_tasks'] = overlaps

    return stats


def validate_schedule(tasks: List[Dict[str, Any]]) -> Tuple[bool, List[str], Dict[str, Any]]:
    """전체 스케줄 검증"""
    errors = []
    warnings = []

    # 개별 태스크 검증
    for i, task in enumerate(tasks):
        task_errors = validate_task(task, i)
        errors.extend(task_errors)

    # 의존성 검증
    dep_errors = validate_dependencies(tasks)
    errors.extend(dep_errors)

    # 순환 의존성 검증
    cycle_errors = detect_circular_dependencies(tasks)
    errors.extend(cycle_errors)

    # 통계 계산
    stats = calculate_schedule_stats(tasks)
    stats['error_count'] = len(errors)

    # 경고 생성
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    for task in tasks:
        end = parse_date(task.get('endDate', ''))
        progress = task.get('progress', 100)

        if end and end < today and progress < 100:
            warnings.append(f"태스크 {task['id']}: 종료일 지남 (진행률: {progress}%)")

    stats['warnings'] = warnings

    return len(errors) == 0, errors, stats


def main():
    parser = argparse.ArgumentParser(description='WBS 스케줄 검증')
    parser.add_argument('input', nargs='?', default='-',
                        help='스케줄 JSON 파일 (- for stdin)')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='간단한 출력')
    parser.add_argument('--stats-only', action='store_true',
                        help='통계만 출력')

    args = parser.parse_args()

    # 입력 읽기
    try:
        if args.input == '-':
            content = sys.stdin.read()
        else:
            with open(args.input, 'r', encoding='utf-8') as f:
                content = f.read()

        data = json.loads(content)

        # 배열이 아니면 배열로 변환
        if isinstance(data, dict):
            data = [data]

    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ 파일을 찾을 수 없습니다: {args.input}")
        sys.exit(1)

    # 검증
    is_valid, errors, stats = validate_schedule(data)

    # 출력
    if args.stats_only:
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        return

    if args.quiet:
        if is_valid:
            print(f"✅ 유효 ({stats['task_count']}개 태스크)")
        else:
            print(f"❌ 유효하지 않음 ({len(errors)}개 오류)")
    else:
        print("=" * 60)
        print("WBS 스케줄 검증 결과")
        print("=" * 60)

        if is_valid:
            print("✅ 검증 성공\n")
        else:
            print("❌ 검증 실패\n")

        print(f"📊 통계:")
        print(f"   태스크 수: {stats['task_count']}")
        if 'earliest_start' in stats:
            print(f"   시작일: {stats['earliest_start']}")
        if 'latest_end' in stats:
            print(f"   종료일: {stats['latest_end']}")
        if 'project_duration' in stats:
            print(f"   프로젝트 기간: {stats['project_duration']}일")
        if 'total_days' in stats:
            print(f"   총 작업일: {stats['total_days']}일")
        if 'average_progress' in stats:
            print(f"   평균 진행률: {stats['average_progress']}%")
        if 'overlapping_tasks' in stats:
            print(f"   동시 진행 태스크: {stats['overlapping_tasks']}쌍")

        if errors:
            print(f"\n❌ 오류 ({len(errors)}개):")
            for error in errors:
                print(f"   - {error}")

        if stats.get('warnings'):
            print(f"\n⚠️  경고:")
            for warning in stats['warnings']:
                print(f"   - {warning}")

    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
