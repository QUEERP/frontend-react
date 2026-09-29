import React, { useEffect, useState } from 'react'
import {  useParams, useNavigate  } from 'react-router-dom';
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'
import { VendorForm } from '@/components/dashboard/vendor-form'

export default function EditVendorPage() {
  const params = useParams()
  const navigate = useNavigate()
  
  const { businessId, id } = useParams();
const vendorId = id as string

  const [vendorData, setVendorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002'

  useEffect(() => {
    const fetchVendor = async () => {
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return ''
        const match = document.cookie.match(
          new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
        )
        return match ? decodeURIComponent(match[1]) : ''
      }
      
      const token = getCookie('token') || getCookie('accessToken')
      if (!token) {
        navigate('/signin')
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/purchase/vendors/${encodeURIComponent(vendorId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-business-id': businessId as string,
          },
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch vendor details')
        }

        const vendor = data.data || data.vendor || {};
        
        setVendorData({
          name: vendor.name || '',
          vendorType: vendor.vendorType || '',
          country: vendor.country || '',
          contactPerson: vendor.contactPerson || '',
          email: vendor.email || '',
          countryCode: vendor.countryCode || '+971',
          phone: vendor.phone || '',
          taxRegistrationNumber: vendor.taxRegistrationNumber || vendor.vatNumber || vendor.taxNumber || '',
          paymentTerms: vendor.paymentTerms || 'Immediate',
          currency: vendor.currency || '',
          openingBalance: vendor.openingBalance !== undefined ? String(vendor.openingBalance) : '0',
          creditLimit: vendor.creditLimit !== null ? String(vendor.creditLimit) : '',
          preferredVendor: vendor.preferredVendor || false,
          status: vendor.status || 'ACTIVE',
          notes: vendor.notes || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (vendorId) {
      fetchVendor()
    }
  }, [vendorId, businessId, API_BASE, navigate])

  if (loading) {
    return (
      <div className="flex-1 w-full bg-[#f8fafc] flex items-center justify-center min-h-[50vh]">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 w-full bg-[#f8fafc] flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircleIcon className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-lg font-medium text-slate-800">{error}</p>
        <button 
          onClick={() => navigate(`/dashboard/${businessId}/vendors`)}
          className="text-blue-600 font-semibold hover:underline"
        >
          Return to Vendors
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full bg-[#f8fafc] px-4 sm:px-6 lg:px-8">
      <VendorForm 
        businessId={businessId as string} 
        vendorId={vendorId} 
        initialData={vendorData} 
        isEditing={true} 
      />
    </div>
  )
}
