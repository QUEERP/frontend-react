import StockForm from '@/components/dashboard/stock-form';
import { useParams } from "react-router-dom";

export const metadata = {
  title: 'Edit Stock - Dashboard',
  description: 'Edit stock details',
};

interface EditStockPageProps {
  params: Promise<{
    businessId: string;
    stockId: string;
  }>;
}

export default function EditStockPage() {
  const { stockId } = useParams();
  return <StockForm stockId={stockId} />;
}
