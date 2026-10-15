import { getCookie } from '@/lib/utils'
import { API_ROOT } from '@/config/api'

function authHeaders(businessId: string) {
  const token = getCookie('token') || getCookie('accessToken')
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'x-business-id': businessId
  }
}

export interface SupplyTypeResolution {
  supplyType: 'CGST_SGST' | 'IGST' | 'EXPORT_LUT' | 'EXPORT_WITH_IGST' | 'SEZ_WITH_IGST' | 'SEZ_WITHOUT_IGST' | 'UNDETERMINED';
  isExport: boolean;
  isIntraState: boolean;
  isInterState: boolean;
  isSez: boolean;
  isUndetermined?: boolean;
  label: string;
  reason: string;
  applicableTaxes?: string[];
  warning?: string;
}

export const taxAPI = {
  async getSupplyType(businessId: string, params: {
    customerId?: string;
    buyerCountry?: string;
    buyerState?: string;
    shipToState?: string;
    isGoods?: boolean;
    isSez?: boolean;
    sezType?: string;
    exportType?: string;
    docDate?: string;
  }): Promise<SupplyTypeResolution> {
    const query = new URLSearchParams()
    if (params.customerId) query.set('customerId', params.customerId)
    if (params.buyerCountry) query.set('buyerCountry', params.buyerCountry)
    if (params.buyerState) query.set('buyerState', params.buyerState)
    if (params.shipToState) query.set('shipToState', params.shipToState)
    if (params.isGoods !== undefined) query.set('isGoods', String(params.isGoods))
    if (params.isSez !== undefined) query.set('isSez', String(params.isSez))
    if (params.sezType) query.set('sezType', params.sezType)
    if (params.exportType) query.set('exportType', params.exportType)
    if (params.docDate) query.set('docDate', params.docDate)

    const res = await fetch(`${API_ROOT}/tax/supply-type?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(businessId)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.message || `Failed to resolve supply type: ${res.status}`)
    return json.data
  },

  async getGstStates(): Promise<{ code: string; name: string }[]> {
    const res = await fetch(`${API_ROOT}/tax/gst-states`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getCookie('token') || getCookie('accessToken') || ''}`
      }
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.message || `Failed to fetch GST states: ${res.status}`)
    return json.data || []
  }
}
