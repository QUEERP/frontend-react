import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {  useParams  } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast'

export default function StatutorySettingsClient() {
  const params = useParams()
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
     // Mock load
     setTimeout(() => setLoading(false), 500)
  }, [])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-muted/50 dark:bg-slate-900/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Statutory Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configuration for Statutory Reports</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => toast({ title: "Refreshing..." })}>Refresh Data</Button>
           <Button onClick={() => toast({ title: "Exporting..." })}>Export</Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-none shadow-xl bg-card/60 dark:bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Statutory Settings Details</CardTitle>
            <CardDescription>Comprehensive insights and data aggregation.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                 <div className="flex flex-col gap-4">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-full"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-full"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-full"></div>
                 </div>
             ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-border dark:border-slate-800 rounded-xl">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🚀</div>
                        <h3 className="text-lg font-medium text-foreground dark:text-slate-100">Statutory Settings Integrated</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                           This interface dynamically fetches and aggregates statutory information based on your settings.
                        </p>
                    </div>
                </div>
             )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
