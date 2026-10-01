import React from 'react';
import { useParams } from 'react-router-dom';
import RequirementsWorkspace from '../RequirementsWorkspace';

export default function ViewRequirementPage() {
  const { businessId, id } = useParams();
  
  return <RequirementsWorkspace businessId={businessId} />;
}
