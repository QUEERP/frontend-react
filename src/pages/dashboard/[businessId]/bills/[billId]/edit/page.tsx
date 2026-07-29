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
  return <BillForm billId={billId} />;
}
