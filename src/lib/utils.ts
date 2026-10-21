import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    const rawValue = parts.pop()?.split(';').shift()
    if (rawValue !== undefined && rawValue !== '') {
      try {
        return decodeURIComponent(rawValue)
      } catch {
        return rawValue
      }
    }
  }

  // Fallback to localStorage if cookie was cleared or lost on browser restart
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const fromStorage = window.localStorage.getItem(name)
      if (fromStorage) {
        // Re-hydrate cookie with 7-day persistence
        setCookie(name, fromStorage, 7)
        return fromStorage
      }
    }
  } catch {
    // Ignore storage errors
  }
  
  return undefined
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const maxAge = days * 24 * 60 * 60
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; expires=${expires}; SameSite=Lax${secure}`
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(name, value)
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(name)
    }
  } catch {
    // Ignore storage errors
  }
}


