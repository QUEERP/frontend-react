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

export function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If url begins with /api/, strip the duplicate /api since API_ROOT already ends with /api
  const normalized = url.startsWith('/api/') ? url.substring(4) : (url === '/api' ? '' : url);
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${API_ROOT}${cleanPath}`;
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

    const fullUrl = resolveUrl(url);
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    if (!res.ok) {
      let message = `API Error: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.message) message = errJson.message;
      } catch (_) {}
      throw new Error(message);
    }
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

    const fullUrl = resolveUrl(url);
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    if (!res.ok) {
      let message = `API Error: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.message) message = errJson.message;
      } catch (_) {}
      throw new Error(message);
    }
    const data = await res.json();
    return { data };
  },

  download: async (url: string, fallbackFilename = 'report') => {
    const token = getAuthToken();
    const businessId = getActiveBusinessId();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (businessId && !headers['x-business-id'] && !headers['X-Business-Id']) {
      headers['x-business-id'] = businessId;
    }

    const fullUrl = resolveUrl(url);
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!res.ok) {
      let message = `Export failed (${res.status} ${res.statusText})`;
      try {
        const errJson = await res.json();
        if (errJson.message) message = errJson.message;
      } catch (_) {}
      throw new Error(message);
    }

    // Extract filename from Content-Disposition header if available
    const disposition = res.headers.get('content-disposition');
    let filename = fallbackFilename;
    if (disposition && disposition.includes('filename=')) {
      const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '').trim();
      }
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
};

export default api;
