import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'
import {
    ActivityIcon,
    AlertCircleIcon,
    FileTextIcon,
    PieChartIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    AlertTriangleIcon
} from 'lucide-react'

export default function StatutoryDashboardClient() {
    const pathname = useLocation().pathname;
    const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';
    const navigate = useNavigate()
    
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [reports, setReports] = useState<any[]>([])
    const [frameworkName, setFrameworkName] = useState<string | null>(null)

    const { business, currency } = useBusinessData()
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return ''
        const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
        return match ? decodeURIComponent(match[1]) : ''
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const token = getCookie('token') || getCookie('accessToken')
            
            const [statsRes, reportsRes] = await Promise.all([
                fetch(`${API_BASE}/api/statutory/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'x-business-id': businessId }
                }),
                fetch(`${API_BASE}/api/statutory/list?businessId=${businessId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const reportsData = await reportsRes.json();

            if (statsData.success) {
                setStats(statsData.data);
            }
            if (reportsData.success) {
                setFrameworkName(reportsData.framework);
                setReports(reportsData.availableReports || []);
            }
        } catch (e) {
            console.error("Dashboard error", e)
            toast({ title: 'Error', description: 'Failed to load statutory dashboard', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const formatCurrency = (amount: number) => {
        const curr = currency || 'USD';
        const locale = curr === 'INR' ? 'en-IN' : curr === 'AED' ? 'en-AE' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(amount || 0);
    }

    if (!loading && !frameworkName) {
        return (
            <div className="p-8 max-w-4xl mx-auto mt-12 text-center space-y-6">
                <AlertTriangleIcon className="size-16 text-amber-500 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">No Statutory Framework Configured</h2>
                <p className="text-muted-foreground text-lg">
                    No statutory framework is configured for this Business Country ({business?.country || 'Unknown'}). 
                    Please configure the applicable statutory framework.
                </p>
                <Button variant="outline" onClick={() => navigate(`/dashboard/${businessId}/settings`)}>
                    Go to Settings
                </Button>
            </div>
        )
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
                    <Button variant="outline" onClick={fetchDashboardData}>Refresh Data</Button>
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
                    className="space-y-8"
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

                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Output Tax</CardTitle>
                                <PieChartIcon className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.outputTax || 0)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Input Tax</CardTitle>
                                <PieChartIcon className="size-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.inputTax || 0)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white md:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-white/80">Net Payable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold mb-2">{formatCurrency(stats.netPayable || 0)}</div>
                                {(stats.netRefund > 0) && (
                                    <p className="text-emerald-300 text-sm flex items-center gap-1">
                                        <AlertCircleIcon className="size-3" /> Refund Available: {formatCurrency(stats.netRefund || 0)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-card dark:bg-slate-900 md:col-span-2">
                            <CardHeader>
                                <CardTitle>Taxable vs Exempt / Zero Rated</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Taxable</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.taxableSales)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Zero Rated / Export</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.zeroRatedSales || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Exempt</p>
                                        <p className="text-lg font-semibold">{formatCurrency(stats.exemptSales)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="pt-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FileTextIcon className="size-5 text-indigo-500" /> Available Statutory Reports
                        </h2>
                        
                        {reports.length === 0 ? (
                            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                                <p className="text-muted-foreground">No reports found for this framework.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {reports.map((report) => (
                                    <Card key={report.code} className="flex flex-col hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
                                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg leading-tight">{report.name}</CardTitle>
                                                <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                                    {business?.country || 'Global'}
                                                </span>
                                            </div>
                                            <CardDescription className="line-clamp-2 mt-1">{report.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-4 text-sm text-slate-600 dark:text-slate-400 flex-1">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Framework:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{frameworkName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Base Currency:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{currency}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 pb-4 px-4 gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                                            <Button 
                                                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700" 
                                                onClick={() => navigate(`/dashboard/${businessId}/reports/statutory/${report.code}`)}
                                            >
                                                Generate Return
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
