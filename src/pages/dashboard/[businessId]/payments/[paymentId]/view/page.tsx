import React from 'react'
import { useParams } from 'react-router-dom'
import { PaymentDetailsPageClient } from '@/components/dashboard/payment-details-page-client'

export default function ViewPaymentPage() {
  const { businessId, paymentId } = useParams<{ businessId: string; paymentId: string }>()

  if (!businessId || !paymentId) return null

  return (
    <PaymentDetailsPageClient 
      businessId={businessId} 
      paymentId={paymentId} 
      isEditMode={false} 
    />
  )
}
