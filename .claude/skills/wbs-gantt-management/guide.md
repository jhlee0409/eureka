# 드래그 앤 드롭 인터랙션 패턴

## 드래그 타입

### 1. 이동 (Move)
전체 바를 드래그하여 시작일과 종료일을 동시에 변경

```
Before: |████████|
         ↓ drag →
After:        |████████|
```

### 2. 왼쪽 리사이즈 (Resize Left)
시작일만 변경

```
Before:    |████████|
           ← drag
After:  |███████████|
```

### 3. 오른쪽 리사이즈 (Resize Right)
종료일만 변경

```
Before: |████████|
                 drag →
After:  |███████████████|
```

## 드래그 훅 구현

### useGanttDrag 훅

```typescript
interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  initialMouseX: number;
  initialTaskStart: Date;
  initialTaskEnd: Date;
}

interface UseGanttDragOptions {
  task: Task;
  timeline: TimelineRange;
  containerWidth: number;
  onUpdate: (updates: { startDate?: string; endDate?: string }) => void;
  minDuration?: number; // 최소 기간 (일)
}

function useGanttDrag({
  task,
  timeline,
  containerWidth,
  onUpdate,
  minDuration = 1
}: UseGanttDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    initialMouseX: 0,
    initialTaskStart: new Date(),
    initialTaskEnd: new Date()
  });

  const dayWidth = containerWidth / timeline.totalDays;

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    dragType: DragState['dragType']
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragging: true,
      dragType,
      initialMouseX: e.clientX,
      initialTaskStart: new Date(task.startDate),
      initialTaskEnd: new Date(task.endDate)
    });
  }, [task]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.initialMouseX;
    const deltaDays = Math.round(deltaX / dayWidth);

    let newStart = dragState.initialTaskStart;
    let newEnd = dragState.initialTaskEnd;

    switch (dragState.dragType) {
      case 'move':
        newStart = addDays(dragState.initialTaskStart, deltaDays);
        newEnd = addDays(dragState.initialTaskEnd, deltaDays);
        break;

      case 'resize-left':
        newStart = addDays(dragState.initialTaskStart, deltaDays);
        // 최소 기간 보장
        if (differenceInDays(newEnd, newStart) < minDuration) {
          newStart = addDays(newEnd, -minDuration);
        }
        break;

      case 'resize-right':
        newEnd = addDays(dragState.initialTaskEnd, deltaDays);
        // 최소 기간 보장
        if (differenceInDays(newEnd, newStart) < minDuration) {
          newEnd = addDays(newStart, minDuration);
        }
        break;
    }

    onUpdate({
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0]
    });
  }, [dragState, dayWidth, minDuration, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      dragType: null
    }));
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging: dragState.isDragging,
    dragType: dragState.dragType,
    handleMouseDown
  };
}
```

## 드래그 가능한 태스크 바

```tsx
function DraggableTaskBar({
  task,
  timeline,
  containerWidth,
  onUpdate
}: TaskBarProps) {
  const { isDragging, dragType, handleMouseDown } = useGanttDrag({
    task,
    timeline,
    containerWidth,
    onUpdate
  });

  const position = calculateTaskPosition(task, timeline, containerWidth);

  return (
    <div
      className={`task-bar ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.left,
        width: position.width,
        cursor: dragType === 'move' ? 'grabbing' : 'grab'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* 왼쪽 리사이즈 핸들 */}
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
      />

      {/* 콘텐츠 */}
      <div className="task-content">
        <span className="task-title">{task.title}</span>
        <span className="task-dates">
          {formatDate(task.startDate)} - {formatDate(task.endDate)}
        </span>
      </div>

      {/* 오른쪽 리사이즈 핸들 */}
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
      />
    </div>
  );
}
```

## 스냅 기능

### 날짜 스냅

```typescript
function snapToDay(date: Date): Date {
  return startOfDay(date);
}

function snapToWeek(date: Date): Date {
  return startOfWeek(date);
}

// 드래그 시 적용
const snappedDate = snapToDay(rawDate);
```

### 그리드 스냅

```typescript
function snapToGrid(pixel: number, gridSize: number): number {
  return Math.round(pixel / gridSize) * gridSize;
}

// dayWidth를 그리드 크기로 사용
const snappedX = snapToGrid(mouseX, dayWidth);
```

## 제약 조건

### 경계 제한

```typescript
function clampDate(
  date: Date,
  min: Date,
  max: Date
): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

// 타임라인 범위 내로 제한
const clampedStart = clampDate(newStart, timeline.start, timeline.end);
```

### 의존성 검증

```typescript
interface TaskDependency {
  taskId: string;
  type: 'finish-to-start' | 'start-to-start';
}

function validateDependencies(
  task: Task,
  newStart: Date,
  tasks: Task[]
): boolean {
  for (const dep of task.dependencies || []) {
    const depTask = tasks.find(t => t.id === dep.taskId);
    if (!depTask) continue;

    const depEnd = new Date(depTask.endDate);

    if (dep.type === 'finish-to-start' && newStart < depEnd) {
      return false; // 의존 태스크가 끝나기 전에 시작할 수 없음
    }
  }
  return true;
}
```

## 터치 지원

```typescript
function useGanttDragTouch({
  task,
  timeline,
  containerWidth,
  onUpdate
}: UseGanttDragOptions) {
  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((
    e: React.TouchEvent,
    dragType: DragState['dragType']
  ) => {
    const touch = e.touches[0];
    // ... 터치 시작 로직
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    // ... 터치 이동 로직
  }, []);

  const handleTouchEnd = useCallback(() => {
    // ... 터치 종료 로직
  }, []);

  // ...
}
```

## 성능 최적화

### 디바운스된 업데이트

```typescript
import { useDebouncedCallback } from 'use-debounce';

function useOptimizedGanttDrag(options: UseGanttDragOptions) {
  // 실시간 시각적 업데이트용
  const [tempPosition, setTempPosition] = useState<TaskPosition | null>(null);

  // 실제 데이터 업데이트는 디바운스
  const debouncedUpdate = useDebouncedCallback(
    (updates) => options.onUpdate(updates),
    100
  );

  // ...
}
```

### 가상화

대량의 태스크가 있을 경우:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedGantt({ tasks, ...props }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // 태스크 바 높이
    overscan: 5
  });

  return (
    <div ref={parentRef} className="gantt-scroll-container">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <TaskBar
            key={virtualRow.key}
            task={tasks[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size
            }}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}
```
