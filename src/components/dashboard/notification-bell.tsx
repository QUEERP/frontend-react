import React, { useEffect, useState, useMemo } from 'react'
import { BellIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react'
import { Link } from 'react-router-dom';
import {  useNavigate, useLocation  } from 'react-router-dom';

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface AppNotification {
  id: string
  type: 'alert' | 'warning' | 'info'
  title: string
  message: string
  link: string
  date: string
  module: string
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  
  const businessId = useMemo(() => {
    return pathname.match(/\/dashboard\/([^/]+)/)?.[1]
  }, [pathname])

  const fetchNotifications = async () => {
    if (!businessId) return
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')
      const res = await fetch(`${API_BASE}/api/notifications/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId
        }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Optional: set up interval to check every few minutes
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(intervalId)
  }, [businessId])

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangleIcon className="size-4 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="size-4 text-amber-500" />
      default:
        return <InfoIcon className="size-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all shadow-sm dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50">
          <BellIcon className="size-4 text-muted-foreground dark:text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-background">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <DropdownMenuLabel className="font-bold text-base p-0">Notifications</DropdownMenuLabel>
          <Badge variant="secondary" className="text-xs font-semibold">{notifications.length} unread</Badge>
        </div>
        <DropdownMenuSeparator className="m-0" />
        
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <CheckCircle2Icon className="size-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif, idx) => (
                <div key={notif.id} className="relative">
                  <DropdownMenuItem asChild className="cursor-pointer p-4 focus:bg-muted/50 rounded-none border-b last:border-0 items-start gap-4">
                    <Link to={notif.link}>
                      <div className="mt-1 bg-background shrink-0 rounded-full p-1 border shadow-sm">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-sm leading-none tracking-tight">{notif.title}</span>
                          <span className="text-[10px] whitespace-nowrap text-muted-foreground font-medium">
                            {new Date(notif.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{notif.message}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/20">
          <Button 
            variant="ghost" 
            className="w-full text-xs font-bold text-primary justify-center" 
            onClick={() => navigate(`/dashboard/${businessId}/notifications`)}
          >
            View All Notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
