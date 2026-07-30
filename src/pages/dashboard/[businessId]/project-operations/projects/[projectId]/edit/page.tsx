import { useParams } from 'react-router-dom';
import React, { use } from 'react';
import { EditConstructionProjectForm } from '@/components/dashboard/edit-construction-project-form';

export default function EditProjectPage() {
  const routerParams = useParams() as any;
  const { businessId, projectId } = routerParams;

  

  return (
    <EditConstructionProjectForm businessId={businessId as string} projectId={projectId as string} />
  );
}
