import React, { useEffect, useState, useMemo } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { BellIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon, ClockIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : ''
}

interface AppNotification {
  id: string
  type: 'alert' | 'warning' | 'info'
  title: string
  message: string
  link: string
  date: string
  module: string
}

export default function NotificationsPageClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
  const params = useParams()
  const navigate = useNavigate()
  

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) return

      try {
        const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')
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
    fetchNotifications()
  }, [businessId])

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <BellIcon className="h-8 w-8 text-primary" />
          All Notifications
        </h1>
        <p className="text-muted-foreground font-medium">Review your system alerts, reminders, and updates across all modules.</p>
      </div>

      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Alerts</CardTitle>
          <Badge variant="outline" className="bg-background">{notifications.length} Unread</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
              <ClockIcon className="h-8 w-8 animate-pulse" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <CheckCircle2Icon className="h-16 w-16 text-muted-foreground/30" />
              <div className="space-y-1">
                <p className="text-xl font-bold">You're all caught up!</p>
                <p className="text-muted-foreground text-sm">No new alerts at this time.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex items-start p-6 gap-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(notif.link)}
                >
                  <div className="bg-background shrink-0 rounded-full p-2 border shadow-sm mt-1 group-hover:scale-110 transition-transform">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{notif.title}</span>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-4">
                        {new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase font-black">{notif.module}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
