import * as React from 'react'

type DashboardTheme = 'light' | 'dark'

type DashboardThemeContextValue = {
  theme: DashboardTheme
  setTheme: (theme: DashboardTheme) => void
  toggleTheme: () => void
}

const DashboardThemeContext =
  React.createContext<DashboardThemeContextValue | null>(null)

const STORAGE_KEY = 'dashboard_theme'

export function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setThemeState] = React.useState<DashboardTheme>('light')
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    // Prevent flash of incorrect theme
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const initialTheme = saved === 'dark' || saved === 'light' ? saved : 'light'
    
    // Set theme immediately
    setThemeState(initialTheme)
    
    // Apply theme to document immediately
    const root = document.documentElement
    if (initialTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    setIsInitialized(true)
  }, [])

  React.useEffect(() => {
    if (!isInitialized) return
    
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save to localStorage
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, isInitialized])

  const setTheme = React.useCallback((next: DashboardTheme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return (
    <DashboardThemeContext.Provider value={value}>
      <div className={theme === 'dark' ? 'dark' : undefined}>{children}</div>
    </DashboardThemeContext.Provider>
  )
}

export function useDashboardTheme() {
  const ctx = React.useContext(DashboardThemeContext)
  if (!ctx) {
    throw new Error(
      'useDashboardTheme must be used within <DashboardThemeProvider />',
    )
  }
  return ctx
}


