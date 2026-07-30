import { useParams } from 'react-router-dom';
import ActivityForm from '@/components/dashboard/activity-form';

export const metadata = { title: 'Edit Activity - Dashboard', description: 'Edit activity' };

interface EditActivityPageProps { params: { activityId: string } }

export default function EditActivityPage() {
  const routerParams = useParams() as any;
  const { businessId, activityId } = routerParams;
 return <ActivityForm activityId={activityId} />; }
