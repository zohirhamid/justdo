import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';

const todayIso = new Date().toISOString().split('T')[0];

const Tasks = () => {
  const { user, logout } = useAuth();
  const {
    tasks,
    doneEntries,
    loading,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addDoneEntry,
    deleteDoneEntry,
  } = useTasks();

  const [newTask, setNewTask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [entryDate, setEntryDate] = useState(todayIso);
  const [doneText, setDoneText] = useState('');
  const [learnedText, setLearnedText] = useState('');

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
        accentMuted: 'rgba(234, 179, 8, 0.15)',
        done: '#0d0d0d',
        doneText: '#444',
        dragHandle: '#333',
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
        accentMuted: 'rgba(184, 150, 10, 0.12)',
        done: '#fafafa',
        doneText: '#bbb',
        dragHandle: '#ccc',
      };

  const allTags = [...new Set(tasks.map(t => t.tag).filter(Boolean))];
  const filteredTasks = filterTag ? tasks.filter(t => t.tag === filterTag) : tasks;
  const pendingCount = tasks.filter(t => !t.done).length;

  const entriesByDay = useMemo(() => {
    return doneEntries.reduce((acc, entry) => {
      if (!acc[entry.entry_date]) {
        acc[entry.entry_date] = [];
      }
      acc[entry.entry_date].push(entry);
      return acc;
    }, {});
  }, [doneEntries]);

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addTask(newTask.trim(), newTag.trim().toLowerCase() || null);
    setNewTask('');
    setNewTag('');
  };

  const handleAddEntry = async (entryType) => {
    const value = entryType === 'done' ? doneText : learnedText;
    if (!value.trim()) return;

    await addDoneEntry({
      entry_date: entryDate,
      entry_type: entryType,
      text: value.trim(),
    });

    if (entryType === 'done') {
      setDoneText('');
    } else {
      setLearnedText('');
    }
  };

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

    const draggedIndex = tasks.findIndex(t => t.id === draggedId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    await reorderTasks(newTasks);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleUpdateTag = async (id, tag) => {
    await updateTask(id, { tag: tag.toLowerCase() || null });
    setEditingTag(null);
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
        transition: 'background-color 0.2s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        ::placeholder { color: ${theme.textDim}; }
        .task-row:hover .drag-handle { opacity: 1; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '300',
                margin: 0,
                color: isDark ? '#fff' : '#000',
              }}
            >
              {pendingCount} <span style={{ color: theme.textDim, fontSize: '14px' }}>pending</span>
            </h1>
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="New task..."
            style={{
              flex: 1,
              background: theme.bgCard,
              border: `1px solid ${theme.borderLight}`,
              color: theme.text,
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="tag"
            style={{
              width: '100px',
              background: theme.bgCard,
              border: `1px solid ${theme.borderLight}`,
              color: theme.textMuted,
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'inherit',
              textAlign: 'center',
            }}
          />
          <button
            onClick={handleAddTask}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.borderLight}`,
              color: theme.textDim,
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            +
          </button>
        </div>

        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={() => setFilterTag(null)}
              style={{
                background: !filterTag ? theme.accentMuted : 'transparent',
                border: `1px solid ${!filterTag ? theme.accent : theme.borderLight}`,
                color: !filterTag ? theme.accent : theme.textDim,
                padding: '4px 10px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              all
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                style={{
                  background: filterTag === tag ? theme.accentMuted : 'transparent',
                  border: `1px solid ${filterTag === tag ? theme.accent : theme.borderLight}`,
                  color: filterTag === tag ? theme.accent : theme.textDim,
                  padding: '4px 10px',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="task-row"
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
                backgroundColor: dragOverId === task.id ? theme.accentMuted : task.done ? theme.done : theme.bgCard,
                border: `1px solid ${dragOverId === task.id ? theme.accent : theme.borderLight}`,
                opacity: draggedId === task.id ? 0.5 : 1,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div
                className="drag-handle"
                style={{
                  cursor: 'grab',
                  color: theme.dragHandle,
                  fontSize: '10px',
                  opacity: 0.6,
                  userSelect: 'none',
                }}
              >
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

              {editingTag === task.id ? (
                <input
                  type="text"
                  defaultValue={task.tag || ''}
                  onBlur={(e) => handleUpdateTag(task.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTag(task.id, e.target.value);
                    if (e.key === 'Escape') setEditingTag(null);
                  }}
                  autoFocus
                  style={{
                    width: '80px',
                    background: 'transparent',
                    border: `1px solid ${theme.accent}`,
                    color: theme.textMuted,
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingTag(task.id)}
                  style={{
                    background: task.tag ? theme.accentMuted : 'transparent',
                    border: `1px solid ${task.tag ? 'transparent' : theme.borderLight}`,
                    color: task.tag ? theme.accent : theme.textDimmer,
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    minWidth: '50px',
                  }}
                >
                  {task.tag || '+tag'}
                </button>
              )}

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

        {filteredTasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: theme.textDim,
              fontSize: '13px',
            }}
          >
            {filterTag ? `No tasks tagged "${filterTag}"` : 'No tasks yet'}
          </div>
        )}

        <section
          style={{
            marginTop: '32px',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '20px',
          }}
        >
          <h2 style={{ margin: '0 0 14px', fontWeight: 400, fontSize: '16px' }}>Done list + learning log</h2>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: theme.textDim, fontSize: '11px' }}>day </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              style={{
                background: theme.bgCard,
                border: `1px solid ${theme.borderLight}`,
                color: theme.text,
                padding: '8px 10px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <input
                type="text"
                placeholder="Something you got done..."
                value={doneText}
                onChange={(e) => setDoneText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry('done')}
                style={{
                  width: '100%',
                  background: theme.bgCard,
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.text,
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => handleAddEntry('done')}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textMuted,
                  padding: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Add done item
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder="Something you learned today..."
                value={learnedText}
                onChange={(e) => setLearnedText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry('learned')}
                style={{
                  width: '100%',
                  background: theme.bgCard,
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.text,
                  padding: '10px 12px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => handleAddEntry('learned')}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  background: 'transparent',
                  border: `1px solid ${theme.borderLight}`,
                  color: theme.textMuted,
                  padding: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Add learning
              </button>
            </div>
          </div>

          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.keys(entriesByDay).length === 0 && (
              <div style={{ color: theme.textDim, fontSize: '12px' }}>
                Your history will show up here after your first done/learned note.
              </div>
            )}
            {Object.entries(entriesByDay).map(([day, entries]) => (
              <div key={day} style={{ border: `1px solid ${theme.borderLight}`, background: theme.bgCard, padding: '10px 12px' }}>
                <div style={{ color: theme.accent, fontSize: '11px', marginBottom: '8px' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {entries.map(entry => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: theme.textDim, width: '64px' }}>
                        {entry.entry_type === 'done' ? 'DONE' : 'LEARNED'}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px' }}>{entry.text}</span>
                      <button
                        onClick={() => deleteDoneEntry(entry.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: theme.textDimmer,
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: theme.textDim,
          }}
        >
          <span>{tasks.length} total</span>
          <span>{tasks.filter(t => t.done).length} done</span>
        </footer>
      </div>
    </div>
  );
};

export default Tasks;
