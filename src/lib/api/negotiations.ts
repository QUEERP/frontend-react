import { getCookie } from '@/lib/utils';
import { API_ROOT } from '@/config/api';

export interface NegotiationCustomer {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface Negotiation {
  id: string;
  negNumber?: string;
  name: string;
  dealName?: string;
  customer?: NegotiationCustomer | null;
  customerId?: string;
  stage: string;
  status?: string;
  priority?: string;
  amount: number;
  origAmount?: number;
  negAmount?: number;
  discountPct?: number;
  taxPct?: number;
  finalAmount?: number;
  margin?: number;
  profitPct?: number;
  currency?: string;
  expectedCloseDate?: string | null;
  linkedProposal?: string | null;
  salesOwner?: string | null;
  assignedToId?: string | null;
  probability?: number;
  advancePct?: number;
  retentionPct?: number;
  paymentTerms?: string;
  addedScope?: string;
  removedScope?: string;
  modifiedScope?: string;
  finalTimeline?: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export const negotiationsAPI = {
  async getNegotiations(businessId: string, params?: { stage?: string; customerId?: string; search?: string }): Promise<{ success: boolean; negotiations: Negotiation[]; data: Negotiation[] }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const searchParams = new URLSearchParams();
    if (params?.stage) searchParams.append('stage', params.stage);
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const response = await fetch(`${API_ROOT}/negotiations${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch negotiations');
    }

    const result = await response.json();
    const list = result.negotiations || result.data || [];
    return { ...result, negotiations: list, data: list };
  },

  async getNegotiationById(businessId: string, negotiationId: string): Promise<{ success: boolean; negotiation: Negotiation; data: Negotiation }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/negotiations/${negotiationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch negotiation details');
    }

    const result = await response.json();
    const neg = result.negotiation || result.data;
    return { ...result, negotiation: neg, data: neg };
  },

  async createNegotiation(businessId: string, data: any): Promise<{ success: boolean; negotiation: Negotiation; data: Negotiation; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/negotiations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create negotiation');
    }

    const result = await response.json();
    const neg = result.negotiation || result.data;
    return { ...result, negotiation: neg, data: neg };
  },

  async updateNegotiation(businessId: string, negotiationId: string, data: any): Promise<{ success: boolean; negotiation: Negotiation; data: Negotiation; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/negotiations/${negotiationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update negotiation');
    }

    const result = await response.json();
    const neg = result.negotiation || result.data;
    return { ...result, negotiation: neg, data: neg };
  },

  async deleteNegotiation(businessId: string, negotiationId: string): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/negotiations/${negotiationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete negotiation');
    }

    return response.json();
  },
};

