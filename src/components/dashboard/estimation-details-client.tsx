import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit3, Trash2, CheckCircle2, XCircle, Printer, Download, CheckCircle, Clock, Copy, Plus, Activity, AlertCircle, FileCheck, DollarSign, Info, Calendar, HandCoins, ExternalLink, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { projectOperationsAPI } from '@/lib/api/project-operations'

export interface EstimationDetailsClientProps {
  businessId: string
  estimationId: string
}

export function EstimationDetailsClient({ businessId, estimationId }: EstimationDetailsClientProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [estimation, setEstimation] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEstimation = async () => {
      if (!estimationId) return;
      try {
        setLoading(true)
        const response = await projectOperationsAPI.getEstimationById(businessId, estimationId)
        if (response.success) setEstimation(response.estimation)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to fetch estimation',
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchEstimation()
  }, [businessId, estimationId])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-background rounded-2xl border border-border mt-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading estimation details...</p>
        </div>
      </div>
    )
  }

  if (!estimation) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-4 text-slate-400" />
        <h3 className="text-xl font-bold text-foreground mb-2">Estimation Not Found</h3>
        <p className="mb-6 max-w-sm text-center">The estimation you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations`)} variant="outline" className="rounded-xl font-semibold px-6 border-border shadow-sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Estimations
        </Button>
      </div>
    )
  }

  const isApproved = estimation.status?.toLowerCase().includes('approved')
  const isRejected = estimation.status?.toLowerCase().includes('rejected')

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 🚀 Top Header / Actions 🚀 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between p-5 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/${businessId}/project-operations/estimations`)} className="rounded-xl border-border bg-background hover:bg-muted shrink-0 shadow-sm transition-all">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-foreground tracking-tight truncate">{estimation.title}</h1>
              <Badge variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"} className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px] ${isApproved ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : isRejected ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} border-0`}>
                {isApproved && <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />}
                {isRejected && <XCircle className="w-3 h-3 mr-1 inline-block" />}
                {estimation.status || 'Draft'}
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" /> Created on {new Date(estimation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">
          <Button variant="outline" className="rounded-xl font-bold bg-background shadow-sm hover:bg-muted transition-colors border-border text-foreground">
             Edit Estimation
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_340px] items-start">
        {/* 📦 Left Column: Main Details 📦 */}
        <div className="space-y-6">
          
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                Cost Breakdown
              </CardTitle>
              <CardDescription className="text-xs">Detailed summary of estimated project costs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-border">Cost Category</th>
                      <th className="px-6 py-4 border-b border-border text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Material Cost</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.materialCost)}</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Labour Cost</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.labourCost)}</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Machine Cost</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.machineCost)}</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Subcontract Cost</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.subcontractCost)}</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Travel & Expenses</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.travelCost)}</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-foreground">Miscellaneous</td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">{formatCurrency(estimation.miscCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-muted/30 p-6 flex flex-col items-end gap-3 border-t border-border relative overflow-hidden">
                <div className="w-full max-w-[280px] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Subtotal Base</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(
                        (estimation.materialCost || 0) + (estimation.labourCost || 0) + (estimation.machineCost || 0) +
                        (estimation.subcontractCost || 0) + (estimation.travelCost || 0) + (estimation.miscCost || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Profit Margin</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(estimation.profitMargin)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-3 border-b border-border border-dashed">
                    <span className="font-semibold text-muted-foreground">Tax</span>
                    <span className="font-bold text-foreground">+{formatCurrency(estimation.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-base text-foreground">Grand Total</span>
                    <span className="font-black text-xl text-blue-600 tracking-tight">{formatCurrency(estimation.totalCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {estimation.internalNotes && (
            <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
              <CardHeader className="pb-3 border-b border-border bg-muted/50">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{estimation.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 🧩 Right Column: Sidebar Meta 🧩 */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-muted/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Estimation Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              {estimation.requirement && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</span>
                  <span className="font-bold text-foreground text-base">{estimation.requirement.customer?.company || estimation.requirement.customer?.name || 'Unknown'}</span>
                </div>
              )}
              <div className="flex flex-col gap-1 pt-2 border-t border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimation ID</span>
                <span className="font-semibold text-foreground text-xs">{estimation.id}</span>
              </div>
              {estimation.requirement && (
                <div className="flex flex-col gap-1 pt-2 border-t border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Requirement</span>
                  <span className="font-bold text-blue-600">{estimation.requirement.title || estimation.requirement.reqNumber || estimation.requirementId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
