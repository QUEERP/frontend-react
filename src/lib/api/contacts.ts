import { API_ROOT } from "@/config/api";


export interface Contact {
  id: string;
  customerId: string;
  businessId: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  isActive: boolean;
  isPrimary?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  customerId: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  tags?: string[];
}

export interface Customer {
  id: string;
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  region?: 'INDIA' | 'UAE';
  country?: string;
  billingState?: string;
  state?: string;
  emirate?: string;
  vatNumber?: string;
  website?: string;
  group?: string;
  currency?: string;
  defaultLanguage?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  billingStreet?: string;
  billingCity?: string;
  billingZipCode?: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  accountType?: string;
  accountOwnerId?: string;
  parentAccountId?: string;
  tags?: string[];
  description?: string;
  crmStatus?: string;
}

export interface CreateCustomerData {
  company: string;
  region: 'INDIA' | 'UAE';
  vatNumber?: string;
  phone?: string;
  website?: string;
  group?: string;
  currency?: string;
  defaultLanguage?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingZipCode?: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  accountOwnerId?: string;
  accountType?: string;
  parentAccountId?: string;
  tags?: string[];
  description?: string;
  crmStatus?: string;
}

class ContactsAPI {
  private getCookie = (name: string): string => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    businessId?: string
  ): Promise<T> {
    let token = this.getCookie('token') || this.getCookie('accessToken');
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    }
    
    const headers: Record<string, string> = {};
    
    headers['Content-Type'] = 'application/json';
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (businessId) {
      headers['x-business-id'] = businessId;
    }
    
    // Add any additional headers from options, ensuring they are strings
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.keys(optionHeaders).forEach(key => {
        const value = optionHeaders[key];
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
    

    const response = await fetch(`${API_ROOT}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async createContact(
    businessId: string,
    data: CreateContactData
  ): Promise<{ success: boolean; contact: Contact }> {
    return this.request(`/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, businessId);
  }

  async getContacts(
    businessId: string,
    customerId?: string
  ): Promise<{ success: boolean; contacts: Contact[] }> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    
    const endpoint = `/contacts${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await this.request<any>(endpoint, {}, businessId);
    if (res && res.success && Array.isArray(res.data)) {
      res.contacts = res.data;
    }
    return res;
  }

  async updateContact(
    businessId: string,
    contactId: string,
    data: Partial<CreateContactData>
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, businessId);
  }

  async deleteContact(
    businessId: string,
    contactId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    }, businessId);
  }

  async getCustomers(businessId: string): Promise<{ success: boolean; customers: Customer[]; data?: Customer[] }> {
    const res = await this.request<any>(`/customers?limit=100`, {}, businessId);
    if (res && res.success && Array.isArray(res.data)) {
      res.customers = res.data;
    }
    return res;
  }

  async createCustomer(businessId: string, data: CreateCustomerData): Promise<{ success: boolean; customer: Customer }> {
    return this.request(`/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, businessId);
  }
}

export const contactsAPI = new ContactsAPI();
