const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Auth
  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // Profile
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Security
  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },
};
