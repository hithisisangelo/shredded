const BASE = '/api';

function getToken() {
  return localStorage.getItem('shredded_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Auth
export const auth = {
  register: (body) =>
    fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  login: (body) =>
    fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  me: () =>
    fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handleResponse),
};

// Workouts
export const workouts = {
  getPlans: () =>
    fetch(`${BASE}/workouts/plans`, { headers: authHeaders() }).then(handleResponse),
  createPlan: (body) =>
    fetch(`${BASE}/workouts/plans`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  activatePlan: (id) =>
    fetch(`${BASE}/workouts/plans/${id}/activate`, { method: 'PUT', headers: authHeaders() }).then(handleResponse),
  deletePlan: (id) =>
    fetch(`${BASE}/workouts/plans/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
  getLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/workouts/logs${q ? '?' + q : ''}`, { headers: authHeaders() }).then(handleResponse);
  },
  createLog: (body) =>
    fetch(`${BASE}/workouts/logs`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateLog: (id, body) =>
    fetch(`${BASE}/workouts/logs/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteLog: (id) =>
    fetch(`${BASE}/workouts/logs/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
  getToday: () =>
    fetch(`${BASE}/workouts/today`, { headers: authHeaders() }).then(handleResponse),
};

// Nutrition
export const nutrition = {
  getLogs: (date) =>
    fetch(`${BASE}/nutrition/logs?date=${date}`, { headers: authHeaders() }).then(handleResponse),
  addLog: (body) =>
    fetch(`${BASE}/nutrition/logs`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateLog: (id, body) =>
    fetch(`${BASE}/nutrition/logs/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteLog: (id) =>
    fetch(`${BASE}/nutrition/logs/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
  getSummary: (date) =>
    fetch(`${BASE}/nutrition/summary?date=${date}`, { headers: authHeaders() }).then(handleResponse),
  getHistory: (days = 30) =>
    fetch(`${BASE}/nutrition/history?days=${days}`, { headers: authHeaders() }).then(handleResponse),
};

// Food Search
export const food = {
  search: (q) =>
    fetch(`${BASE}/food/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() }).then(handleResponse),
  barcode: (code) =>
    fetch(`${BASE}/food/barcode/${code}`, { headers: authHeaders() }).then(handleResponse),
};

// AI
export const ai = {
  generateProgram: (body) =>
    fetch(`${BASE}/ai/generate-program`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  chat: (body) =>
    fetch(`${BASE}/ai/chat`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  analyze: () =>
    fetch(`${BASE}/ai/analyze`, { method: 'POST', headers: authHeaders() }).then(handleResponse),
};

// Progress
export const progress = {
  getBodyweight: (days = 90) =>
    fetch(`${BASE}/progress/bodyweight?days=${days}`, { headers: authHeaders() }).then(handleResponse),
  logBodyweight: (body) =>
    fetch(`${BASE}/progress/bodyweight`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getStrength: (exercise, days = 90) =>
    fetch(`${BASE}/progress/strength?exercise=${encodeURIComponent(exercise)}&days=${days}`, { headers: authHeaders() }).then(handleResponse),
  getExercises: () =>
    fetch(`${BASE}/progress/exercises`, { headers: authHeaders() }).then(handleResponse),
  getVolume: (weeks = 8) =>
    fetch(`${BASE}/progress/volume?weeks=${weeks}`, { headers: authHeaders() }).then(handleResponse),
  getMeasurements: () =>
    fetch(`${BASE}/progress/measurements`, { headers: authHeaders() }).then(handleResponse),
  logMeasurements: (body) =>
    fetch(`${BASE}/progress/measurements`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
};

// Cardio
export const cardio = {
  getLogs: (date) =>
    fetch(`${BASE}/cardio?date=${date}`, { headers: authHeaders() }).then(handleResponse),
  addLog: (body) =>
    fetch(`${BASE}/cardio`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteLog: (id) =>
    fetch(`${BASE}/cardio/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};

// Food Photos
export const photos = {
  upload: (file, date, meal, notes) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('date', date);
    if (meal) form.append('meal', meal);
    if (notes) form.append('notes', notes);
    const token = localStorage.getItem('shredded_token');
    return fetch(`${BASE}/photos/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(handleResponse);
  },
  getByDate: (date) =>
    fetch(`${BASE}/photos?date=${date}`, { headers: authHeaders() }).then(handleResponse),
  getRecent: (days = 7) =>
    fetch(`${BASE}/photos/recent?days=${days}`, { headers: authHeaders() }).then(handleResponse),
  delete: (id) =>
    fetch(`${BASE}/photos/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};

// Settings
export const settings = {
  get: () =>
    fetch(`${BASE}/settings`, { headers: authHeaders() }).then(handleResponse),
  save: (body) =>
    fetch(`${BASE}/settings`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
};
