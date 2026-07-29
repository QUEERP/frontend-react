import BillForm from '@/components/dashboard/bill-form';

export const metadata = {
  title: 'New Bill - Dashboard',
  description: 'Create a new bill',
};

export default function AddBillPage() {
  return <BillForm />;
}
