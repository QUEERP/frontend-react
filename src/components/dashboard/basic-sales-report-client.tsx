import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBasicSalesReport, BasicSalesReportData } from '@/lib/api/reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users, CreditCard, Receipt, Wallet, Layers, Download, FileText } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/currency'
import { getCookie } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Badge } from '@/components/ui/badge'

export function BasicSalesReportClient() {
  const { businessId } = useParams()
  const token = React.useMemo(() => getCookie('token') || getCookie('accessToken'), [])
  
  const [data, setData] = useState<BasicSalesReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('payments')

  // Use business currency if available on user context, otherwise fallback
  const currency = 'AED'

  useEffect(() => {
    if (!businessId || !token) return
    
    let isMounted = true
    setLoading(true)
    setError(null)
    
    getBasicSalesReport(token, businessId)
      .then((res) => {
        if (isMounted) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [businessId, token])

  const exportToExcel = () => {
    let exportData: any[] = []
    let fileName = ''

    if (activeTab === 'customers') {
      exportData = data?.customersList.map(c => ({
        Company: c.company || 'N/A',
        Email: c.email || 'N/A',
        Phone: c.phone || 'N/A',
        Created: new Date(c.createdAt).toLocaleDateString()
      })) || []
      fileName = 'Customers_Report.xlsx'
    } else if (activeTab === 'payments') {
      exportData = data?.paymentsList.map(p => ({
        Date: new Date(p.paymentDate).toLocaleDateString(),
        Customer: p.customer?.company || 'N/A',
        Project: p.project?.projectName || 'N/A',
        Mode: p.paymentMode,
        Amount: p.amount,
        Allocated: p.amountAllocated,
        Status: p.status
      })) || []
      fileName = 'Payments_Report.xlsx'
    } else if (activeTab === 'credit-notes') {
      exportData = data?.creditNotesList.map(c => ({
        Date: new Date(c.createdAt).toLocaleDateString(),
        Customer: c.customer?.company || 'N/A',
        Amount: c.amount,
        Remaining: c.remainingAmount,
        Status: c.status
      })) || []
      fileName = 'Credit_Notes_Report.xlsx'
    }

    if (exportData.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report")
    XLSX.writeFile(workbook, fileName)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    let head: string[][] = []
    let body: any[][] = []
    let title = ''

    if (activeTab === 'customers') {
      title = 'Customers Report'
      head = [['Company', 'Email', 'Phone', 'Created']]
      body = data?.customersList.map(c => [
        c.company || 'N/A', c.email || 'N/A', c.phone || 'N/A', new Date(c.createdAt).toLocaleDateString()
      ]) || []
    } else if (activeTab === 'payments') {
      title = 'Payments Report'
      head = [['Date', 'Customer', 'Project', 'Mode', 'Amount', 'Allocated', 'Status']]
      body = data?.paymentsList.map(p => [
        new Date(p.paymentDate).toLocaleDateString(), p.customer?.company || 'N/A', p.project?.projectName || 'N/A', p.paymentMode, p.amount.toString(), p.amountAllocated.toString(), p.status
      ]) || []
    } else if (activeTab === 'credit-notes') {
      title = 'Credit Notes Report'
      head = [['Date', 'Customer', 'Amount', 'Remaining', 'Status']]
      body = data?.creditNotesList.map(c => [
        new Date(c.createdAt).toLocaleDateString(), c.customer?.company || 'N/A', c.amount.toString(), c.remainingAmount.toString(), c.status
      ]) || []
    }

    if (body.length === 0) return

    doc.text(title, 14, 15)
    autoTable(doc, {
      head: head,
      body: body,
      startY: 20
    })
    doc.save(`${title.replace(/ /g, '_')}.pdf`)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load sales report: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sales Report</h1>
        <p className="text-muted-foreground text-sm font-medium">Overview of your customers, payments, and credit notes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Customers */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Customers</CardTitle>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active customers in CRM</p>
          </CardContent>
        </Card>

        {/* Total Payments Made */}
        <Card className="border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Payments</CardTitle>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-700">
              {formatCurrency(data.totalPaymentsMade, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">All payments received</p>
          </CardContent>
        </Card>

        {/* Allocated vs Unallocated */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Payment Allocation</CardTitle>
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Allocated</span>
                <span className="text-sm font-bold text-foreground">{formatCurrency(data.paymentsAllocated, currency)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: data.totalPaymentsMade > 0 ? `${(data.paymentsAllocated / data.totalPaymentsMade) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-semibold text-muted-foreground">Remaining</span>
                <span className="text-sm font-bold text-rose-600">{formatCurrency(data.paymentsRemaining, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Credit Notes */}
        <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Credit Notes</CardTitle>
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {formatCurrency(data.totalCreditNotes, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total issued credits</p>
          </CardContent>
        </Card>

      </div>

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Customers</TabsTrigger>
              <TabsTrigger value="credit-notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Credit Notes</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToPDF} className="bg-white hover:bg-slate-50 border-slate-200">
                <FileText className="h-4 w-4 mr-2 text-rose-500" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel} className="bg-white hover:bg-slate-50 border-slate-200">
                <Download className="h-4 w-4 mr-2 text-emerald-500" />
                Export Excel
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm ring-1 ring-slate-200/50">
            <TabsContent value="payments" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Project</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mode</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Allocated</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentsList?.length > 0 ? (
                      data.paymentsList.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{payment.customer?.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{payment.project?.projectName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                              {payment.paymentMode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(payment.amount, currency)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(payment.amountAllocated, currency)}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              payment.status === 'fully_applied' ? 'bg-emerald-100 text-emerald-700' : 
                              payment.status === 'partially_applied' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {payment.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">No payments found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Company Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                      <TableHead className="font-semibold text-slate-700">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customersList?.length > 0 ? (
                      data.customersList.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{customer.company || '-'}</TableCell>
                          <TableCell className="text-slate-600">{customer.email || '-'}</TableCell>
                          <TableCell className="text-slate-600">{customer.phone || '-'}</TableCell>
                          <TableCell className="text-slate-500">{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">No customers found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="credit-notes" className="m-0 border-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Remaining</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.creditNotesList?.length > 0 ? (
                      data.creditNotesList.map((note) => (
                        <TableRow key={note.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">{new Date(note.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-slate-600">{note.customer?.company || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-slate-900">{formatCurrency(note.amount, currency)}</TableCell>
                          <TableCell className="text-right text-rose-600 font-medium">{formatCurrency(note.remainingAmount, currency)}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              note.status === 'APPLIED' ? 'bg-emerald-100 text-emerald-700' : 
                              note.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {note.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No credit notes found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
