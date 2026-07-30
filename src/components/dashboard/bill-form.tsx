import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ReceiptIcon, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Product, productsAPI } from '@/lib/api/inventory';
import { Warehouse, warehousesAPI } from '@/lib/api/warehouses';

interface BillFormProps {
  billId?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface BillItemInput {
  productId?: string;
  warehouseId?: string;
  name: string;
  quantity: number;
  price: number;
}

export default function BillForm({ billId }: BillFormProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBill, setIsLoadingBill] = useState(!!billId);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [formData, setFormData] = useState({
    vendorId: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    tax: 0,
    discount: 0,
    notes: '',
    items: [{ productId: '', warehouseId: '', name: '', quantity: 1, price: 0 }] as BillItemInput[],
  });

  const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

  const getCookie = useCallback((name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\\^$|?*+()[\]{}.])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const [vendorsRes, productsRes, warehousesRes] = await Promise.all([
        fetch(`${API_ROOT}/vendors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-business-id': businessId,
          },
        }),
        productsAPI.getAll(businessId),
        warehousesAPI.getAll(businessId),
      ]);

      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        const list = Array.isArray(data?.vendors)
          ? data.vendors
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setVendors(list);
      }

      if (productsRes.success) {
        setProducts(productsRes.products || (productsRes as any).data || []);
      }

      if (warehousesRes.success) {
        setWarehouses(warehousesRes.warehouses || (warehousesRes as any).data || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [API_ROOT, businessId, getCookie]);

  useEffect(() => {
    fetchOptions();
    if (billId) {
      fetchBill();
    }
  }, []);

  const fetchBill = async () => {
    try {
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) return;

      const response = await fetch(`${API_ROOT}/bills/${billId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bill');

      const data = await response.json();
      if (data.success && data.bill) {
        const bill = data.bill;
        setFormData({
          vendorId: bill.vendorId || '',
          billDate: bill.billDate ? bill.billDate.split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: bill.dueDate ? bill.dueDate.split('T')[0] : '',
          tax: Number(bill.tax || 0),
          discount: Number(bill.discount || 0),
          notes: bill.notes || '',
          items: Array.isArray(bill.items) && bill.items.length > 0
            ? bill.items.map((item: any) => ({
                name: String(item.name || ''),
                quantity: Number(item.quantity || 0),
                price: Number(item.price || 0),
              }))
            : [{ name: '', quantity: 1, price: 0 }],
        });
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bill details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBill(false);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', warehouseId: '', name: '', quantity: 1, price: 0 }],
    }));
  };

  const updateItem = (index: number, field: keyof BillItemInput, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: ['productId', 'warehouseId', 'name'].includes(field as string) ? String(value) : Number(value),
            }
          : item,
      ),
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanItems = formData.items
      .map((item) => ({
        productId: item.productId || undefined,
        warehouseId: item.warehouseId || undefined,
        name: item.name.trim(),
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
      }))
      .filter((item) => item.name && item.quantity > 0);

    if (!formData.billDate || !formData.vendorId || cleanItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Vendor, bill date, and at least one valid item are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = getCookie('token') || getCookie('accessToken');
      if (!token) throw new Error('Not authenticated');

      const endpoint = billId ? `${API_ROOT}/bills/${billId}` : `${API_ROOT}/bills`;
      const method = billId ? 'PUT' : 'POST';

      const payload = {
        vendorId: formData.vendorId,
        billDate: formData.billDate,
        dueDate: formData.dueDate || undefined,
        items: cleanItems,
        tax: Number(formData.tax),
        discount: Number(formData.discount),
        notes: formData.notes?.trim() || undefined,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': businessId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save bill');
      }

      toast({
        title: 'Success',
        description: `Bill ${billId ? 'updated' : 'created'} successfully.`,
      });

      navigate(`/dashboard/${businessId}/bills`);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save bill.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingBill || isLoadingOptions) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subtotal = formData.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );
  const total = subtotal + Number(formData.tax) - Number(formData.discount);

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/20">
            <ReceiptIcon className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{billId ? 'Edit Bill' : 'Create New Bill'}</h1>
            <p className="text-sm text-muted-foreground font-medium">Manage vendor bills and track payments</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6 bg-muted/30 border-b">
              <CardTitle>Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Vendor *</label>
                <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Bill Date *</label>
                  <Input
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Bill Items *</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden md:grid gap-3 px-3 text-sm font-medium text-muted-foreground md:grid-cols-[1.5fr_1.5fr_2fr_1fr_1fr_auto]">
                <div>Product</div>
                <div>Warehouse</div>
                <div>Description</div>
                <div>Qty</div>
                <div>Rate</div>
                <div className="w-9"></div>
              </div>
              {formData.items.map((item, index) => {
                const handleProductSelect = (productId: string) => {
                  const product = products.find(p => p.id === productId)
                  if (!product) {
                    updateItem(index, 'productId', '')
                    return
                  }
                  setFormData((prev) => ({
                    ...prev,
                    items: prev.items.map((it, i) =>
                      i === index
                        ? {
                            ...it,
                            productId,
                            name: product.description || product.name,
                            price: product.costPrice || 0, // Purchase rate
                          }
                        : it
                    ),
                  }))
                }

                return (
                <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1.5fr_1.5fr_2fr_1fr_1fr_auto] md:border-0 md:p-0">
                  <div className="space-y-1">
                    <label className="text-[10px] md:hidden">Product</label>
                    <Select
                      value={item.productId || ''}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Select a product...</SelectItem>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] md:hidden">Warehouse</label>
                    <Select
                      value={item.warehouseId || ''}
                      onValueChange={(val) => updateItem(index, 'warehouseId', val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] md:hidden">Description</label>
                    <Input
                      value={item.name}
                      placeholder="Item name"
                      className="h-9"
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] md:hidden">Qty</label>
                    <Input
                      type="number"
                      min="1"
                      className="h-9"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value || 1)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] md:hidden">Rate</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value || 0)}
                    />
                  </div>
                  
                  <div className="flex items-end pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )})}
            </CardContent>
          </Card>

          {/* Amount Information */}
          <Card>
            <CardHeader>
              <CardTitle>Amount Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subtotal</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={subtotal}
                  disabled
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tax</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Discount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded border-2 border-blue-200">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Bill'}
          </Button>
        </div>
      </form>
    </div>
  );
}
