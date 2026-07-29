import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '@/lib/api/users';
import { contactsAPI } from '@/lib/api/contacts';

export function useBusinessUsers(businessId: string | undefined) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!businessId || businessId === 'undefined' || businessId === 'null') return;
    try {
      setLoading(true);
      setError(false);
      const data = await usersAPI.fetchBusinessUsers(businessId);
      setUsers(data || []);
    } catch (err) {
      console.error("useBusinessUsers fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchUsers();
  }, [businessId]);

  return { users, loading, error, retry: fetchUsers };
}

export function useBusinessCustomers(businessId: string | undefined) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!businessId || businessId === 'undefined' || businessId === 'null') return;
    try {
      setLoading(true);
      setError(false);
      const res = await contactsAPI.getCustomers(businessId);
      setCustomers(res.data || res.customers || []);
    } catch (err) {
      console.error("useBusinessCustomers fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCustomers();
  }, [businessId]);

  return { customers, loading, error, retry: fetchCustomers };
}
