import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Users, User, ShieldAlert } from 'lucide-react';

export interface TaskOwnerOption {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  isProjectAssigned?: boolean;
}

interface MultiTaskOwnerSelectProps {
  value: string[] | string;
  onChange: (selectedIds: string[]) => void;
  assignedMembers: TaskOwnerOption[];
  allUsers?: TaskOwnerOption[];
  label?: string;
  placeholder?: string;
  projectSelected?: boolean;
}

export function MultiTaskOwnerSelect({
  value,
  onChange,
  assignedMembers = [],
  allUsers = [],
  label = "Task Owner(s)",
  placeholder = "Select Task Owner(s)...",
  projectSelected = false,
}: MultiTaskOwnerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize selected IDs
  const selectedIds: string[] = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      try {
        if (value.startsWith('[') && value.endsWith(']')) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // not json
      }
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  // Combine and deduplicate options
  const combinedOptions = useMemo(() => {
    const map = new Map<string, TaskOwnerOption>();

    // First add assigned members marked as assigned
    assignedMembers.forEach((m) => {
      if (m && m.id) {
        map.set(m.id, { ...m, isProjectAssigned: true });
      }
    });

    // If project is not selected or no assigned members, fall back to all users
    allUsers.forEach((u) => {
      if (u && u.id && !map.has(u.id)) {
        map.set(u.id, {
          ...u,
          isProjectAssigned: assignedMembers.length === 0, // if no specific assignments, everyone is valid
        });
      }
    });

    return Array.from(map.values());
  }, [assignedMembers, allUsers]);

  // Filter based on search query
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return combinedOptions;
    return combinedOptions.filter((opt) => {
      const name = typeof opt.name === 'object' ? String((opt.name as any)?.name || '') : String(opt.name || '');
      const email = typeof opt.email === 'object' ? String((opt.email as any)?.email || '') : String(opt.email || '');
      const role = typeof opt.role === 'object' ? String((opt.role as any)?.name || '') : String(opt.role || '');
      const department = typeof opt.department === 'object' ? String((opt.department as any)?.name || '') : String(opt.department || '');

      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q) ||
        department.toLowerCase().includes(q)
      );
    });
  }, [combinedOptions, searchTerm]);

  // Split into assigned and other
  const assignedList = useMemo(
    () => filteredOptions.filter((opt) => opt.isProjectAssigned),
    [filteredOptions]
  );
  const otherList = useMemo(
    () => filteredOptions.filter((opt) => !opt.isProjectAssigned),
    [filteredOptions]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleUser = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeUser = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const selectAllAssigned = () => {
    const assignedIds = assignedList.map((a) => a.id);
    const newSet = new Set([...selectedIds, ...assignedIds]);
    onChange(Array.from(newSet));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Resolve objects of selected items for chip display
  const selectedObjects = useMemo(() => {
    return selectedIds.map((id) => {
      const match = combinedOptions.find((opt) => opt.id === id);
      return (
        match || {
          id,
          name: `User (${id.slice(0, 6)})`,
          role: 'Member',
          isProjectAssigned: true,
        }
      );
    });
  }, [selectedIds, combinedOptions]);

  return (
    <div className={`flex flex-col gap-1.5 relative ${isOpen ? 'z-40' : ''}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1 whitespace-nowrap min-h-[1.25rem]">
          <span>{label}</span>
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
              {selectedIds.length}
            </span>
          )}
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="relative">
        {/* Trigger Box */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`min-h-[44px] w-full p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-gray-100/60 dark:hover:bg-gray-800 ${
            isOpen ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900 bg-white dark:bg-gray-900' : ''
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedObjects.length === 0 ? (
              <span className="text-gray-400 text-sm px-1">{placeholder}</span>
            ) : (
              selectedObjects.map((u) => {
                const displayName = typeof u.name === 'object' ? (u.name as any)?.name : String(u.name || '');
                return (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-md text-xs font-medium animate-in fade-in"
                  >
                    <User className="w-3 h-3 text-blue-600" />
                    <span className="max-w-[130px] truncate">{displayName}</span>
                    <button
                      type="button"
                      onClick={(e) => removeUser(u.id, e)}
                      className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full text-blue-500 hover:text-blue-900 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mr-1 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            data-lenis-prevent="true"
            className="absolute top-full left-0 mt-1 w-full sm:w-[360px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
            style={{ maxHeight: '380px' }}
          >
            {/* Search Input & Action bar */}
            <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 space-y-2 flex-shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search project members by name or role..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {assignedList.length > 0 && (
                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-gray-500 font-semibold">
                    {assignedList.length} Project Team Member{assignedList.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={selectAllAssigned}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Select All Assigned
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div
              data-lenis-prevent="true"
              className="overflow-y-auto overscroll-contain p-1 divide-y divide-gray-100 dark:divide-gray-800/60 flex-1 min-h-0 scrollbar-thin"
              style={{ maxHeight: '240px' }}
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-medium">
                  {projectSelected
                    ? 'No assigned project team members match search'
                    : 'Please select a project first or search all team'}
                </div>
              ) : (
                <>
                  {/* Assigned Section */}
                  {assignedList.length > 0 && (
                    <div className="py-1">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span>Project Assigned Members</span>
                      </div>
                      {assignedList.map((u) => {
                        const isSelected = selectedIds.includes(u.id);
                        const displayName = typeof u.name === 'object' ? (u.name as any)?.name : String(u.name || '');
                        const displayRole = typeof u.role === 'object' ? (u.role as any)?.name : String(u.role || 'Team Member');
                        const displayDept = typeof u.department === 'object' ? (u.department as any)?.name : (u.department ? String(u.department) : '');
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{displayName}</div>
                                <div className="text-[11px] text-gray-400 truncate">
                                  {displayRole} {displayDept ? `• ${displayDept}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0">
                              Assigned
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Other members section (only if project has specific members but others exist) */}
                  {otherList.length > 0 && (
                    <div className="py-1">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Other Business Members
                      </div>
                      {otherList.map((u) => {
                        const isSelected = selectedIds.includes(u.id);
                        const displayName = typeof u.name === 'object' ? (u.name as any)?.name : String(u.name || '');
                        const displayRole = typeof u.role === 'object' ? (u.role as any)?.name : String(u.role || 'Member');
                        const displayDept = typeof u.department === 'object' ? (u.department as any)?.name : (u.department ? String(u.department) : '');
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{displayName}</div>
                                <div className="text-[11px] text-gray-400 truncate">
                                  {displayRole} {displayDept ? `• ${displayDept}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex items-center justify-between text-[11px] text-gray-500">
              <span>{selectedIds.length} Owner(s) Selected</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

