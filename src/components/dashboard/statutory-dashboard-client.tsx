import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {  useParams, useNavigate  } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import {
    ActivityIcon,
    AlertCircleIcon,
    BanknoteIcon,
    FileTextIcon,
    PieChartIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    UploadCloudIcon
} from 'lucide-react'

export default function StatutoryDashboardClient() {
  const pathname = useLocation().pathname;
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
    const params = useParams()
    const navigate = useNavigate()
    
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    const { business, currency, currencySymbol } = useBusinessData()
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

    const businessCountry = business?.country || 'UAE'
    const isIndia = businessCountry === 'INDIA'
    const isUAE = businessCountry === 'UAE'

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return ''
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
        return match ? decodeURIComponent(match[1]) : ''
    }

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const token = getCookie('token') || getCookie('accessToken')
            const res = await fetch(`${API_BASE}/api/statutory/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-business-id': businessId
                }
            })
            const data = await res.json()
            if (data.success) {

                setStats(data.data)
            }
        } catch (e) {
            console.error("Dashboard error", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [])

    const formatCurrency = (amount: number) => {
        const curr = currency || 'USD';
        const locale = curr === 'INR' ? 'en-IN' : curr === 'AED' ? 'en-AE' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(amount || 0);
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 bg-muted/50 dark:bg-slate-900/50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Statutory Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Real-time overview of your tax and statutory metrics</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchDashboard}>Refresh Data</Button>
                    <Button onClick={() => navigate(`/dashboard/${businessId}/statutory/tax-reports/vat-summary`)}>
                        Generate Return
                    </Button>
                </div>
            </div>

            {loading || !stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                                <TrendingUpIcon className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
                                <TrendingDownIcon className="size-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchases)}</div>
                            </CardContent>
                        </Card>

                        {isIndia ? (
                            <>
                                <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Output GST</CardTitle>
                                        <PieChartIcon className="size-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.outputCgst + stats.outputSgst + stats.outputIgst || 0)}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Input GST</CardTitle>
                                        <PieChartIcon className="size-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.inputCgst + stats.inputSgst + stats.inputIgst || 0)}</div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <>
                                <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Output VAT</CardTitle>
                                        <PieChartIcon className="size-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.outputVat)}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Input VAT</CardTitle>
                                        <PieChartIcon className="size-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(stats.inputVat)}</div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white md:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-white/80">Net {isIndia ? 'GST' : 'VAT'} Payable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold mb-2">{formatCurrency(stats.vatPayable || stats.gstPayable || 0)}</div>
                                {(stats.vatRefund > 0 || stats.gstRefund > 0) && (
                                    <p className="text-emerald-300 text-sm flex items-center gap-1">
                                        <AlertCircleIcon className="size-3" /> Refund Available: {formatCurrency(stats.vatRefund || stats.gstRefund || 0)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900 md:col-span-2">
                            <CardHeader>
                                <CardTitle>Taxable vs {isIndia ? 'Nil Rated / Exempt' : 'Exempt'} Sales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Taxable</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.taxableSales)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{isIndia ? 'Inter-state / Export' : 'Zero Rated'}</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.zeroRatedSales || stats.exportSales || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{isIndia ? 'Exempt / Nil Rated' : 'Exempt'}</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.exemptSales)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle>Recent Generated Reports</CardTitle>
                            <CardDescription>Your most recent generated exports from the Tax Engine.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.recentReports && stats.recentReports.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentReports.map((report: any) => (
                                        <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                    <FileTextIcon className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{report.reportType}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(report.generatedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(report.fileUrl)}>Download</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No reports generated yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </motion.div>
            )}
        </div>
    )
}
