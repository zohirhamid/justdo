import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortTasks = (list) =>
    [...list].sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : 0;
      const bo = typeof b.order === 'number' ? b.order : 0;
      if (ao !== bo) return ao - bo;
      const at = a.created_at || '';
      const bt = b.created_at || '';
      return at < bt ? -1 : at > bt ? 1 : 0;
    });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (text, { tag = null, scheduled_for = null } = {}) => {
    const newTask = await tasksApi.create({ text, tag, scheduled_for });
    setTasks((prev) => sortTasks([...prev, newTask]));
    return newTask;
  };

  const updateTask = async (id, data) => {
    const updated = await tasksApi.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTask = async (id) => {
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const reorderTasks = async (newOrder) => {
    setTasks(newOrder);
    
    try {
      await tasksApi.reorder(newOrder.map(t => t.id));
    } catch (err) {
      fetchTasks();
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  };
};
