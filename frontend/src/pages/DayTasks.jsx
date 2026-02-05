import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';

const formatDateLabel = (isoDate) => {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const DayTasks = () => {
  const { date } = useParams();
  const { user, logout } = useAuth();
  const { tasks, loading, updateTask, deleteTask, reorderTasks } = useTasks();
  const [isDark, setIsDark] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const theme = isDark
    ? {
        bg: '#0a0a0a',
        bgCard: '#111',
        text: '#e5e5e5',
        textMuted: '#888',
        textDim: '#555',
        textDimmer: '#333',
        border: '#1a1a1a',
        borderLight: '#222',
        accent: '#eab308',
        done: '#0d0d0d',
        doneText: '#444',
      }
    : {
        bg: '#fafafa',
        bgCard: '#fff',
        text: '#1a1a1a',
        textMuted: '#666',
        textDim: '#999',
        textDimmer: '#ccc',
        border: '#e5e5e5',
        borderLight: '#eee',
        accent: '#b8960a',
        done: '#fafafa',
        doneText: '#bbb',
      };

  const dayTasks = useMemo(
    () => tasks.filter((task) => task.scheduled_for === date),
    [tasks, date]
  );

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (draggedId === targetId) return;

    const draggedIndex = tasks.findIndex((task) => task.id === draggedId);
    const targetIndex = tasks.findIndex((task) => task.id === targetId);

    const reordered = [...tasks];
    const [draggedTask] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedTask);

    await reorderTasks(reordered);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
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
          color: theme.textDim,
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
        fontFamily: '"JetBrains Mono", "SF Mono", monospace',
        padding: '40px 24px',
      }}
    >
      <style>{`
        .day-task-row:hover .drag-handle { opacity: 1; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '3px',
                color: theme.textDim,
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              JustDo · {user?.username}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '300', margin: 0, color: isDark ? '#fff' : '#000' }}>
              {formatDateLabel(date)}
            </h1>
            <div style={{ marginTop: '8px', fontSize: '11px', color: theme.textDim }}>
              {dayTasks.length} scheduled task{dayTasks.length === 1 ? '' : 's'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.borderLight}`,
                color: theme.textDim,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {isDark ? '☀' : '☾'}
            </button>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.borderLight}`,
                color: theme.textDim,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '10px',
                letterSpacing: '1px',
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            color: theme.accent,
            fontSize: '12px',
            textDecoration: 'none',
          }}
        >
          ← Back to week view
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {dayTasks.map((task) => (
            <div
              key={task.id}
              className="day-task-row"
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, task.id)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: dragOverId === task.id ? 'rgba(234, 179, 8, 0.15)' : task.done ? theme.done : theme.bgCard,
                border: `1px solid ${dragOverId === task.id ? theme.accent : theme.borderLight}`,
                opacity: draggedId === task.id ? 0.5 : 1,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div className="drag-handle" style={{ cursor: 'grab', color: theme.textDimmer, fontSize: '10px', opacity: 0.6, userSelect: 'none' }}>
                ⋮⋮
              </div>
              
              <button
                onClick={() => updateTask(task.id, { done: !task.done })}
                style={{
                  width: '18px',
                  height: '18px',
                  border: `1px solid ${task.done ? theme.accent : theme.textDimmer}`,
                  background: task.done ? theme.accent : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {task.done && <span style={{ color: isDark ? '#000' : '#fff', fontSize: '11px' }}>✓</span>}
              </button>

              <span
                style={{
                  flex: 1,
                  fontSize: '13px',
                  color: task.done ? theme.doneText : theme.text,
                  textDecoration: task.done ? 'line-through' : 'none',
                }}
              >
                {task.text}
              </span>

              <span
                style={{
                  background: task.tag ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                  border: `1px solid ${task.tag ? 'transparent' : theme.borderLight}`,
                  color: task.tag ? theme.accent : theme.textDimmer,
                  padding: '2px 8px',
                  fontSize: '10px',
                  minWidth: '50px',
                  textAlign: 'center',
                }}
              >
                {task.tag || '—'}
              </span>

              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textDimmer,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '12px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {dayTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: theme.textDim, fontSize: '13px' }}>
            No todos scheduled for this day.
          </div>
        )}
      </div>
    </div>
  );
};

export default DayTasks;
