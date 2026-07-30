import React, { useEffect, useState } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircleIcon, CheckCircle2Icon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BusinessSetupProgress({ businessId }: { businessId: string }) {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return ''
          const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
          return match ? decodeURIComponent(match[1]) : ''
        }

        const token = getCookie('token') || getCookie('accessToken')
        if (!token) return

        const API_BASE = import.meta.env.VITE_API_BASE || ''
        const res = await fetch(`${API_BASE}/api/compliance/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-business-id': businessId
          }
        })

        if (res.ok) {
          const data = await res.json()
          setSummary(data.data)
        }
      } catch (err) {
        console.error('Failed to load compliance summary', err)
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      fetchSummary()
    }
  }, [businessId])

  if (loading || !summary) return null

  // Calculate completion percentage
  // We'll calculate based on the total rules configured vs pending tasks for the Business/Settings models
  // For a simpler approach based on the prompt, let's just use the pending tasks count directly.
  const pendingTasks = summary.pendingTasks || []
  const businessTasks = pendingTasks.filter((t: any) => t.modelName === 'Business' || t.modelName === 'Settings')
  
  if (businessTasks.length === 0) return null // Fully setup!

  // Estimate a percentage based on tasks (e.g. 5 tasks left -> 50%)
  const totalEstimatedTasks = 10 
  const completedTasks = Math.max(0, totalEstimatedTasks - businessTasks.length)
  const percentComplete = Math.round((completedTasks / totalEstimatedTasks) * 100)

  return (
    <Card className="rounded-2xl border-orange-200 bg-orange-50/50 shadow-sm overflow-hidden mb-6 dark:border-orange-900/30 dark:bg-orange-900/10">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <AlertCircleIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Business Setup Incomplete</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Your profile is {percentComplete}% complete. Please provide the missing information.</p>
              </div>
            </div>

            <div className="w-full h-2.5 bg-orange-100 rounded-full overflow-hidden dark:bg-orange-900/20">
              <div 
                className="h-full bg-orange-500 transition-all duration-1000 ease-out" 
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[280px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Missing Information</h4>
            <div className="flex flex-wrap gap-2">
              {businessTasks.slice(0, 4).map((task: any) => (
                <Badge key={task.id} variant="outline" className="bg-card border-red-200 text-red-600 dark:bg-slate-900 dark:border-red-900 dark:text-red-400 hover:bg-red-50 cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/settings`)}>
                  <span className="size-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
                  {task.rule?.description?.split('.')[0] || task.rule?.fieldName || 'Required Field'}
                </Badge>
              ))}
              {businessTasks.length > 4 && (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-none cursor-pointer" onClick={() => navigate(`/dashboard/${businessId}/settings`)}>
                  +{businessTasks.length - 4} more
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={() => navigate(`/dashboard/${businessId}/settings`)}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
            >
              Complete Setup
              <ArrowRightIcon className="size-4 ml-2" />
            </Button>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
