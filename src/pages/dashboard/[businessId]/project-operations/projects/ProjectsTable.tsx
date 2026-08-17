import React from 'react';
import {  useNavigate  } from 'react-router-dom';
import { getCurrencySymbol } from '@/lib/currencies';
import { 
  Search, FileText, Plus, Loader2, ArrowRight, MoreHorizontal, Eye, Edit, Trash2, DollarSign, Receipt
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/project-operations/StatusBadge';
import { ProgressBar } from '@/components/project-operations/ProgressBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ProjectsTableProps {
  businessId: string;
  projects: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filteredProjects: any[];
}

export function ProjectsTable({ 
  businessId, 
  projects, 
  loading, 
  searchTerm, 
  setSearchTerm,
  filteredProjects 
}: ProjectsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-gray-950/30 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor all basic projects.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 focus:bg-white focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <Button 
            onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/create`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Project
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50">
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px] h-12">Project</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Customer</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Budget</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Spent</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Status</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Start Date</TableHead>
                <TableHead className="text-right font-bold text-gray-500 uppercase tracking-wider text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-sm font-medium">Loading projects...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">No projects found</p>
                      <p className="text-sm">Try adjusting your search or create a new project.</p>
                      <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-4">
                        Clear Search
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.map((proj) => (
                <TableRow 
                  key={proj.id} 
                  className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/${businessId}/project-operations/projects/${proj.id}/edit`)}
                >
                  {(() => {
                    const formatProjectCode = (code: any) => {
                      if (!code) return '';
                      const strCode = String(code);
                      const match = strCode.match(/^PRJ-0*(\d+)$/);
                      if (match) {
                        return 'PRJ-' + match[1].padStart(3, '0');
                      }
                      return strCode;
                    };
                    const c = proj.currency || 'CAD';
                    const formatCur = (val: number) => `${getCurrencySymbol(c)} ${new Intl.NumberFormat(c === 'CAD' ? 'en-CA' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val || 0))}`;
                    return (
                      <>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-blue-600 hover:underline">{formatProjectCode(proj.projectCode)}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{proj.projectName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {proj.customer?.name || proj.customer?.company || 'Internal'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{formatCur(proj.budget || 0)}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-semibold text-rose-500">{formatCur(proj.actualCost || 0)}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge status={proj.status} size="sm" />
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-gray-500 font-medium">
                            {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-end gap-2 transition-opacity">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-3 flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-white dark:bg-gray-900 font-medium"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/dashboard/${businessId}/payments/add?projectId=${proj.id}`); 
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                              Add Payment
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-3 flex items-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 bg-white dark:bg-gray-900 font-medium"
                              onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/expenses/add?projectId=${proj.id}`); }}
                            >
                              <Receipt className="h-4 w-4" />
                              Add Expense
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/project-operations/projects/${proj.id}`); }}>
                                  <Eye className="mr-2 h-4 w-4" /> View project
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${businessId}/project-operations/projects/${proj.id}/edit`); }}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit project
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
