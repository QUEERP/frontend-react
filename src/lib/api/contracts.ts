import { API_ROOT } from "@/config/api";


export interface Contract {
  id: string;
  businessId: string;
  customerId: string;
  typeId?: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  startDate: string;
  endDate?: string;
  isDeleted: boolean;
  isHidden: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  type?: {
    id: string;
    name: string;
  };
}

export interface ContractType {
  id: string;
  name: string;
  businessId: string;
  createdAt: string;
}

export interface CreateContractData {
  customerId: string;
  typeId?: string;
  title: string;
  description?: string;
  value: number;
  startDate: string;
  endDate?: string;
  isDeleted?: boolean;
  isHidden?: boolean;
}

export interface UpdateContractData extends Partial<CreateContractData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'TERMINATED';
}

class ContractsAPI {
  private getCookie = (name: string): string => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\^])/g, '\\$1') + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    businessId?: string
  ): Promise<T> {
    const token = this.getCookie('token') || this.getCookie('accessToken');
    
    const headers: Record<string, string> = {};
    
    headers['Content-Type'] = 'application/json';
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (businessId) {
      headers['x-business-id'] = businessId;
    }

    const url = `/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private toIsoDateTime(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // If already a full datetime string, keep it as-is.
    if (trimmed.includes('T')) {
      return trimmed;
    }

    // Convert date-only value (YYYY-MM-DD) to ISO datetime.
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  }

  // Contract CRUD operations
  async getContracts(businessId: string): Promise<{ success: boolean; contracts: Contract[] }> {
    return this.request('/contracts', { method: 'GET' }, businessId);
  }

  async createContract(businessId: string, data: CreateContractData): Promise<{ success: boolean; contract: Contract }> {
    const payload: CreateContractData = {
      ...data,
      value: Number(data.value || 0),
      startDate: this.toIsoDateTime(data.startDate) || data.startDate,
      endDate: this.toIsoDateTime(data.endDate),
      description: data.description?.trim() || undefined,
    };

    const created = await this.request<{ success: boolean; contract: Contract }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, businessId);

    // Frontend safeguard: if backend returns a contract without the selected customer,
    // immediately patch it through update endpoint.
    if (created?.contract?.id && payload.customerId && created.contract.customerId !== payload.customerId) {
      await this.updateContract(businessId, created.contract.id, {
        customerId: payload.customerId,
      });

      return {
        ...created,
        contract: {
          ...created.contract,
          customerId: payload.customerId,
        },
      };
    }

    return created;
  }

  async updateContract(businessId: string, contractId: string, data: UpdateContractData): Promise<{ success: boolean; message: string }> {
    const payload: UpdateContractData = {
      ...data,
      value: typeof data.value === 'number' ? Number(data.value) : data.value,
      description: typeof data.description === 'string' ? data.description.trim() : data.description,
      startDate: this.toIsoDateTime(data.startDate),
      endDate: this.toIsoDateTime(data.endDate),
    };

    return this.request(`/contracts/${contractId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, businessId);
  }

  async getContractById(businessId: string, contractId: string): Promise<{ success: boolean; contract: Contract }> {
    const all = await this.getContracts(businessId);
    const found = (all.contracts || []).find((item) => item.id === contractId);

    if (!found) {
      throw new Error('Contract not found');
    }

    return { success: true, contract: found };
  }

  async deleteContract(businessId: string, contractId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/contracts/${contractId}`, {
      method: 'DELETE',
    }, businessId);
  }

  // Contract Type operations
  async getContractTypes(businessId: string): Promise<{ success: boolean; types: ContractType[] }> {
    return this.request('/contract-types', { method: 'GET' }, businessId);
  }

  async createContractType(businessId: string, name: string): Promise<{ success: boolean; type: ContractType }> {
    return this.request('/contract-types', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }, businessId);
  }

  async deleteContractType(businessId: string, typeId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/contract-types/${typeId}`, {
      method: 'DELETE',
    }, businessId);
  }
}

export const contractsAPI = new ContractsAPI();
