import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';

const pad2 = (value) => String(value).padStart(2, '0');

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseIsoDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

const formatIsoLabel = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const getWeekDays = (anchor = new Date()) => {
  const today = new Date(anchor);
  const dayOfWeek = today.getDay(); // 0 sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = toIsoDate(date);
    return {
      date,
      iso,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: toIsoDate(today) === iso,
    };
  });
};

const shiftDateByDays = (date, deltaDays) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + deltaDays);
  return copy;
};

const formatDayHeaderTop = (date) =>
  date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

const formatDayHeaderMain = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();

const formatWeekRange = (weekDays) => {
  if (!weekDays?.length) return '';
  const start = weekDays[0].date;
  const end = weekDays[weekDays.length - 1].date;
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startLabel} – ${endLabel}`;
};

const laneKeyForScheduledFor = (scheduledFor) => (scheduledFor ? scheduledFor : 'general');
const scheduledForForLaneKey = (laneKey) => (laneKey === 'general' ? null : laneKey);

const buildLaneMap = (taskList) => {
  const lanes = new Map();
  for (const task of taskList) {
    const laneKey = laneKeyForScheduledFor(task.scheduled_for);
    if (!lanes.has(laneKey)) lanes.set(laneKey, []);
    lanes.get(laneKey).push(task);
  }
  return lanes;
};

const computeLaneKeyOrder = (lanes, weekIsos) => {
  const order = ['general', ...weekIsos];
  const weekSet = new Set(weekIsos);

  const otherDateKeys = [];
  for (const key of lanes.keys()) {
    if (key === 'general') continue;
    if (weekSet.has(key)) continue;
    otherDateKeys.push(key);
  }

  const weekStart = weekIsos[0];
  const weekEnd = weekIsos[weekIsos.length - 1];
  const past = otherDateKeys.filter((k) => k < weekStart).sort((a, b) => (a < b ? 1 : -1));
  const future = otherDateKeys.filter((k) => k > weekEnd).sort((a, b) => (a > b ? 1 : -1));
  const unknown = otherDateKeys.filter((k) => k >= weekStart && k <= weekEnd);

  return [...order, ...past, ...future, ...unknown];
};

const reorderByMove = ({ taskList, weekIsos, taskId, targetLaneKey, beforeTaskId }) => {
  const lanes = buildLaneMap(taskList);
  let movedTask = null;

  for (const [, lane] of lanes) {
    const index = lane.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      movedTask = lane.splice(index, 1)[0];
      break;
    }
  }

  if (!movedTask) return taskList;

  const targetLane = lanes.get(targetLaneKey) ? [...lanes.get(targetLaneKey)] : [];
  const insertIndex = beforeTaskId ? targetLane.findIndex((t) => t.id === beforeTaskId) : -1;
  const normalizedIndex = insertIndex === -1 ? targetLane.length : insertIndex;
  targetLane.splice(normalizedIndex, 0, movedTask);
  lanes.set(targetLaneKey, targetLane);

  const laneOrder = computeLaneKeyOrder(lanes, weekIsos);
  const used = new Set();
  const flattened = [];

  for (const key of laneOrder) {
    const lane = lanes.get(key);
    if (!lane) continue;
    used.add(key);
    flattened.push(...lane);
  }

  for (const [key, lane] of lanes) {
    if (used.has(key)) continue;
    flattened.push(...lane);
  }

  return flattened;
};

const Tasks = () => {
  const { user, logout } = useAuth();
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks } = useTasks();

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const theme = {
    bg: '#ffffff',
    panel: '#ffffff',
    card: '#ffffff',
    text: '#111111',
    dim: '#6b7280',
    faint: '#9ca3af',
    border: '#f0f0f0',
    accent: '#7c3aed',
    accentMuted: 'rgba(124, 58, 237, 0.10)',
    doneText: '#9ca3af',
  };

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const weekIsos = useMemo(() => weekDays.map((d) => d.iso), [weekDays]);
  const weekStartIso = weekIsos[0];
  const weekEndIso = weekIsos[weekIsos.length - 1];
  const weekRangeLabel = useMemo(() => formatWeekRange(weekDays), [weekDays]);

  const generalTasks = useMemo(() => tasks.filter((t) => !t.scheduled_for), [tasks]);

  const tasksByDay = useMemo(() => {
    const grouped = {};
    for (const dayIso of weekIsos) grouped[dayIso] = [];
    for (const task of tasks) {
      if (task.scheduled_for && grouped[task.scheduled_for]) grouped[task.scheduled_for].push(task);
    }
    return grouped;
  }, [tasks, weekIsos]);

  const historyByDate = useMemo(() => {
    const grouped = new Map();
    for (const task of tasks) {
      if (!task.scheduled_for) continue;
      if (task.scheduled_for >= weekStartIso) continue;
      if (!grouped.has(task.scheduled_for)) grouped.set(task.scheduled_for, []);
      grouped.get(task.scheduled_for).push(task);
    }
    const dates = [...grouped.keys()].sort((a, b) => (a < b ? 1 : -1));
    return { grouped, dates };
  }, [tasks, weekStartIso]);

  const laterByDate = useMemo(() => {
    const grouped = new Map();
    for (const task of tasks) {
      if (!task.scheduled_for) continue;
      if (task.scheduled_for <= weekEndIso) continue;
      if (!grouped.has(task.scheduled_for)) grouped.set(task.scheduled_for, []);
      grouped.get(task.scheduled_for).push(task);
    }
    const dates = [...grouped.keys()].sort((a, b) => (a > b ? 1 : -1));
    return { grouped, dates };
  }, [tasks, weekEndIso]);

  const pendingCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    setDropTarget(null);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(id));
    } catch {
      // ignore
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragOverLane = (e, laneKey) => {
    e.preventDefault();
    setDropTarget((prev) =>
      prev?.laneKey === laneKey && prev.beforeTaskId == null ? prev : { laneKey, beforeTaskId: null }
    );
  };

  const handleDragOverTask = (e, laneKey, beforeTaskId) => {
    e.preventDefault();
    if (draggedId === beforeTaskId) return;
    setDropTarget({ laneKey, beforeTaskId });
  };

  const handleAddInLane = async (laneKey, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addTask(trimmed, { scheduled_for: scheduledForForLaneKey(laneKey) });
  };

  const moveTask = async ({ taskId, laneKey, beforeTaskId }) => {
    if (!taskId) return;
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return;

    let updatedTask = existing;
    if ((existing.scheduled_for ? existing.scheduled_for : null) !== scheduledForForLaneKey(laneKey)) {
      updatedTask = await updateTask(taskId, { scheduled_for: scheduledForForLaneKey(laneKey) });
    }

    const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t));
    const newOrder = reorderByMove({
      taskList: nextTasks,
      weekIsos,
      taskId,
      targetLaneKey: laneKeyForScheduledFor(scheduledForForLaneKey(laneKey)),
      beforeTaskId,
    });

    await reorderTasks(newOrder);
  };

  const handleDropOnLane = async (e, laneKey, beforeTaskId) => {
    e.preventDefault();
    const taskId = draggedId ?? Number(e.dataTransfer.getData('text/plain'));
    await moveTask({ taskId, laneKey, beforeTaskId });
    handleDragEnd();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: theme.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.faint,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.bg,
        color: theme.text,
        padding: '22px 18px 44px',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        ::placeholder { color: ${theme.faint}; }
        button { font-family: inherit; }
        .boardWrap { overflow-x: auto; }
        .weekBoard { display: grid; grid-template-columns: repeat(7, minmax(240px, 1fr)); column-gap: 18px; row-gap: 0; padding: 0; }
        .generalBoard { margin-top: 28px; }
        .lane { height: 46vh; display: flex; flex-direction: column; }
        .generalBoard .lane { height: 34vh; max-width: 980px; margin: 0 auto; }
        .laneHeader { padding: 0 0 10px; }
        .laneTop { font-size: 10px; letter-spacing: 0.08em; color: ${theme.dim}; }
        .laneMain { font-size: 18px; font-weight: 600; margin-top: 8px; line-height: 1.05; }
        .laneMainToday { color: ${theme.accent}; }
        .laneDivider { height: 1px; width: 100%; background: rgba(17, 17, 17, 0.07); margin: 0 0 10px; }
        .laneBody { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 0; }
        .laneAdd { padding: 6px 0 10px; }
        .laneAdd input { width: 100%; border: none; background: transparent; color: ${theme.text}; padding: 8px 0; font-size: 13px; }
        .taskRow { display: flex; align-items: center; gap: 10px; padding: 8px 0; background: transparent; opacity: 1; cursor: grab; }
        .taskRow:hover { background: rgba(0,0,0,0.03); }
        .taskText { flex: 1; font-size: 13px; line-height: 1.25; }
        .taskDone { color: ${theme.doneText}; text-decoration: line-through; }
        .taskControls { display: flex; align-items: center; gap: 8px; opacity: 0; transition: opacity 120ms ease; }
        .taskRow:hover .taskControls { opacity: 1; }
        .iconBtn { background: transparent; border: none; color: ${theme.dim}; cursor: pointer; padding: 2px 4px; font-size: 14px; line-height: 1; }
        .checkBox { width: 16px; height: 16px; margin: 0 2px 0 0; accent-color: ${theme.accent}; }
      `}</style>

      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.08em', color: theme.dim, textTransform: 'uppercase' }}>
              {user?.username} · {pendingCount} pending
            </div>
            <div style={{ fontSize: '14px', color: theme.text }}>{weekRangeLabel}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setWeekAnchor((prev) => shiftDateByDays(prev, -7))}
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                color: theme.dim,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              aria-label="Previous week"
              title="Previous week"
            >
              ‹
            </button>
            <button
              onClick={() => setWeekAnchor(new Date())}
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                color: theme.dim,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Today
            </button>
            <button
              onClick={() => setWeekAnchor((prev) => shiftDateByDays(prev, 7))}
              style={{
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                color: theme.dim,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              aria-label="Next week"
              title="Next week"
            >
              ›
            </button>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                color: theme.dim,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '8px',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="boardWrap">
          <div className="weekBoard">
            {weekDays.map((day) => (
              <Lane
                key={day.iso}
                topLabel={formatDayHeaderTop(day.date)}
                mainLabel={formatDayHeaderMain(day.date)}
                laneKey={day.iso}
                tasks={tasksByDay[day.iso] || []}
                theme={theme}
                draggedId={draggedId}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOverLane={handleDragOverLane}
                onDragOverTask={handleDragOverTask}
                onDropLane={handleDropOnLane}
                onAddTask={handleAddInLane}
                onToggleDone={(task) => updateTask(task.id, { done: !task.done })}
                onDelete={(task) => deleteTask(task.id)}
                isToday={day.isToday}
              />
            ))}
          </div>
        </div>

        <div className="generalBoard">
          <Lane
            topLabel="GENERAL"
            mainLabel="TASKS"
            laneKey="general"
            tasks={generalTasks}
            theme={theme}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverLane={handleDragOverLane}
            onDragOverTask={handleDragOverTask}
            onDropLane={handleDropOnLane}
            onAddTask={handleAddInLane}
            onToggleDone={(task) => updateTask(task.id, { done: !task.done })}
            onDelete={(task) => deleteTask(task.id)}
          />
        </div>

        {(historyByDate.dates.length > 0 || laterByDate.dates.length > 0) && (
          <div style={{ marginTop: '18px' }}>
            {historyByDate.dates.length > 0 && (
              <details style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                <summary style={{ cursor: 'pointer', color: theme.dim, fontSize: '11px', letterSpacing: '1px' }}>
                  HISTORY · {historyByDate.dates.length} day{historyByDate.dates.length === 1 ? '' : 's'}
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  {historyByDate.dates.map((iso) => (
                    <div key={iso} style={{ border: `1px solid ${theme.border}`, background: theme.card, padding: '10px' }}>
                      <div style={{ color: theme.dim, fontSize: '11px', marginBottom: '8px' }}>
                        {formatIsoLabel(iso)} · {historyByDate.grouped.get(iso).length}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {historyByDate.grouped.get(iso).map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            laneKey={laneKeyForScheduledFor(task.scheduled_for)}
                            theme={theme}
                            draggedId={draggedId}
                            dropTarget={null}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOverTask={() => {}}
                            onDropTask={() => {}}
                            onToggleDone={() => updateTask(task.id, { done: !task.done })}
                            onDelete={() => deleteTask(task.id)}
                            draggable
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {laterByDate.dates.length > 0 && (
              <details style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px', marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', color: theme.dim, fontSize: '11px', letterSpacing: '1px' }}>
                  LATER · {laterByDate.dates.length} day{laterByDate.dates.length === 1 ? '' : 's'}
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  {laterByDate.dates.map((iso) => (
                    <div key={iso} style={{ border: `1px solid ${theme.border}`, background: theme.card, padding: '10px' }}>
                      <div style={{ color: theme.dim, fontSize: '11px', marginBottom: '8px' }}>
                        {formatIsoLabel(iso)} · {laterByDate.grouped.get(iso).length}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {laterByDate.grouped.get(iso).map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            laneKey={laneKeyForScheduledFor(task.scheduled_for)}
                            theme={theme}
                            draggedId={draggedId}
                            dropTarget={null}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOverTask={() => {}}
                            onDropTask={() => {}}
                            onToggleDone={() => updateTask(task.id, { done: !task.done })}
                            onDelete={() => deleteTask(task.id)}
                            draggable
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Lane = ({
  topLabel,
  mainLabel,
  laneKey,
  tasks,
  theme,
  draggedId,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOverLane,
  onDragOverTask,
  onDropLane,
  onAddTask,
  onToggleDone,
  onDelete,
  isToday,
}) => {
  const [draft, setDraft] = useState('');

  return (
    <div
      className="lane"
      onDragOver={(e) => onDragOverLane(e, laneKey)}
      onDrop={(e) => onDropLane(e, laneKey, dropTarget?.laneKey === laneKey ? dropTarget.beforeTaskId : null)}
      style={{
        background: 'transparent',
      }}
    >
      <div className="laneHeader">
        <div className="laneTop">{topLabel}</div>
        <div className={`laneMain ${isToday ? 'laneMainToday' : ''}`}>{mainLabel}</div>
      </div>

      <div className="laneDivider" />

      <div
        className="laneBody"
        onDragOver={(e) => onDragOverLane(e, laneKey)}
        onDrop={(e) => {
          e.stopPropagation();
          onDropLane(e, laneKey, null);
        }}
      >
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            laneKey={laneKey}
            theme={theme}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverTask={onDragOverTask}
            onDropTask={onDropLane}
            onToggleDone={() => onToggleDone(task)}
            onDelete={() => onDelete(task)}
            draggable
          />
        ))}

        <div className="laneAdd">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const next = draft.trim();
              if (!next) return;
              await onAddTask?.(laneKey, next);
              setDraft('');
            }}
            onDragOver={(e) => onDragOverLane(e, laneKey)}
            onDrop={(e) => {
              e.stopPropagation();
              onDropLane(e, laneKey, null);
            }}
            aria-label={`Add task to ${laneKey === 'general' ? 'general' : laneKey}`}
          />
        </div>
      </div>
    </div>
  );
};

const TaskRow = ({
  task,
  laneKey,
  theme,
  draggedId,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOverTask,
  onDropTask,
  onToggleDone,
  onDelete,
  draggable,
}) => {
  const isDragging = draggedId === task.id;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.stopPropagation();
        onDragOverTask(e, laneKey, task.id);
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onDropTask(e, laneKey, task.id);
      }}
      className="taskRow"
      style={{ opacity: isDragging ? 0.55 : 1 }}
    >
      <input
        type="checkbox"
        className="checkBox"
        checked={!!task.done}
        onChange={onToggleDone}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
      />

      <div className={`taskText ${task.done ? 'taskDone' : ''}`}>{task.text}</div>

      <div className="taskControls">
        <button
          onClick={onDelete}
          className="iconBtn"
          aria-label="Delete task"
          title="Delete"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Tasks;
