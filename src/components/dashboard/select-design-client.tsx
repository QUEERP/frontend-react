import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  SaveIcon, 
  FileTextIcon, 
  LayoutIcon,
  Loader2Icon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

export function SelectDesignClient({ businessId }: { businessId: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('editId')
  const { toast } = useToast()
  const { business, refresh } = useBusinessData()
  
  const [data, setData] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  // Read the saved default template from business settings
  useEffect(() => {
    if (!business) return
    const settings = (business as any)?.settings?.[0] || (business as any)?.settings || {}
    if (settings?.invoiceTemplate) {
      setSelectedTemplate(settings.invoiceTemplate)
    }
  }, [business])

  useEffect(() => {
    const stored = window.sessionStorage.getItem('pendingInvoiceData')
    if (stored) {
      const parsed = JSON.parse(stored)
      setData(parsed)
      // Only override the default if the invoice itself has a template set
      if (parsed.designTemplate) {
        setSelectedTemplate(parsed.designTemplate)
      }
    } else {
      // If no data, go back
      navigate(`/dashboard/${businessId}/invoices/add`)
    }
  }, [businessId, navigate])

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const handleSave = async (shouldDownload = false) => {
    if (!data) return
    setIsSubmitting(true)
    
    try {
      const token = getCookie('token')
      const payload = {
        ...data,
        designTemplate: selectedTemplate,
        // Remove helper fields
        totals: undefined,
        id: undefined,
      }

      const res = await fetch(
        editId ? `${API_BASE}/api/invoices/${encodeURIComponent(String(editId))}` : `${API_BASE}/api/invoices`,
        {
          method: editId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-business-id': businessId,
          },
          body: JSON.stringify(payload),
        }
      )
      
      const resData = await res.json()
      if (!res.ok || !resData?.success) {
        throw new Error(resData?.message || 'Failed to save invoice')
      }

      const invoiceId = resData.data.id;
      const invoiceNumber = resData.data.invoiceNumber;

      if (shouldDownload) {
        toast({
          title: "Generating PDF...",
          description: "Please wait while we prepare your file.",
        })

        // Request PDF generation
        const pdfRes = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(invoiceId)}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-business-id': businessId,
          },
        })
        const pdfData = await pdfRes.json()
        
        if (pdfData?.success && pdfData.data?.pdfUrl) {
          const downloadResponse = await fetch(pdfData.data.pdfUrl)
          const blob = await downloadResponse.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = `Invoice_${invoiceNumber}.pdf`
          document.body.appendChild(a)
          a.click()
          
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(blobUrl)
          }, 100)
        }
      }

      toast({
        title: "Success!",
        description: `Invoice ${invoiceNumber || ''} has been ${editId ? 'updated' : 'created'}.`,
      })

      // Clean up
      window.sessionStorage.removeItem('pendingInvoiceData')
      await refresh()
      
      setTimeout(() => {
        navigate(`/dashboard/${businessId}/invoices`)
      }, 1500)

    } catch (err: any) {
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: err.message || "Failed to save invoice",
        variant: "destructive"
      })
    }
  }

  if (!data || !business) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const settings = business.settings?.[0] || {}

  // Safely compute totals from raw item data (in case data.totals is missing)
  const safeItems: any[] = data?.items || []
  const computedSubtotal = safeItems.reduce((sum: number, i: any) => {
    const qty = Number(i.quantity || i.hours || 0)
    const rate = Number(i.price || i.rate || 0)
    return sum + (qty * rate)
  }, 0)
  const computedTax = safeItems.reduce((sum: number, i: any) => {
    const qty = Number(i.quantity || i.hours || 0)
    const rate = Number(i.price || i.rate || 0)
    const taxPct = Number(i.taxPercent || i.tax || 0)
    return sum + (qty * rate * taxPct / 100)
  }, 0)
  const computedGrandTotal = computedSubtotal + computedTax - Number(data?.discount || 0)

  const totals = data?.totals ?? {
    subtotal: computedSubtotal,
    taxTotal: computedTax,
    grandTotal: computedGrandTotal,
  }

  // Helper to get item amount safely
  const itemAmount = (item: any) => {
    if (typeof item.amount === 'number') return item.amount
    const qty = Number(item.quantity || item.hours || 0)
    const rate = Number(item.price || item.rate || 0)
    return qty * rate
  }

  // Dynamic labels for previews
  const hasGoods = safeItems.some((i: any) => i.type === 'GOODS' || i.itemType === 'GOODS')
  const hasServices = safeItems.some((i: any) => i.type === 'SERVICE' || i.itemType === 'SERVICE')
  
  let hsnLabel = "HSN/SAC"
  let qtyLabel = "Qty/Hrs"
  
  if (hasGoods && !hasServices) {
    hsnLabel = "HSN"
    qtyLabel = "Qty"
  } else if (!hasGoods && hasServices) {
    hsnLabel = "SAC"
    qtyLabel = "Hours"
  }

  const isIndia = (business as any)?.country === 'INDIA'
  const isUAE = (business as any)?.country === 'UAE'

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeftIcon className="size-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Select Invoice Design</h1>
              <p className="text-xs text-muted-foreground">Preview your invoice with live data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Back to Edit</Button>
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSubmitting} className="gap-2 border-primary text-primary hover:bg-primary/5">
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : <FileTextIcon className="size-4" />}
              Save & Download PDF
            </Button>
            <Button onClick={() => handleSave(false)} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
              Confirm & Save
            </Button>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-8 px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Design 1: Modern (Old) */}
          <DesignCard 
            title="Old Design" 
            description="High-Detail Business Style"
            isSelected={selectedTemplate === 'modern'}
            onSelect={() => setSelectedTemplate('modern')}
          >
            <div className="w-full bg-card text-[#222] p-6 text-[7px] space-y-4 shadow-sm border min-h-[500px] flex flex-col">
              <div className="flex justify-between items-start border-b pb-4">
                <div className="w-1/3">
                  {settings.companyLogo ? <img src={settings.companyLogo} className="max-h-10" alt="Logo" /> : <div className="h-10 w-10 bg-muted flex items-center justify-center text-[6px]">LOGO</div>}
                </div>
                <div className="w-1/3 text-center">
                  <p className="font-bold text-[9px]">{settings.companyName}</p>
                  <p className="opacity-70">{settings.address}</p>
                </div>
                <div className="w-1/3 text-right">
                  <p className="font-bold text-[#1f4e79] text-[12px]">TAX INVOICE</p>
                  <p className="font-bold text-[#1f4e79]">{data.invoiceNumber || 'INV-001'}</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-[1px] bg-gray-200 border border-gray-200">
                <div className="bg-[#f8f9fa] p-1 text-[6px]"><p className="font-bold">Date</p>{new Date(data.invoiceDate).toLocaleDateString()}</div>
                <div className="bg-[#f8f9fa] p-1 text-[6px]"><p className="font-bold">Due</p>{data.dueDate ? new Date(data.dueDate).toLocaleDateString() : '-'}</div>
                <div className="bg-[#f8f9fa] p-1 text-[6px]"><p className="font-bold">SO</p>{data.soNumber || '-'}</div>
                <div className="bg-[#f8f9fa] p-1 text-[6px]"><p className="font-bold">PO</p>{data.poNumber || '-'}</div>
                <div className="bg-[#f8f9fa] p-1 text-[6px]"><p className="font-bold">Terms</p>30 Days</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8f9fa] border p-2">
                  <p className="text-[#1f4e79] font-bold border-b mb-2 pb-1">BILL TO</p>
                  <strong>Customer</strong><br/>
                  <span className="opacity-70">Billing info here...</span>
                </div>
                <div className="bg-[#f8f9fa] border p-2">
                  <p className="text-[#1f4e79] font-bold border-b mb-2 pb-1">SHIP TO</p>
                  <strong>Customer</strong><br/>
                  <span className="opacity-70">Shipping info here...</span>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead className="bg-[#1f4e79] text-white">
                  <tr>
                    <th className="p-1 text-left">Description</th>
                    <th className="p-1 text-center">{hsnLabel}</th>
                    <th className="p-1 text-center">{qtyLabel}</th>
                    <th className="p-1 text-center">Taxes</th>
                    <th className="p-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y border">
                  {data.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="p-1">{item.description || 'Item Name'}</td>
                      <td className="p-1 text-center opacity-60">SAC: {item.hsnSacCode || '-'}</td>
                      <td className="p-1 text-center">{item.hours}</td>
                      <td className="p-1 text-center text-[5px]">
                        {isIndia ? (
                          <>CGST ({item.cgstPercent || 0}%)<br/>SGST ({item.sgstPercent || 0}%)</>
                        ) : (
                          <>VAT ({item.taxPercent || 0}%)</>
                        )}
                      </td>
                      <td className="p-1 text-right font-bold">{data.currency} {item.amount || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8f9fa] border p-2">
                   <p className="font-bold border-b mb-2 pb-1">TAX BREAKDOWN</p>
                   <div className="space-y-1">
                      {isIndia ? (
                        <>
                          <p>CGST: {totals.taxTotal ? (totals.taxTotal / 2).toFixed(2) : '0.00'}</p>
                          <p>SGST: {totals.taxTotal ? (totals.taxTotal / 2).toFixed(2) : '0.00'}</p>
                        </>
                      ) : (
                        <p>VAT: {totals.taxTotal.toFixed(2)}</p>
                      )}
                      <p className="font-bold mt-1">ITEMIZED TAX DETAILS:</p>
                      <p className="text-[5px]">Tax breakdown applied per line item.</p>
                   </div>
                </div>
                <div className="border border-[#cfcfcf]">
                  <div className="p-2 flex justify-between"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span></div>
                  <div className="p-2 flex justify-between"><span>Total Tax</span><span>{totals.taxTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold bg-[#1f4e79] text-white p-2"><span>Total</span><span>{totals.grandTotal.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4">
                <div className="bg-[#f8f9fa] border p-2 w-1/2">
                   <p className="font-bold border-b mb-1 pb-1">BANK DETAILS</p>
                   <p>Bank: {settings.bankName}</p>
                   <p>IBAN: {settings.iban}</p>
                </div>
                <div className="text-center">
                   ${settings.signatureUrl ? <img src={settings.signatureUrl} className="h-8 mx-auto mb-1" /> : <div className="h-8 w-24 mx-auto border-b-2 border-black" />}
                   <div className="border-t-2 border-black pt-1 w-32">
                      <p className="font-bold text-[#1f4e79]">Authorized Signature</p>
                   </div>
                </div>
              </div>
            </div>
          </DesignCard>

          {/* Design 2: Classic (Blue Bar) */}
          <DesignCard 
            title="Blue Bar" 
            description="Premium Corporate Look"
            isSelected={selectedTemplate === 'classic'}
            onSelect={() => setSelectedTemplate('classic')}
          >
            <div className="w-full bg-card text-[#222] text-[7px] shadow-sm border min-h-[500px] flex flex-col">
              <div className="bg-[#1f4e79] text-white p-6 flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black uppercase">Invoice</h2>
                  {settings.companyLogo && <img src={settings.companyLogo} className="h-6 mt-2 brightness-0 invert" alt="Logo" />}
                </div>
                <div className="text-right opacity-80">
                  <p className="font-bold">{settings.companyName}</p>
                  <p>{settings.phone}</p>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p><strong>Invoice No.</strong> {data.invoiceNumber || 'INV-001'}</p>
                    <p><strong>Date</strong> {new Date(data.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold mb-1">BILL TO</p>
                    <p>Customer Name</p>
                    <p>Address details...</p>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-[#1f4e79] text-white">
                    <tr>
                      <th className="p-1 text-left">Item</th>
                      <th className="p-1 text-center">{hsnLabel}</th>
                      <th className="p-1 text-center">{qtyLabel}</th>
                      <th className="p-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="border-b">
                    {data.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-1">{item.description}</td>
                        <td className="p-1 text-center">SAC: {item.hsnSacCode || '-'}</td>
                        <td className="p-1 text-center">{item.hours}</td>
                        <td className="p-1 text-right">{itemAmount(item).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-4">
                   <div className="border p-2 bg-muted/5">
                      <p className="font-bold border-b mb-1">TAX BREAKDOWN</p>
                      <p className="text-[5px]">Itemized details follow same structure...</p>
                   </div>
                   <div className="text-right">
                      <table className="w-full">
                        <tr className="border-b"><td>Subtotal</td><td>{data.totals.subtotal.toFixed(2)}</td></tr>
                        <tr className="bg-[#1f4e79] text-white font-bold"><td className="p-1">Total</td><td className="p-1">{data.totals.grandTotal.toFixed(2)}</td></tr>
                      </table>
                   </div>
                </div>
                
                <div className="spacer flex-1"></div>
                
                <div className="flex justify-between items-end">
                   <div className="text-[6px] opacity-70">
                      <strong>BANK INFO</strong><br/>
                      {settings.bankName}<br/>
                      {settings.iban}
                   </div>
                   <div className="text-center">
                      <div className="h-6 w-24 border-b-2 border-black mx-auto mb-1" />
                      <p className="font-bold">Authorized Signature</p>
                   </div>
                </div>
              </div>
              <div className="bg-[#1f4e79] text-white p-2 text-center text-[8px] font-bold">
                THANK YOU FOR YOUR BUSINESS!
              </div>
            </div>
          </DesignCard>

          {/* Design 3: Minimal (Grid Box) */}
          <DesignCard 
            title="Grid Box" 
            description="Structured and Formal"
            isSelected={selectedTemplate === 'minimal'}
            onSelect={() => setSelectedTemplate('minimal')}
          >
            <div className="w-full bg-card text-[#222] p-6 text-[7px] space-y-4 shadow-sm border min-h-[500px] flex flex-col">
              <div className="flex justify-between items-start border-b-2 border-black pb-2">
                <div className="flex flex-col">
                  {settings.companyLogo && <img src={settings.companyLogo} className="max-h-8 mb-2" alt="Logo" />}
                  <h2 className="text-xl font-serif font-bold">INVOICE</h2>
                </div>
                <div className="text-right">
                  <p className="font-bold">{settings.companyName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 border border-black divide-x divide-black">
                <div className="p-3"><strong>FROM:</strong><br/>{settings.companyName}</div>
                <div className="p-3"><strong>INV INFO:</strong><br/>No: {data.invoiceNumber}</div>
              </div>
              <table className="w-full border border-black">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="p-1 text-left">Description</th>
                    <th className="p-1 text-center">{hsnLabel}</th>
                    <th className="p-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-black">
                      <td className="p-1">{item.description}</td>
                      <td className="p-1 text-center">SAC: {item.hsnSacCode || '-'}</td>
                      <td className="p-1 text-right">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-2 gap-4">
                 <div className="border border-black p-2">
                    <p className="font-bold border-b mb-1">TAX SUMMARY</p>
                    <p className="text-[5px]">Detailed breakdown included...</p>
                 </div>
                 <div className="border border-black p-2 text-right bg-black text-white font-bold">
                    TOTAL: {data.currency} {totals.grandTotal.toFixed(2)}
                 </div>
              </div>
              
              <div className="spacer flex-1"></div>
              
              <div className="flex justify-between items-end border-t border-black pt-4">
                 <div className="text-[6px]">
                    <strong>BANK:</strong> {settings.bankName}<br/>
                    <strong>IBAN:</strong> {settings.iban}
                 </div>
                 <div className="text-center">
                    <div className="h-6 w-24 border-b-2 border-black mx-auto mb-1" />
                    <p className="font-bold">Authorized Signature</p>
                 </div>
              </div>
            </div>
          </DesignCard>
        </div>
      </main>
    </div>
  )
}

function DesignCard({ title, description, children, isSelected, onSelect }: any) {
  return (
    <div 
      onClick={onSelect}
      className={`group relative flex flex-col rounded-3xl border-4 transition-all duration-300 ${isSelected ? 'border-primary ring-8 ring-primary/10 shadow-2xl scale-[1.02]' : 'border-background hover:border-primary/40 shadow-lg'}`}
    >
      <div className="p-4 flex items-center justify-between bg-card rounded-t-2xl border-b">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground'}`}>
          {isSelected ? <CheckIcon className="size-5" /> : <LayoutIcon className="size-5" />}
        </div>
      </div>
      
      <div className="flex-1 bg-muted/20 p-6 overflow-hidden flex justify-center">
        <div className="w-full origin-top transition-transform duration-500 group-hover:scale-[1.01]">
          {children}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute inset-0 border-4 border-primary rounded-3xl pointer-events-none animate-in fade-in zoom-in duration-300" />
      )}
    </div>
  )
}
