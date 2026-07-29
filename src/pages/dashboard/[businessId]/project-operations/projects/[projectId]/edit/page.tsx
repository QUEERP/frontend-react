import React, { use } from 'react';
import { EditConstructionProjectForm } from '@/components/dashboard/edit-construction-project-form';

export default function EditProjectPage() {
  const { businessId, projectId } = useParams();

  return (
    <EditConstructionProjectForm businessId={businessId} projectId={projectId} />
  );
}
