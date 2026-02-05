import { useCallback, useEffect, useState } from 'react';
import { doneEntriesApi, tasksApi } from '../api/tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [doneEntries, setDoneEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, doneEntriesData] = await Promise.all([
        tasksApi.getAll(),
        doneEntriesApi.getAll(),
      ]);
      setTasks(tasksData);
      setDoneEntries(doneEntriesData);
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
    setTasks(tasks.map(t => (t.id === id ? updated : t)));
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

  const addDoneEntry = async (payload) => {
    const newEntry = await doneEntriesApi.create(payload);
    setDoneEntries([newEntry, ...doneEntries]);
    return newEntry;
  };

  const deleteDoneEntry = async (id) => {
    await doneEntriesApi.delete(id);
    setDoneEntries(doneEntries.filter(entry => entry.id !== id));
  };

  return {
    tasks,
    doneEntries,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addDoneEntry,
    deleteDoneEntry,
    refetch: fetchTasks,
  };
};
