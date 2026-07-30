import React, { useState, useEffect, useCallback } from 'react';
import {  useParams  } from 'react-router-dom';
import { usersAPI } from '@/lib/api/users';
import { Select } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string | null;
  status: string;
}

interface UserSelectProps {
  businessId?: string;
  value: string;
  onChange: (userId: string) => void;
  label?: string;
  placeholder?: string;
}

export function UserSelect({ businessId: propBusinessId, value, onChange, placeholder = "Unassigned" }: UserSelectProps) {
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!businessId || businessId === 'undefined' || businessId === 'null') return;
    try {
      setLoading(true);
      setError(false);
      const data = await usersAPI.fetchBusinessUsers(businessId);
      setUsers(data || []);
    } catch (err) {
      console.error("UserSelect fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchUsers();
  }, [businessId]);

  if (loading) {
    return (
      <select disabled className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none animate-pulse">
        <option>Loading users...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="flex gap-2">
        <select disabled className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm outline-none text-red-500">
          <option>Unable to load users.</option>
        </select>
        <button type="button" onClick={fetchUsers} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold">Retry</button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex gap-2">
        <select disabled className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-500">
          <option>No active users found.</option>
        </select>
        <button type="button" onClick={() => window.location.href = `/dashboard/${businessId}/user-management`} className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-bold whitespace-nowrap">Invite Employee</button>
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm appearance-none"
      style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%236b7280" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
    >
      <option value="">{placeholder}</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          👤 {u.name || 'Unknown'} - {u.role || 'Member'} - {u.department || 'General'} ({u.email})
        </option>
      ))}
    </select>
  );
}
