import React from 'react'
import { useParams } from 'react-router-dom'
import { VendorEmailPageClient } from '@/components/dashboard/vendor-email-page-client'

export default function VendorEmailPage() {
  const params = useParams() as any
  const businessId = params.businessId as string
  const vendorId = (params.id || params.vendorId) as string

  return <VendorEmailPageClient businessId={businessId} vendorId={vendorId} />
}

