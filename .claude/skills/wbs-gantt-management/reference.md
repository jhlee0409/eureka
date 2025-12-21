# 간트차트 날짜 계산 및 렌더링 가이드

## 타임라인 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ 월      │ 12월                      │ 1월                       │
├─────────┼───┬───┬───┬───┬───┬───┬───┼───┬───┬───┬───┬───┬───┬───┤
│ 주      │16 │17 │18 │19 │20 │21 │22 │23 │24 │25 │26 │27 │28 │29 │
├─────────┼───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┤
│ Task 1  │ ████████████                                          │
│ Task 2  │              ████████████████                         │
│ Task 3  │                              ████████████████████     │
└─────────┴───────────────────────────────────────────────────────┘
```

## 날짜 유틸리티

### 기본 계산 함수

```typescript
// 날짜 관련 유틸리티
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function differenceInDays(date1: Date, date2: Date): number {
  return Math.round((date1.getTime() - date2.getTime()) / MS_PER_DAY);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}
```

### 타임라인 범위 계산

```typescript
interface TimelineRange {
  start: Date;
  end: Date;
  totalDays: number;
}

function calculateTimelineRange(tasks: Task[]): TimelineRange {
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    return {
      start: today,
      end: addDays(today, 30),
      totalDays: 30
    };
  }

  const dates = tasks.flatMap(task => [
    new Date(task.startDate),
    new Date(task.endDate)
  ]);

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // 양쪽에 1주일 여유 추가
  const start = addDays(startOfWeek(minDate), -7);
  const end = addDays(maxDate, 7);

  return {
    start: startOfDay(start),
    end: startOfDay(end),
    totalDays: differenceInDays(end, start)
  };
}
```

## 위치 계산

### 날짜 → 픽셀/퍼센트 변환

```typescript
interface TaskPosition {
  left: number;    // 퍼센트 또는 픽셀
  width: number;   // 퍼센트 또는 픽셀
}

function calculateTaskPosition(
  task: Task,
  timeline: TimelineRange,
  containerWidth: number
): TaskPosition {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);

  const startOffset = differenceInDays(taskStart, timeline.start);
  const duration = differenceInDays(taskEnd, taskStart) + 1; // 종료일 포함

  const dayWidth = containerWidth / timeline.totalDays;

  return {
    left: startOffset * dayWidth,
    width: duration * dayWidth
  };
}

// 퍼센트 기반 (반응형)
function calculateTaskPositionPercent(
  task: Task,
  timeline: TimelineRange
): TaskPosition {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);

  const startOffset = differenceInDays(taskStart, timeline.start);
  const duration = differenceInDays(taskEnd, taskStart) + 1;

  return {
    left: (startOffset / timeline.totalDays) * 100,
    width: (duration / timeline.totalDays) * 100
  };
}
```

### 픽셀 → 날짜 변환 (드래그용)

```typescript
function pixelToDate(
  pixel: number,
  timeline: TimelineRange,
  containerWidth: number
): Date {
  const dayWidth = containerWidth / timeline.totalDays;
  const dayOffset = Math.round(pixel / dayWidth);
  return addDays(timeline.start, dayOffset);
}
```

## 그리드 렌더링

### 날짜 헤더 생성

```typescript
interface DateHeader {
  date: Date;
  label: string;
  isWeekend: boolean;
  isToday: boolean;
}

function generateDateHeaders(timeline: TimelineRange): DateHeader[] {
  const headers: DateHeader[] = [];
  const today = startOfDay(new Date());

  let current = new Date(timeline.start);
  while (current <= timeline.end) {
    const dayOfWeek = current.getDay();
    headers.push({
      date: new Date(current),
      label: current.getDate().toString(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: current.getTime() === today.getTime()
    });
    current = addDays(current, 1);
  }

  return headers;
}
```

### 월 그룹화

```typescript
interface MonthGroup {
  year: number;
  month: number;
  label: string;
  startIndex: number;
  span: number;
}

function groupByMonth(headers: DateHeader[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  headers.forEach((header, index) => {
    const year = header.date.getFullYear();
    const month = header.date.getMonth();

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.year === year && lastGroup.month === month) {
      lastGroup.span++;
    } else {
      groups.push({
        year,
        month,
        label: header.date.toLocaleDateString('ko-KR', { month: 'long' }),
        startIndex: index,
        span: 1
      });
    }
  });

  return groups;
}
```

## 컴포넌트 구현

### 간트차트 컴포넌트 구조

```tsx
interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

function GanttChart({ tasks, onTaskUpdate }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const timeline = useMemo(
    () => calculateTimelineRange(tasks),
    [tasks]
  );

  const dateHeaders = useMemo(
    () => generateDateHeaders(timeline),
    [timeline]
  );

  const monthGroups = useMemo(
    () => groupByMonth(dateHeaders),
    [dateHeaders]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="gantt-container">
      {/* 헤더 */}
      <div className="gantt-header">
        <MonthRow groups={monthGroups} />
        <DateRow headers={dateHeaders} />
      </div>

      {/* 그리드 + 태스크 바 */}
      <div className="gantt-body">
        <GridLines headers={dateHeaders} />
        {tasks.map((task) => (
          <TaskBar
            key={task.id}
            task={task}
            timeline={timeline}
            containerWidth={containerWidth}
            onUpdate={(updates) => onTaskUpdate(task.id, updates)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 태스크 바 컴포넌트

```tsx
interface TaskBarProps {
  task: Task;
  timeline: TimelineRange;
  containerWidth: number;
  onUpdate: (updates: Partial<Task>) => void;
}

function TaskBar({ task, timeline, containerWidth, onUpdate }: TaskBarProps) {
  const position = calculateTaskPosition(task, timeline, containerWidth);

  return (
    <div
      className="task-bar"
      style={{
        left: position.left,
        width: position.width
      }}
    >
      {/* 왼쪽 리사이즈 핸들 */}
      <div className="resize-handle left" />

      {/* 바 콘텐츠 */}
      <div className="task-content">
        {task.title}
      </div>

      {/* 오른쪽 리사이즈 핸들 */}
      <div className="resize-handle right" />
    </div>
  );
}
```

## 스타일링

### CSS 예시

```css
.gantt-container {
  position: relative;
  overflow-x: auto;
  font-size: 12px;
}

.gantt-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.gantt-body {
  position: relative;
  min-height: 200px;
}

.task-bar {
  position: absolute;
  height: 24px;
  background: #3b82f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  cursor: move;
}

.task-bar:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
}

.resize-handle.left { left: 0; }
.resize-handle.right { right: 0; }

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e5e7eb;
}

.grid-line.weekend {
  background: #f3f4f6;
  width: 100%;
}

.grid-line.today {
  background: #ef4444;
  width: 2px;
  z-index: 5;
}
```
