import { API_ROOT } from '@/config/api';
import { getCookie } from '@/lib/utils';

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  const token = getCookie('token') || 
                getCookie('accessToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('accessToken') || 
                '';
  return token;
}

export function getActiveBusinessId(): string {
  if (typeof window === 'undefined') return '';
  const fromCookie = getCookie('activeBusinessId');
  if (fromCookie) return fromCookie;
  const fromStorage = localStorage.getItem('activeBusinessId');
  if (fromStorage) return fromStorage;
  const match = window.location.pathname.match(/\/dashboard\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return '';
}

export const api = {
  get: async (url: string, customHeaders: Record<string, string> = {}) => {
    const token = getAuthToken();
    const businessId = getActiveBusinessId();
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...customHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (businessId && !headers['x-business-id'] && !headers['X-Business-Id']) {
      headers['x-business-id'] = businessId;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_ROOT}${url.startsWith('/') ? url : `/${url}`}`;
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const data = await res.json();
    return { data };
  },

  post: async (url: string, body?: any, customHeaders: Record<string, string> = {}) => {
    const token = getAuthToken();
    const businessId = getActiveBusinessId();
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...customHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (businessId && !headers['x-business-id'] && !headers['X-Business-Id']) {
      headers['x-business-id'] = businessId;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_ROOT}${url.startsWith('/') ? url : `/${url}`}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const data = await res.json();
    return { data };
  }
};

export default api;
