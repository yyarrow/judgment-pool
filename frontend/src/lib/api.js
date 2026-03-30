import { getToken } from './auth';

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || 'Request failed' };
  return data;
}

// Auth
export const register = (name, email, password) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// Users
export const getMe = () => request('/api/users/me');

// Tasks
export const getTasks = (status = 'open', limit = 50, offset = 0) =>
  request(`/api/tasks?status=${status}&limit=${limit}&offset=${offset}`);

export const getTask = (id) => request(`/api/tasks/${id}`);

export const createTask = (data) =>
  request('/api/tasks', { method: 'POST', body: JSON.stringify(data) });

export const acceptTask = (id) =>
  request(`/api/tasks/${id}/accept`, { method: 'POST' });

export const completeTask = (id, rating) =>
  request(`/api/tasks/${id}/complete`, { method: 'POST', body: JSON.stringify({ rating }) });

export const cancelTask = (id) =>
  request(`/api/tasks/${id}/cancel`, { method: 'POST' });

export const getMyTasks = (status) =>
  request(`/api/tasks/mine${status ? `?status=${status}` : ''}`);

export const uploadFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request('/api/upload', { method: 'POST', body: form });
};

// Messages
export const getMessages = (taskId) => request(`/api/tasks/${taskId}/messages`);

export const sendMessage = (taskId, content) =>
  request(`/api/tasks/${taskId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
