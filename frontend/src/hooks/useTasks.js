import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const addTask = async (text, tag) => {
    const newTask = await tasksApi.create(text, tag);
    setTasks([newTask, ...tasks]);
    return newTask;
  };

  const updateTask = async (id, data) => {
    const updated = await tasksApi.update(id, data);
    setTasks(tasks.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTask = async (id) => {
    await tasksApi.delete(id);
    setTasks(tasks.filter(t => t.id !== id));
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