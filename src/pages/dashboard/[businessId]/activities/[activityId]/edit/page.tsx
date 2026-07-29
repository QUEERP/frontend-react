import ActivityForm from '@/components/dashboard/activity-form';

export const metadata = { title: 'Edit Activity - Dashboard', description: 'Edit activity' };

interface EditActivityPageProps { params: { activityId: string } }

export default function EditActivityPage() { return <ActivityForm activityId={activityId} />; }
