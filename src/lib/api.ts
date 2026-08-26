import { API_ROOT } from '@/config/api';

export const api = {
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_ROOT}${url}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const data = await res.json();
    return { data };
  }
};

export default api;
