import { API_ROOT } from "@/config/api";


export interface Warehouse {
  id: string;
  businessId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  locations?: { id?: string; name?: string; code: string; isDefault?: boolean }[];
}

class WarehousesAPI {
  private getCookie = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  };

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

  async createWarehouse(
    businessId: string,
    data: CreateWarehouseData
  ): Promise<{ success: boolean; warehouse: Warehouse }> {
    return this.request(`/warehouses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, businessId);
  }

  async getWarehouses(businessId: string): Promise<{ success: boolean; warehouses: Warehouse[] }> {
    return this.request(`/warehouses`, {}, businessId);
  }

  async getAll(businessId: string): Promise<{ success: boolean; warehouses: Warehouse[] }> {
    return this.getWarehouses(businessId);
  }

  async getWarehouse(
    businessId: string,
    warehouseId: string
  ): Promise<{ success: boolean; warehouse: Warehouse }> {
    try {
      return await this.request(`/warehouses/${warehouseId}`, {}, businessId);
    } catch {
      // Fallback for backends that provide only GET /warehouses
      const all = await this.getWarehouses(businessId);
      const item = all.warehouses.find((w) => w.id === warehouseId);

      if (!item) {
        throw new Error('Warehouse not found');
      }

      return { success: true, warehouse: item };
    }
  }

  async updateWarehouse(
    businessId: string,
    warehouseId: string,
    data: Partial<CreateWarehouseData>
  ): Promise<{ success: boolean; warehouse: Warehouse }> {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, businessId);
  }

  async deleteWarehouse(
    businessId: string,
    warehouseId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/warehouses/${warehouseId}`, {
      method: 'DELETE',
    }, businessId);
  }

  // Locations
  async getLocations(
    businessId: string,
    warehouseId: string
  ): Promise<{ success: boolean; locations: WarehouseLocation[]; data?: WarehouseLocation[] }> {
    return this.request(`/warehouses/${warehouseId}/locations`, {}, businessId);
  }

  async createLocation(
    businessId: string,
    warehouseId: string,
    data: { name: string; code: string; isDefault?: boolean }
  ): Promise<{ success: boolean; data: WarehouseLocation }> {
    return this.request(`/warehouses/${warehouseId}/locations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, businessId);
  }

  async updateLocation(
    businessId: string,
    locationId: string,
    data: { name?: string; code?: string; isDefault?: boolean }
  ): Promise<{ success: boolean; data: WarehouseLocation }> {
    return this.request(`/warehouses/locations/${locationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, businessId);
  }

  async deleteLocation(
    businessId: string,
    locationId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/warehouses/locations/${locationId}`, {
      method: 'DELETE',
    }, businessId);
  }
}

export const warehousesAPI = new WarehousesAPI();
