const API_BASE_RAW = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const API_BASE = API_BASE_RAW.replace(/\/$/, '');
export const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

if (!import.meta.env.VITE_API_BASE) {
  console.warn("WARNING: VITE_API_BASE is not set. Defaulting to http://localhost:5000");
}
