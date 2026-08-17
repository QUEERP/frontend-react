import { toast } from 'sonner';
import * as React from 'react'
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Loader2Icon, LogOutIcon, MailIcon, CheckCircle2, BellIcon } from 'lucide-react'
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

type MeUser = {
  id: string
  name: string
  email: string
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
  )
  return match ? decodeURIComponent(match[1]) : ''
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

function parseMeUser(payload: any): MeUser | null {
  if (payload?.data && typeof payload.data === 'object' && payload.data.email) {
    return payload.data as MeUser
  }
  if (payload?.message && typeof payload.message === 'object' && payload.message.email) {
    return payload.message as MeUser
  }
  if (payload?.user && typeof payload.user === 'object' && payload.user.email) {
    return payload.user as MeUser
  }
  return null
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function UserMenu() {
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<MeUser | null>(null)
  const [isEmployeeSession, setIsEmployeeSession] = React.useState(false)
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const { toast } = useToast()
  const { permissions, business, role, businessId } = useBusinessData()

  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').replace(/\/$/, '')

  React.useEffect(() => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      setIsEmployeeSession(false)
      return
    }
    const payload = decodeJwtPayload(token)
    const normalizedRole = String(payload?.role || '').trim().toUpperCase()
    const hasEmployeeId = Boolean(payload?.employeeId)
    setIsEmployeeSession(normalizedRole === 'EMPLOYEE' || hasEmployeeId)
  }, [])

  React.useEffect(() => {
    const fetchMe = async () => {
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        const data = await res.json()
        const me = parseMeUser(data)
        if (!res.ok || !me) {
          throw new Error(data?.message || 'Failed to load profile')
        }

        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [API_BASE])

  const initial = React.useMemo(() => {
    const first = String(user?.name || '').trim().charAt(0)
    return first ? first.toUpperCase() : 'U'
  }, [user?.name])

  const handleLogout = React.useCallback(() => {
    clearCookie('token')
    clearCookie('accessToken')
    clearCookie('activeBusinessId')
    try {
      localStorage.removeItem('activeBusinessId')
      localStorage.removeItem('businessName')
    } catch {}
    toast({ title: 'Logged out successfully' })
    navigate('/signin')
  }, [navigate])

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="size-9 rounded-full relative cursor-pointer border border-border/60 bg-muted hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm dark:bg-[#181a20] dark:border-[#23272c] dark:hover:bg-[#1c2128] dark:hover:border-blue-900/50">
            <Avatar className="size-7 rounded-full border border-white/50 dark:border-[#121418]/50 shadow-none">
              <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[13px] font-bold">
                {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : initial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" disabled>
            <MailIcon className="size-4" />
            <span className="truncate">{user?.email || 'No email found'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-xs" onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
