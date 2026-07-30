import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileTextIcon } from 'lucide-react'

export default function gstauditPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gst Audit</h2>
      </div>
      
      <Card className="rounded-2xl border-slate-100 dark:border-[#23272c] bg-white dark:bg-[#181a20]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <FileTextIcon className="size-5" />
            </div>
            <div>
              <CardTitle>Gst Audit Report</CardTitle>
              <CardDescription>Module implementation in progress</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1c2128]/50">
            <FileTextIcon className="size-10 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">This module is currently under development.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
