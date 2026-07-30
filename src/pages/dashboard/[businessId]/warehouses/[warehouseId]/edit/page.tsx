import WarehouseForm from '@/components/dashboard/warehouse-form';
import { useParams } from "react-router-dom";

export const metadata = {
  title: 'Edit Warehouse - Dashboard',
  description: 'Edit warehouse details',
};

interface EditWarehousePageProps {
  params: Promise<{
    businessId: string;
    warehouseId: string;
  }>;
}

export default function EditWarehousePage() {
  const { warehouseId } = useParams();
  return <WarehouseForm warehouseId={warehouseId} />;
}
