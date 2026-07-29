import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Loader2Icon } from 'lucide-react'

const CRUD_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

type GlobalLoadingContextValue = {
  isCrudLoading: boolean
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue>({
  isCrudLoading: false,
})

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | null {
  if (!headers) return null

  if (headers instanceof Headers) {
    return headers.get(key)
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase())
    return entry?.[1] ?? null
  }

  const record = headers as Record<string, string>
  const matchKey = Object.keys(record).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase())
  return matchKey ? record[matchKey] : null
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase()
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase()
  }
  return 'GET'
}

function createMutationKey(method: string, url: string): string {
  return `${method} ${url}`
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [crudPendingCount, setCrudPendingCount] = useState(0)
  const [isCrudLoadingVisible, setIsCrudLoadingVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch.bind(window)
    const activeMutationRequests = new Set<string>()

    const incrementCrud = () => {
      setCrudPendingCount((prev) => prev + 1)
    }

    const decrementCrud = () => {
      setCrudPendingCount((prev) => Math.max(0, prev - 1))
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = getRequestMethod(input, init)
      const url = getRequestUrl(input)
      const hasAuthHeader = Boolean(getHeaderValue(init?.headers, 'authorization'))
      const hasBusinessHeader = Boolean(getHeaderValue(init?.headers, 'x-business-id'))
      const isApiCall = url.includes('/api/')

      const isTrackedCrud =
        isApiCall &&
        hasAuthHeader &&
        hasBusinessHeader &&
        CRUD_METHODS.has(method)

      if (!isTrackedCrud) {
        return originalFetch(input, init)
      }

      const mutationKey = createMutationKey(method, url)
      if (activeMutationRequests.has(mutationKey)) {
        throw new Error('Request already in progress. Please wait.')
      }

      activeMutationRequests.add(mutationKey)
      incrementCrud()

      try {
        return await originalFetch(input, init)
      } finally {
        activeMutationRequests.delete(mutationKey)
        decrementCrud()
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    if (crudPendingCount > 0) {
      showTimer = setTimeout(() => {
        setIsCrudLoadingVisible(true)
      }, 120)
    } else if (isCrudLoadingVisible) {
      hideTimer = setTimeout(() => {
        setIsCrudLoadingVisible(false)
      }, 220)
    } else {
      setIsCrudLoadingVisible(false)
    }

    return () => {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [crudPendingCount, isCrudLoadingVisible])

  const value = useMemo<GlobalLoadingContextValue>(() => {
    return {
      isCrudLoading: isCrudLoadingVisible,
    }
  }, [isCrudLoadingVisible])

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function GlobalCrudLoadingOverlay() {
  const { isCrudLoading } = useGlobalLoading()

  if (!isCrudLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 z-120 bg-background/20 backdrop-blur-[1px]">
      <div className="fixed right-4 top-4 inline-flex items-center gap-2 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <Loader2Icon className="size-4 animate-spin" />
        Processing request...
      </div>
    </div>
  )
}

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext)
}
