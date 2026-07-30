import { useState, useEffect } from 'react';

export interface ComplianceTask {
  id: string;
  ruleId: string;
  modelName: string;
  recordId: string;
  status: string;
  rule: {
    fieldName: string;
    description: string;
    severity: string;
  };
}

export function useCompliance(businessId: string, modelName: string, recordId?: string) {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId || !modelName || !recordId) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/compliance/tasks?modelName=${modelName}&recordId=${recordId}`, {
          headers: {
            'x-business-id': businessId,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setTasks(data.data);
        }
      } catch (error) {
        console.error('Error fetching compliance tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [businessId, modelName, recordId]);

  return { tasks, loading };
}
