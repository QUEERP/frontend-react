import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI } from '@/lib/api/users';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string | null;
  status: string;
  badge?: string;
}

export interface UserSelectProps {
  businessId?: string;
  value: string;
  onChange: (userId: string) => void;
  label?: string;
  placeholder?: string;
  allowedUserIds?: string[] | null;
  filterUsers?: (user: any) => boolean;
  customUsers?: any[];
  disabled?: boolean;
  emptyMessage?: string;
}

export function UserSelect({
  businessId: propBusinessId,
  value,
  onChange,
  placeholder = "Unassigned",
  allowedUserIds,
  filterUsers,
  customUsers,
  disabled = false,
  emptyMessage = "No active users found."
}: UserSelectProps) {
  const params = useParams();
  const businessId = (propBusinessId || params?.businessId) as string;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(!customUsers || customUsers.length === 0);
  const [error, setError] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    if (!businessId || businessId === 'undefined' || businessId === 'null') return;
    try {
      if (!customUsers || customUsers.length === 0) setLoading(true);
      setError(false);
      const data = await usersAPI.fetchBusinessUsers(businessId);
      setUsers(data || []);
    } catch (err) {
      console.error("UserSelect fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [businessId, customUsers]);

  useEffect(() => {
    fetchUsers();
  }, [businessId]);

  // Merge custom users with fetched business users
  const displayedUsers = useMemo(() => {
    const map = new Map<string, any>();

    // Custom users provided (e.g. from project or planning allocations)
    if (Array.isArray(customUsers)) {
      customUsers.forEach(u => {
        if (u && u.id) {
          map.set(String(u.id).toLowerCase().trim(), u);
        }
      });
    }

    // Fetched business users
    if (Array.isArray(users)) {
      users.forEach(u => {
        if (u && u.id) {
          const key = String(u.id).toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, u);
          } else {
            // Merge details if available
            const existing = map.get(key);
            map.set(key, { ...u, ...existing });
          }
        }
      });
    }

    let list = Array.from(map.values());

    // Apply allowedUserIds filter if specified
    if (allowedUserIds !== undefined && allowedUserIds !== null) {
      const allowedSet = new Set(allowedUserIds.map((id: string) => String(id).toLowerCase().trim()));
      list = list.filter((u: any) => allowedSet.has(String(u.id).toLowerCase().trim()));
    }

    // Apply custom filterUsers function if specified
    if (filterUsers) {
      list = list.filter(filterUsers);
    }

    return list;
  }, [users, customUsers, allowedUserIds, filterUsers]);

  // If component is disabled (e.g. project/planning not yet chosen)
  if (disabled) {
    return (
      <select
        disabled
        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none cursor-not-allowed opacity-75 text-gray-500 appearance-none"
      >
        <option value="">{placeholder || "Select Project & Planning first..."}</option>
      </select>
    );
  }

  // Loading state (only when no custom users were pre-provided)
  if (loading && (!customUsers || customUsers.length === 0)) {
    return (
      <select disabled className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none animate-pulse">
        <option>Loading users...</option>
      </select>
    );
  }

  // Error state
  if (error && displayedUsers.length === 0) {
    return (
      <div className="flex gap-2">
        <select disabled className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm outline-none text-red-500">
          <option>Unable to load users.</option>
        </select>
        <button type="button" onClick={fetchUsers} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold">Retry</button>
      </div>
    );
  }

  // Empty state when filter results in 0 matching users
  if (displayedUsers.length === 0) {
    return (
      <select
        disabled
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm outline-none text-amber-600 dark:text-amber-400 cursor-not-allowed appearance-none"
      >
        <option value="">{emptyMessage || "No employees assigned to selected planning / project"}</option>
      </select>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm appearance-none"
      style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" viewBox="0 0 24 24" stroke="%236b7280" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '1rem'
      }}
    >
      <option value="">{placeholder}</option>
      {displayedUsers.map((u: any) => {
        const userName = typeof u.name === 'object' && u.name !== null ? (u.name.name || 'Unknown') : (u.name || 'Unknown');
        const userRole = typeof u.role === 'object' && u.role !== null ? (u.role.name || 'Member') : (u.role || 'Member');
        const userDept = typeof u.department === 'object' && u.department !== null ? (u.department.name || 'General') : (u.department || 'General');
        const userEmail = typeof u.email === 'object' && u.email !== null ? (u.email.email || '') : (u.email || '');
        const badge = u.badge ? ` • ${u.badge}` : '';
        return (
          <option key={u.id} value={u.id}>
            👤 {userName} — {userRole} ({userDept}){badge} {userEmail ? `— ${userEmail}` : ''}
          </option>
        );
      })}
    </select>
  );
}
