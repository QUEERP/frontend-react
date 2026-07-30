import React, { useState, useEffect } from 'react'
import {  useNavigate  } from 'react-router-dom';
import { contractsAPI, Contract, ContractType } from '@/lib/api/contracts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Loader2,
  Settings,
  FileSignatureIcon,
  BriefcaseBusinessIcon,
  SearchIcon,
  ShieldCheckIcon
} from 'lucide-react'
import { toast } from 'sonner'

interface ContractsPageClientProps {
  businessId: string;
}

export function ContractsPageClient({ businessId }: ContractsPageClientProps) {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [loading, setLoading] = useState(true)
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<string | null>(null)
  const [newTypeName, setNewTypeName] = useState('')

  // Fetch data
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await contractsAPI.getContracts(businessId)
      if (response.success) {
        setContracts(response.contracts)
      }
    } catch (error) {
      toast.error('Failed to fetch contracts')
    } finally {
      setLoading(false)
    }
  }

  const fetchContractTypes = async () => {
    try {
      const response = await contractsAPI.getContractTypes(businessId)
      if (response.success) {
        setContractTypes(response.types)
      }
    } catch (error) {
      console.error('Failed to fetch contract types:', error)
    }
  }

  useEffect(() => {
    fetchContracts()
    fetchContractTypes()
  }, [businessId])

  // Form handlers
  const handleEdit = (contract: Contract) => {
    navigate(`/dashboard/${businessId}/contracts/${contract.id}/edit`)
  }

  const handleDelete = async (contractId: string) => {
    setContractToDelete(contractId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!contractToDelete) return
    
    try {
      const response = await contractsAPI.deleteContract(businessId, contractToDelete)
      if (response.success) {
        toast.success('Contract deleted successfully')
        fetchContracts()
      }
    } catch (error) {
      toast.error('Failed to delete contract')
    } finally {
      setDeleteDialogOpen(false)
      setContractToDelete(null)
    }
  }

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name is required')
      return
    }

    try {
      const response = await contractsAPI.createContractType(businessId, newTypeName.trim())
      if (response.success) {
        toast.success('Contract type created successfully')
        setNewTypeName('')
        setIsTypeFormOpen(false)
        fetchContractTypes()
      }
    } catch (error) {
      toast.error('Failed to create contract type')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
      case 'INACTIVE': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
      case 'TERMINATED': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
      default: return 'bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-8 bg-muted/50 dark:bg-slate-950/50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <FileSignatureIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Contract Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create, track, and manage all your business agreements securely.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsTypeFormOpen(true)} className="rounded-xl h-10 border-border dark:border-slate-800 bg-card dark:bg-slate-950 hover:bg-muted dark:hover:bg-slate-900 gap-2 shadow-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Manage Types
          </Button>
          <Button onClick={() => navigate(`/dashboard/${businessId}/contracts/add`)} className="rounded-xl h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm transition-all hover:shadow-md gap-2">
            <Plus className="h-4 w-4" />
            Create Contract
          </Button>
        </div>
      </div>

      {/* Contracts List */}
      <Card className="rounded-2xl border border-border dark:border-slate-800 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/50 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BriefcaseBusinessIcon className="h-5 w-5 text-blue-500" />
            Active Agreements
            <Badge variant="secondary" className="rounded-full px-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ml-2">{contracts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          {contracts.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-slate-800 mb-2">
                <FileSignatureIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-foreground dark:text-slate-100">No contracts found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create your first contract to manage business agreements efficiently.
              </p>
              <Button onClick={() => navigate(`/dashboard/${businessId}/contracts/add`)} className="rounded-xl mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Create First Contract
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800">
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Title / Details</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Client</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Agreement Type</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Value</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Timeline</TableHead>
                    <TableHead className="w-[80px] px-6 py-4 text-right font-semibold text-muted-foreground dark:text-slate-400 uppercase text-xs tracking-wider">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{contract.title}</span>
                          {contract.description && (
                            <span className="text-xs text-muted-foreground dark:text-slate-400 line-clamp-1 max-w-[200px]">
                              {contract.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted dark:bg-slate-800 text-muted-foreground shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium text-foreground dark:text-slate-300 line-clamp-1">{contract.customer?.company || contract.customer?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {contract.type ? (
                          <Badge variant="outline" className="font-medium bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            {contract.type.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 dark:text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(contract.value, contract.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={`font-semibold border px-2.5 py-0.5 ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            {new Date(contract.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          {contract.endDate && (
                            <div className="flex items-center gap-1.5 opacity-80">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(contract.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-muted dark:hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleEdit(contract)} className="cursor-pointer rounded-lg text-xs font-medium">
                              <Edit className="mr-2 h-4 w-4 text-blue-500" />
                              Edit Contract
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(contract.id)}
                              className="cursor-pointer rounded-lg text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Contract
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Type Dialog */}
      <Dialog open={isTypeFormOpen} onOpenChange={setIsTypeFormOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="p-6 bg-muted dark:bg-slate-900 border-b border-border dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" /> Manage Agreement Types
              </DialogTitle>
              <DialogDescription className="mt-1">
                Create new contract classifications for better organization.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="typeName" className="text-xs font-semibold uppercase text-muted-foreground">Type Name</Label>
              <Input
                id="typeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Non-Disclosure Agreement (NDA)"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateType()}
                className="rounded-xl h-10 transition-all focus:ring-2 focus:ring-blue-500/20 bg-card dark:bg-slate-950 border-border dark:border-slate-800"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Existing Types</Label>
              <div className="flex flex-wrap gap-2">
                {contractTypes.length === 0 ? (
                  <div className="w-full flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground">No contract types created yet.</p>
                  </div>
                ) : (
                  contractTypes.map((type) => (
                    <Badge key={type.id} variant="secondary" className="px-2.5 py-1 text-sm bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                      {type.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted dark:bg-slate-900 border-t border-border dark:border-slate-800 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsTypeFormOpen(false)} className="rounded-xl h-10 border-border dark:border-slate-800 bg-card dark:bg-slate-950">
              Close
            </Button>
            <Button type="button" onClick={handleCreateType} disabled={!newTypeName.trim()} className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Create Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-900/30">
            <DialogHeader>
              <DialogTitle className="text-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" /> Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-rose-600/80 dark:text-rose-400/80 mt-1">
                Are you sure you want to permanently delete this contract? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <DialogFooter className="p-6 bg-muted dark:bg-slate-900 border-t border-border dark:border-slate-800 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl h-10 border-border dark:border-slate-800 bg-card dark:bg-slate-950">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} className="rounded-xl h-10 bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm">
              <Trash2 className="h-4 w-4" />
              Delete Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
