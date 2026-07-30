import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {  useNavigate, useLocation  } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
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
import { stocksAPI, CreateStockData, Product, Warehouse } from '@/lib/api/stocks';

interface StockFormProps {
  stockId?: string;
}


export default function StockForm({ stockId }: StockFormProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { toast } = useToast();
  const businessId = pathname.match(/\/dashboard\/([^/]+)/)?.[1] || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(!!stockId);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [formData, setFormData] = useState<CreateStockData>({
    productId: '',
    warehouseId: '',
    quantity: 0,
    reservedQty: 0,
  });

  useEffect(() => {
    fetchOptions();
    if (stockId) {
      fetchStock();
    } else {
      setIsLoadingStock(false);
    }
  }, [businessId, stockId]);

  const fetchOptions = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        stocksAPI.getProducts(businessId),
        stocksAPI.getWarehouses(businessId),
      ]);

      if (productsRes.success) {
        setProducts(productsRes.products || []);
      }
      if (warehousesRes.success) {
        setWarehouses(warehousesRes.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load products and warehouses.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const fetchStock = async () => {
    try {
      const response = await stocksAPI.getStockById(businessId, stockId!);
      if (response.success) {
        const stock = response.stock;
        setFormData({
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          quantity: stock.quantity,
          reservedQty: stock.reservedQty || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load stock details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.warehouseId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a product and warehouse.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (stockId) {
        await stocksAPI.updateStock(businessId, stockId, formData);
        toast({
          title: 'Success',
          description: 'Stock updated successfully.',
        });
      } else {
        await stocksAPI.createStock(businessId, formData);
        toast({
          title: 'Success',
          description: 'Stock created successfully.',
        });
      }

      navigate(`/dashboard/${businessId}/stock`);
    } catch (error) {
      console.error('Error saving stock:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save stock.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingStock || isLoadingOptions) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{stockId ? 'Edit Stock' : 'Add Stock'}</h1>
          <p className="text-muted-foreground mt-1">Manage product inventory in warehouses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product *</label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Warehouse *</label>
                <Select value={formData.warehouseId} onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantity *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Reserved Qty</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.reservedQty}
                    onChange={(e) => setFormData({ ...formData, reservedQty: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium">Available: {formData.quantity} units</p>
                <p className="text-muted-foreground">Total: {formData.quantity + (formData.reservedQty || 0)} units</p>
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
            {isLoading ? 'Saving...' : 'Save Stock'}
          </Button>
        </div>
      </form>
    </div>
  );
}
