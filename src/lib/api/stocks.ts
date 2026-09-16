import { API_ROOT } from "@/config/api";


export interface Stock {
  id: string;
  businessId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty: number;
  product?: { id: string; name: string; sku: string };
  warehouse?: { id: string; name: string; city?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockData {
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty?: number;
}

export interface Product {
  igstPercent?: number;
  sgstPercent?: number;
  cgstPercent?: number;
  taxPercent?: number;
  id: string;
  name: string;
  sku: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city?: string;
}

class StocksAPI {
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

  async createStock(
    businessId: string,
    data: CreateStockData
  ): Promise<{ success: boolean; stock: Stock }> {
    let created: { success: boolean; stock: Stock };

    try {
      created = await this.request<{ success: boolean; stock: Stock }>(`/stock`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, businessId);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const isDuplicate =
        message.includes('unique constraint') ||
        message.includes('already exists') ||
        message.includes('duplicate');

      if (!isDuplicate) {
        throw error;
      }

      const all = await this.getStock(businessId);
      const existing = all.stock.find(
        (s) => s.productId === data.productId && s.warehouseId === data.warehouseId
      );

      if (!existing) {
        throw error;
      }

      await this.updateStock(businessId, existing.id, {
        quantity: Number(data.quantity ?? 0),
        reservedQty: Number(data.reservedQty ?? 0),
      });

      return {
        success: true,
        stock: {
          ...existing,
          quantity: Number(data.quantity ?? 0),
          reservedQty: Number(data.reservedQty ?? 0),
        },
      };
    }

    // Backend create endpoint currently persists quantity only.
    // Apply reservedQty through update so the value is saved without backend changes.
    const reservedQty = Number(data.reservedQty ?? 0);
    if (created?.stock?.id && Number.isFinite(reservedQty)) {
      try {
        await this.request(`/stock/${created.stock.id}`, {
          method: 'PUT',
          body: JSON.stringify({ reservedQty }),
        }, businessId);

        return {
          ...created,
          stock: {
            ...created.stock,
            reservedQty,
          },
        };
      } catch {
        // Do not fail create when update permission/endpoint is unavailable.
        // Base stock row is already created successfully.
        return created;
      }
    }

    return created;
  }

  async getStock(businessId: string): Promise<{ success: boolean; stock: Stock[] }> {
    return this.request(`/stock`, {}, businessId);
  }

  async getStockById(
    businessId: string,
    stockId: string
  ): Promise<{ success: boolean; stock: Stock }> {
    try {
      return await this.request(`/stock/${stockId}`, {}, businessId);
    } catch {
      // Fallback for backends that expose only GET /stock
      const all = await this.getStock(businessId);
      const item = all.stock.find((s) => s.id === stockId);

      if (!item) {
        throw new Error('Stock not found');
      }

      return { success: true, stock: item };
    }
  }

  async updateStock(
    businessId: string,
    stockId: string,
    data: Partial<CreateStockData>
  ): Promise<{ success: boolean; stock: Stock }> {
    return this.request(`/stock/${stockId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, businessId);
  }

  async deleteStock(
    businessId: string,
    stockId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/stock/${stockId}`, {
      method: 'DELETE',
    }, businessId);
  }

  async getProducts(businessId: string): Promise<{ success: boolean; products: Product[] }> {
    return this.request(`/products`, {}, businessId);
  }

  async getWarehouses(businessId: string): Promise<{ success: boolean; warehouses: Warehouse[] }> {
    return this.request(`/warehouses`, {}, businessId);
  }
}

export const stocksAPI = new StocksAPI();
