import WarehouseView from '@/components/dashboard/warehouse-view';
import { useParams } from "react-router-dom";

export const metadata = {
  title: 'View Warehouse - Dashboard',
  description: 'View warehouse details',
};

interface ViewWarehousePageProps {
  params: Promise<{
    businessId: string;
    warehouseId: string;
  }>;
}

export default function ViewWarehousePage() {
  const { warehouseId } = useParams();
  return <WarehouseView warehouseId={warehouseId} />;
}
