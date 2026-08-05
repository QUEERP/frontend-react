import { useParams } from 'react-router-dom';
import React, { use } from 'react';
import { EditBasicProjectForm } from '@/components/dashboard/edit-basic-project-form';

export default function EditProjectPage() {
  const routerParams = useParams() as any;
  const { businessId, projectId } = routerParams;

  

  return (
    <EditBasicProjectForm businessId={businessId as string} projectId={projectId as string} />
  );
}
