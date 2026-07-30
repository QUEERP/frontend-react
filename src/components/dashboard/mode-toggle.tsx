import * as React from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useDashboardTheme } from '@/components/dashboard/dashboard-theme-provider'

export function DashboardModeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useDashboardTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn('relative', className)}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <SunIcon className="size-4 scale-100 transition-all dark:scale-0" />
      <MoonIcon className="absolute size-4 scale-0 transition-all dark:scale-100" />
    </Button>
  )
}


