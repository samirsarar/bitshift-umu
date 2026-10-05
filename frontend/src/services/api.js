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

  // Incident Reports
  getReports: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.type && filters.type !== 'all') query.append('type', filters.type);
    if (filters.severity && filters.severity !== 'all') query.append('severity', filters.severity);
    if (filters.status && filters.status !== 'all') query.append('status', filters.status);
    if (filters.search) query.append('search', filters.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/reports${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createReport: async (reportData) => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(res);
  },

  updateReportStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/reports/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  deleteReport: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Emergency & Critical Locations (SOS, Shelters, Medical, Food/Water, Hazards)
  getLocations: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'all') query.append('category', filters.category);
    if (filters.status && filters.status !== 'all') query.append('status', filters.status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/emergency/locations${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createLocation: async (locationData) => {
    // Generate UUID if not provided
    const payload = {
      clientUUID: locationData.clientUUID || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...locationData,
    };
    const res = await fetch(`${API_BASE}/emergency/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Evacuation Routes
  getRoutes: async () => {
    const res = await fetch(`${API_BASE}/emergency/routes`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createRoute: async (routeData) => {
    const payload = {
      clientUUID: routeData.clientUUID || `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...routeData,
    };
    const res = await fetch(`${API_BASE}/emergency/routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateRouteStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/emergency/routes/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Emergency Data Sync (IndexedDB / Offline mesh)
  syncEmergency: async (syncPayload) => {
    const res = await fetch(`${API_BASE}/emergency/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(syncPayload),
    });
    return handleResponse(res);
  },
};

