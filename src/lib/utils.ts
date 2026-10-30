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

/**
 * Formats API or Prisma errors into clean, human-readable text
 * so users never see raw database stack traces or code invocations.
 */
export function formatApiErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  let rawMsg = '';
  if (typeof err === 'string') {
    rawMsg = err;
  } else if (typeof err === 'object' && err !== null) {
    const errorObj = err as any;
    rawMsg = errorObj.response?.data?.message || errorObj.data?.message || errorObj.message || String(err);
  } else {
    rawMsg = String(err);
  }

  if (!rawMsg) return 'An unexpected error occurred. Please try again.';

  // If message contains Prisma or code invocation markers
  if (
    rawMsg.includes('prisma.') ||
    rawMsg.includes('invocation') ||
    rawMsg.includes('PrismaClient') ||
    rawMsg.includes('Unknown field') ||
    rawMsg.includes('Invalid value')
  ) {
    // 1. Invalid value for argument
    const invalidArgMatch = rawMsg.match(/Invalid value for argument `?([a-zA-Z0-9_]+)`?(?:\. Expected ([a-zA-Z0-9_<>?, ]+))?/i);
    if (invalidArgMatch) {
      const field = invalidArgMatch[1];
      const rawExpected = (invalidArgMatch[2] || '').trim();
      let friendlyExpected = '';

      if (/LeadPriority/i.test(rawExpected)) {
        friendlyExpected = 'one of: Low, Medium, High, Critical';
      } else if (/LeadSource/i.test(rawExpected)) {
        friendlyExpected = 'a valid lead source (e.g. Website, Referral, LinkedIn, Partner, etc.)';
      } else if (/LeadStatus/i.test(rawExpected)) {
        friendlyExpected = 'a valid status (e.g. New, Contacted, Qualified, etc.)';
      } else if (/ExecutionType/i.test(rawExpected)) {
        friendlyExpected = 'one of: Auto Detect, Service, Product, Hybrid';
      } else if (/ContractStatus/i.test(rawExpected)) {
        friendlyExpected = 'one of: Active, Inactive, Completed, Terminated';
      } else if (/DateTime/i.test(rawExpected)) {
        friendlyExpected = 'a valid date';
      } else if (/Float|Int|Decimal/i.test(rawExpected)) {
        friendlyExpected = 'a valid number';
      } else if (/Boolean/i.test(rawExpected)) {
        friendlyExpected = 'true or false';
      } else if (rawExpected) {
        friendlyExpected = rawExpected;
      }

      return `Invalid value provided for '${field}'.${friendlyExpected ? ` Expected ${friendlyExpected}.` : ' Please check this field and try again.'}`;
    }

    // 2. Missing required argument
    const missingArgMatch = rawMsg.match(/Argument `?([a-zA-Z0-9_]+)`? is missing/i);
    if (missingArgMatch) {
      return `Required field '${missingArgMatch[1]}' is missing. Please fill it out.`;
    }

    // 3. Unique constraint failure
    const uniqueMatch = rawMsg.match(/Unique constraint failed on the (?:constraint|fields): `?([^`\n\)]+)`?/i);
    if (uniqueMatch) {
      const field = uniqueMatch[1].replace(/_key$/, '').replace(/.*_/, '');
      return `A record with this ${field} already exists. Please use a unique value.`;
    }

    // 4. Foreign key constraint failure
    const foreignKeyMatch = rawMsg.match(/Foreign key constraint failed on the field: `?([a-zA-Z0-9_]+)`?/i);
    if (foreignKeyMatch) {
      const ref = foreignKeyMatch[1].replace(/Id$/i, '');
      return `The selected ${ref} does not exist or has been removed.`;
    }

    // 5. Unknown argument / field
    const unknownMatch = rawMsg.match(/Unknown (?:argument|field) `?([a-zA-Z0-9_]+)`?/i);
    if (unknownMatch) {
      return `Unrecognized field '${unknownMatch[1]}' in submission.`;
    }

    // 6. Record not found
    if (/Record to (?:update|delete) not found/i.test(rawMsg)) {
      return 'The requested record was not found or has already been deleted.';
    }

    // 7. Fallback: extract the concluding human sentence if present
    const lines = rawMsg.split('\n').map((l) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1];
    if (
      lastLine &&
      !lastLine.includes('prisma.') &&
      !lastLine.includes('{') &&
      !lastLine.includes('}') &&
      !lastLine.includes('-->') &&
      !lastLine.includes('~~') &&
      lastLine.length < 250
    ) {
      return lastLine;
    }

    return 'A database validation error occurred. Please verify your input and try again.';
  }

  return rawMsg;
}


