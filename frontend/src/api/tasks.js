import client from './client';

export const tasksApi = {
  getAll: async () => {
    const response = await client.get('/tasks/');
    return response.data;
  },

  create: async (text, tag = null) => {
    const response = await client.post('/tasks/', { text, tag });
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.patch(`/tasks/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    await client.delete(`/tasks/${id}/`);
  },

  reorder: async (taskIds) => {
    const response = await client.post('/tasks/reorder/', { task_ids: taskIds });
    return response.data;
  },
};

export const doneEntriesApi = {
  getAll: async () => {
    const response = await client.get('/tasks/done-entries/');
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post('/tasks/done-entries/', payload);
    return response.data;
  },

  delete: async (id) => {
    await client.delete(`/tasks/done-entries/${id}/`);
  },
};
