import { getCookie } from '@/lib/utils';
import { API_ROOT } from '@/config/api';
import { Quotation, QuotationItem, QuotationItemInput } from './quotations';

export type Proposal = Quotation;
export type ProposalItem = QuotationItem;
export type ProposalItemInput = QuotationItemInput;

export interface CreateProposalData {
  title?: string;
  propName?: string;
  customerId?: string;
  customer?: any;
  dealId?: string;
  assignedToId?: string;
  currency?: string;
  exchangeRate?: number;
  items?: QuotationItemInput[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount?: number;
  finalPrice?: number;
  issueDate?: string;
  propDate?: string;
  expiryDate?: string;
  validUntil?: string;
  notes?: string;
  appNotes?: string;
  termLegal?: string;
  status?: string;
  [key: string]: any;
}

export interface UpdateProposalData {
  title?: string;
  propName?: string;
  customerId?: string;
  customer?: any;
  dealId?: string;
  assignedToId?: string;
  currency?: string;
  exchangeRate?: number;
  items?: QuotationItemInput[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount?: number;
  finalPrice?: number;
  issueDate?: string;
  propDate?: string;
  expiryDate?: string;
  validUntil?: string;
  notes?: string;
  appNotes?: string;
  termLegal?: string;
  status?: string;
  [key: string]: any;
}

export const proposalsAPI = {
  async getProposals(businessId: string, params?: { customerId?: string; status?: string }): Promise<{ success: boolean; proposals: Proposal[]; data: Proposal[] }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.status) searchParams.append('status', params.status);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const response = await fetch(`${API_ROOT}/proposals${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch proposals');
    }

    const result = await response.json();
    const list = result.proposals || result.data || [];
    return { ...result, proposals: list, data: list };
  },

  async getProposalById(businessId: string, proposalId: string): Promise<{ success: boolean; proposal: Proposal; quotation: Proposal; data: Proposal }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch proposal details');
    }

    const result = await response.json();
    const prop = result.proposal || result.data || result.quotation;
    return { ...result, proposal: prop, quotation: prop, data: prop };
  },

  async createProposal(businessId: string, data: CreateProposalData): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals`, {
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
      throw new Error(error.message || 'Failed to create proposal');
    }

    const result = await response.json();
    const prop = result.proposal || result.data;
    return { ...result, proposal: prop, data: prop };
  },

  async updateProposal(businessId: string, proposalId: string, data: UpdateProposalData): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message?: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}`, {
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
      throw new Error(error.message || 'Failed to update proposal');
    }

    const result = await response.json();
    const prop = result.proposal || result.data;
    return { ...result, proposal: prop, data: prop };
  },

  async approveProposal(businessId: string, proposalId: string): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to approve proposal');
    }

    const result = await response.json();
    const prop = result.proposal || result.data;
    return { ...result, proposal: prop, data: prop, message: result.message || 'Proposal approved successfully' };
  },

  async rejectProposal(businessId: string, proposalId: string): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reject proposal');
    }

    const result = await response.json();
    const prop = result.proposal || result.data;
    return { ...result, proposal: prop, data: prop, message: result.message || 'Proposal rejected successfully' };
  },

  async submitProposalApproval(businessId: string, proposalId: string): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}/submit-approval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to submit proposal for approval');
    }

    return response.json();
  },

  async sendProposal(businessId: string, proposalId: string, data?: any): Promise<{ success: boolean; proposal: Proposal; data: Proposal; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to send proposal');
    }

    return response.json();
  },

  async deleteProposal(businessId: string, proposalId: string): Promise<{ success: boolean; message: string }> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete proposal');
    }

    return response.json();
  },

  async downloadProposalPdf(businessId: string, proposalId: string, quoteNumber?: string): Promise<void> {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/proposals/${proposalId}/download-pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to download proposal PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposal_${quoteNumber || proposalId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

