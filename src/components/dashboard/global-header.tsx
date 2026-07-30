import React from 'react'
import { Building2Icon, CheckCircle2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DashboardModeToggle } from '@/components/dashboard/mode-toggle'
import { UserMenu } from '@/components/dashboard/user-menu'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import {  useLocation  } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function DashboardGlobalHeader({ businessId }: { businessId: string }) {
  const { business } = useBusinessData()
  const pathname = useLocation().pathname

  const displayName = React.useMemo(() => {
    if (business?.name && String(business.name).trim().length > 0) {
      return business.name
    }
    return businessId ? `Business ${businessId.slice(0, 6).toUpperCase()}` : 'Your Business'
  }, [business, businessId])

  // Derive title from pathname
  const title = React.useMemo(() => {
    if (!pathname) return 'Dashboard'
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 3) {
      const lastSegment = segments[segments.length - 1]
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lastSegment);
      let displaySegment = lastSegment;
      
      if (isUUID) {
         if (segments.length >= 4) {
            const prevSegment = segments[segments.length - 2]
            if (prevSegment.endsWith('s')) {
                displaySegment = prevSegment.slice(0, -1) + ' Details'
            } else {
                displaySegment = prevSegment + ' Details'
            }
         } else {
            displaySegment = 'Details'
         }
      }

      if (displaySegment.includes('-')) {
        return displaySegment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
      }
      return displaySegment.charAt(0).toUpperCase() + displaySegment.slice(1)
    }
    return 'Dashboard'
  }, [pathname])

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:px-6 lg:px-8 dark:bg-[#121418]/80 dark:border-[#1e2228] dark:shadow-none w-full">
      <header className="flex items-center justify-between gap-4 w-full">
        {/* Left Side: Title & Badge */}
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1 size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/50 text-blue-600 shadow-sm border border-blue-100/50 dark:from-blue-500/20 dark:to-blue-500/5 dark:text-blue-400 dark:border-blue-500/20">
            <Building2Icon className="size-4" />
          </div>
          <div className="flex flex-col leading-tight ml-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-foreground dark:text-slate-100">{title}</span>
              <Badge variant="secondary" className="hidden sm:inline-flex bg-muted/80 text-muted-foreground dark:bg-[#1c2128] dark:text-slate-400 border-none px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                Overview
              </Badge>
            </div>
            <span className="truncate text-xs font-medium text-muted-foreground dark:text-slate-400">{displayName}</span>
          </div>
        </div>

        {/* Right Side: Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <DashboardModeToggle className="size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50" />
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-0.5" />
          <NotificationBell />
          <Link to={`/dashboard/${businessId}/approvals`}>
            <div className="flex items-center justify-center size-9 rounded-full border border-green-200 bg-green-50 text-green-600 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="Approvals">
              <CheckCircle2Icon className="size-4" />
            </div>
          </Link>
          <UserMenu />
        </div>
      </header>
    </div>
  )
}
