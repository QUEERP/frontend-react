import { useParams } from 'react-router-dom';
import BillForm from '@/components/dashboard/bill-form';

export const metadata = {
  title: 'Edit Bill - Dashboard',
  description: 'Edit bill details',
};

interface EditBillPageProps {
  params: {
    billId: string;
  };
}

export default function EditBillPage() {
  const routerParams = useParams() as any;
  const { businessId, billId } = routerParams;

  return <BillForm billId={billId} />;
}
