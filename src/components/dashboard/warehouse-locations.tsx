import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { warehousesAPI, WarehouseLocation } from '@/lib/api/warehouses';

interface WarehouseLocationsProps {
  businessId: string;
  warehouseId: string;
}

export function WarehouseLocations({ businessId, warehouseId }: WarehouseLocationsProps) {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [warehouseId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await warehousesAPI.getLocations(businessId, warehouseId);
      if (res.success) {
        setLocations(res.locations || res.data || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (loc?: WarehouseLocation) => {
    if (loc) {
      setEditingLocation(loc);
      setName(loc.name);
      setCode(loc.code);
    } else {
      setEditingLocation(null);
      setName('');
      setCode('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingLocation) {
        await warehousesAPI.updateLocation(businessId, editingLocation.id, { name, code });
        toast.success('Location updated successfully');
      } else {
        await warehousesAPI.createLocation(businessId, warehouseId, { name, code });
        toast.success('Location created successfully');
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (loc: WarehouseLocation) => {
    if (loc.isDefault) {
      toast.error('Cannot delete the default location');
      return;
    }
    if (!confirm(`Are you sure you want to delete location ${loc.code}?`)) return;

    try {
      await warehousesAPI.deleteLocation(businessId, loc.id);
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete location');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Warehouse Locations / Bins</CardTitle>
        <Button size="sm" onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6 text-muted-foreground">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
            No locations configured for this warehouse.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map(loc => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium uppercase">{loc.code}</TableCell>
                    <TableCell>{loc.name}</TableCell>
                    <TableCell>
                      {loc.isDefault && (
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-max">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(loc)}
                        disabled={loc.isDefault}
                        title={loc.isDefault ? "Default location cannot be edited directly" : "Edit"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(loc)}
                        disabled={loc.isDefault}
                        title={loc.isDefault ? "Default location cannot be deleted" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Location Code</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1-01"
                required
              />
              <p className="text-xs text-muted-foreground">Used for quick scanning/reference. Will be converted to uppercase.</p>
            </div>
            <div className="space-y-2">
              <Label>Location Name (Optional)</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aisle 1, Shelf 1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
