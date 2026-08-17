import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon, PencilIcon, XIcon, SaveIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentItem } from './payments-page-client'

interface PaymentDetailsModalProps {
  payment: PaymentItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  businessId: string
  API_BASE: string
}

export function PaymentDetailsModal({ payment, isOpen, onClose, onSuccess, businessId, API_BASE }: PaymentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (payment && isOpen) {
      setAmount(String(payment.amount || ''))
      setPaymentDate(payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '')
      setPaymentMode(payment.paymentMode || 'CASH')
      setTransactionId(payment.transactionId || '')
      setNote(payment.note || '')
      setIsEditing(false)
    }
  }, [payment, isOpen])

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const handleSave = async () => {
    if (!payment) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (numAmount < payment.amountAllocated) {
      toast.error(`Amount cannot be less than the currently allocated amount (${payment.amountAllocated})`)
      return
    }

    try {
      setIsSaving(true)
      const token = getCookie('token') || getCookie('accessToken')
      
      const payload = {
        amount: numAmount,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        paymentMode,
        transactionId: transactionId || null,
        note: note || null,
      }

      const res = await fetch(`${API_BASE}/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update payment')
      }

      toast.success('Payment updated successfully')
      setIsEditing(false)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  if (!payment) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{isEditing ? 'Edit Payment' : 'Payment Details'}</DialogTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <PencilIcon className="size-3.5" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription>
            Reference: {payment.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-semibold">
              Amount <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!isEditing}
                className="col-span-3"
              />
              {isEditing && payment.amountAllocated > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min amount allowed: {payment.amountAllocated} (Currently allocated)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right font-semibold">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={!isEditing}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mode" className="text-right font-semibold">
              Mode <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Select value={paymentMode} onValueChange={setPaymentMode} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transactionId" className="text-right font-semibold">
              Txn ID
            </Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={!isEditing}
              className="col-span-3"
              placeholder="e.g., TXN123456789"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="note" className="text-right font-semibold mt-2">
              Note
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!isEditing}
              className="col-span-3 min-h-[80px]"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {isEditing && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2Icon className="size-4 animate-spin mr-2" /> : <SaveIcon className="size-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
