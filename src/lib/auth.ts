import { getCookie, clearCookie, setCookie } from './utils';

/**
 * Safely decodes the payload of a JWT token in the browser.
 */
export function decodeJwtPayload(token: string): any {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  // Exp is in seconds; Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * Checks if the current or provided token belongs to a Subscription Admin / Super Admin.
 */
export function isSubscriptionAdminUser(customToken?: string): boolean {
  const token =
    customToken ||
    getCookie('token') ||
    getCookie('accessToken') ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') : '') ||
    '';

  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (payload) {
    if (isTokenExpired(token)) {
      return false;
    }
    return Boolean(
      payload.userId === 'subscription-admin' ||
      payload.isSubscriptionAdmin === true ||
      payload.role === 'SUPER_ADMIN' ||
      payload.email?.toLowerCase() === 'admin@admin.com'
    );
  }

  // Fallback to cookie/localStorage flags
  const cookieFlag = getCookie('isSubscriptionAdmin') === 'true';
  const storageFlag =
    typeof window !== 'undefined' && localStorage.getItem('isSubscriptionAdmin') === 'true';
  const roleFlag =
    getCookie('userRole') === 'SUPER_ADMIN' ||
    (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'SUPER_ADMIN');

  return (cookieFlag || storageFlag || roleFlag) && !isTokenExpired(token);
}

/**
 * Returns the destination URL if the user has an active, valid session.
 * Returns null if not authenticated or expired.
 */
export function getAuthenticatedRedirectUrl(customToken?: string): string | null {
  const token =
    customToken ||
    getCookie('token') ||
    getCookie('accessToken') ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') : '') ||
    '';

  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }

  if (isSubscriptionAdminUser(token)) {
    return '/admin';
  }

  // Regular tenant user
  const activeBusinessId =
    getCookie('activeBusinessId') ||
    (typeof window !== 'undefined' ? localStorage.getItem('activeBusinessId') : '') ||
    decodeJwtPayload(token)?.activeBusinessId;

  if (activeBusinessId) {
    return `/dashboard/${encodeURIComponent(activeBusinessId)}`;
  }

  return '/create-business';
}

/**
 * Clears all auth-related cookies and localStorage entries across the app.
 */
export function clearAuthSession(): void {
  clearCookie('token');
  clearCookie('accessToken');
  clearCookie('isSubscriptionAdmin');
  clearCookie('userRole');
  clearCookie('activeBusinessId');

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isSubscriptionAdmin');
      localStorage.removeItem('userRole');
      localStorage.removeItem('activeBusinessId');
    } catch {
      // Ignore
    }
  }
}
