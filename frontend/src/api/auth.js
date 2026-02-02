import client from './client';

export const authApi = {
  register: async (username, email, password) => {
    const response = await client.post('/auth/register/', {
      username,
      email,
      password,
      password2: password,
    });
    return response.data;
  },

  login: async (username, password) => {
    const response = await client.post('/auth/login/', {
      username,
      password,
    });
    return response.data;
  },

  me: async () => {
    const response = await client.get('/auth/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};