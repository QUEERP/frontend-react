import * as React from 'react'
import { Building2Icon, LayoutDashboardIcon, Plus, UsersIcon, UserIcon, SettingsIcon, FileTextIcon, UserCheckIcon, WalletIcon, CalendarDaysIcon, ChevronDownIcon, CreditCardIcon, ClockIcon, HandCoinsIcon, StoreIcon, ReceiptIcon, ActivityIcon, PackageIcon, Megaphone, CheckSquare, Mail, Phone, BarChart3, Undo2, RefreshCw, ShoppingCart, Truck, ClipboardList, PackageCheck, Tag, Layers, Ruler, AlertTriangle, ScanLine, ArrowLeftRight, History, SlidersHorizontal, QrCode, Archive, TrendingUpIcon, FileSignature, MessageSquare, StickyNote, MailSearch, PieChart, Calculator, Briefcase, Map as MapIcon, Flag, DollarSign, ShieldAlert, HeadphonesIcon } from 'lucide-react'
import {  useLocation, useNavigate, useSearchParams  } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusinessData } from '@/components/dashboard/business-data-provider'

type ModuleItem = {
  id: string
  name: string
  actions: string[]
}

const MENU_CONFIG: Record<string, any> = {
  Basic: {
    hiddenModules: ["Inventory", "HR", "Statutory Reports"],
    moduleVisibility: {
      Sales: {
        "CRM & Customers": ["Customers"],
        "Sales Operations": ["Quotations", "Sales Orders", "Invoices", "Payments", "Credit Notes", "Returns", "Recurring Invoices", "Sales Report"],
      },
      Procurement: {
        allowedItems: ["Vendors", "Vendor"]
      },
      "Accounting & Finance": {
        allowedItems: ["Expenses"]
      }
    }
  }
};

function isMenuVisible(businessType: string | undefined | null, moduleName: string, sectionName?: string, subItemName?: string) {
  if (!businessType || businessType === 'unknown') return true;
  
  const normalizedType = Object.keys(MENU_CONFIG).find(
    k => k.toLowerCase() === businessType.toLowerCase()
  );
  if (!normalizedType) return true;

  const config = MENU_CONFIG[normalizedType];

  if (!sectionName && !subItemName) {
     return !(config.hiddenModules?.includes(moduleName));
  }

  const moduleConfig = config.moduleVisibility?.[moduleName];
  if (!moduleConfig) return true;

  if (sectionName && !subItemName && moduleConfig.allowedItems) {
    return moduleConfig.allowedItems.some((allowed: string) => allowed.toLowerCase() === sectionName.toLowerCase());
  }

  if (sectionName && !subItemName) {
    return Object.keys(moduleConfig).includes(sectionName);
  }

  if (sectionName && subItemName) {
    let isVisible = false;
    if (moduleConfig[sectionName]) {
      isVisible = moduleConfig[sectionName].some((allowed: string) => allowed.toLowerCase() === subItemName.toLowerCase());
    }
    if (!isVisible && moduleConfig.allowedItems) {
      isVisible = moduleConfig.allowedItems.some((allowed: string) => 
        allowed.toLowerCase() === subItemName.toLowerCase() || 
        allowed.toLowerCase() === sectionName.toLowerCase()
      );
    }
    return isVisible;
  }

  return true;
}

export function AppSidebar() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [businessName, setBusinessName] = React.useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = React.useState('')
  const [isLoadingBusinesses, setIsLoadingBusinesses] = React.useState(true)
  const [userBusinesses, setUserBusinesses] = React.useState<Array<{ id: string; name: string; type: 'owned' | 'member'; logoUrl?: string }>>([])
  const [modules, setModules] = React.useState<ModuleItem[]>([])
  const hasShownBusinessError = React.useRef(false)
  const hasShownModuleError = React.useRef(false)
  const [isEmployeeSession, setIsEmployeeSession] = React.useState(false)
  const [isSalesOpen, setIsSalesOpen] = React.useState(false)
  const [isSalesCrmOpen, setIsSalesCrmOpen] = React.useState(false)
  const [isSalesOpsOpen, setIsSalesOpsOpen] = React.useState(false)
  const [isSalesActivitiesOpen, setIsSalesActivitiesOpen] = React.useState(false)
  const [isSalesMarketingOpen, setIsSalesMarketingOpen] = React.useState(false)
  const [isSalesAnalyticsOpen, setIsSalesAnalyticsOpen] = React.useState(false)

  const [isProcurementOpen, setIsProcurementOpen] = React.useState(false)
  const [isProcurementVendorsOpen, setIsProcurementVendorsOpen] = React.useState(false)
  const [isProcurementPurchasingOpen, setIsProcurementPurchasingOpen] = React.useState(false)
  const [isProcurementAnalyticsOpen, setIsProcurementAnalyticsOpen] = React.useState(false)

  const [isInventoryOpen, setIsInventoryOpen] = React.useState(false)
  const [isInventoryProductOpen, setIsInventoryProductOpen] = React.useState(false)
  const [isInventoryWarehouseOpen, setIsInventoryWarehouseOpen] = React.useState(false)
  const [isInventoryTrackingOpen, setIsInventoryTrackingOpen] = React.useState(false)
  const [isInventoryMonitoringOpen, setIsInventoryMonitoringOpen] = React.useState(false)
  const [isInventoryAnalyticsOpen, setIsInventoryAnalyticsOpen] = React.useState(false)
  const [isHrOpen, setIsHrOpen] = React.useState(false)
  const [isHrEmployeesOpen, setIsHrEmployeesOpen] = React.useState(false)
  const [isHrWorkforceOpen, setIsHrWorkforceOpen] = React.useState(false)
  const [isHrRequestsOpen, setIsHrRequestsOpen] = React.useState(false)
  const [isHrAnalyticsOpen, setIsHrAnalyticsOpen] = React.useState(false)
  const [isProjectManagementOpen, setIsProjectManagementOpen] = React.useState(false)
  const [isInventoryDashboardOpen, setIsInventoryDashboardOpen] = React.useState(false)

  // Project Operations States
  const [isProjectOpsOpen, setIsProjectOpsOpen] = React.useState(false)
  const [isProjectOpsPreSalesOpen, setIsProjectOpsPreSalesOpen] = React.useState(false)
  const [isProjectOpsManagementOpen, setIsProjectOpsManagementOpen] = React.useState(false)
  const [isProjectOpsFinanceOpen, setIsProjectOpsFinanceOpen] = React.useState(false)
  const [isProjectOpsSupportOpen, setIsProjectOpsSupportOpen] = React.useState(false)

  // Statutory Reports State
  const [isStatutoryOpen, setIsStatutoryOpen] = React.useState(false)
  const [isStatutoryTaxOpen, setIsStatutoryTaxOpen] = React.useState(false)
  const [isStatutoryRegistersOpen, setIsStatutoryRegistersOpen] = React.useState(false)

  const { permissions, business, loading: isBusinessDataLoading } = useBusinessData()
  const isBusinessLoaded = !isBusinessDataLoading && !isLoadingBusinesses
  const isIndia = (business as any)?.country === 'INDIA'

  const API_BASE_RAW = (import.meta.env.VITE_API_BASE || 'http://localhost:5002').trim()
  const API_BASE = API_BASE_RAW.replace(/\/$/, '')
  const API_ROOT = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`
  const ASSET_ROOT = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE
  const currentBusinessId = pathname.match(/^\/dashboard\/([^/]+)/)?.[1] || ''

  const getCookie = React.useCallback((name: string) => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([$?*|{}\\]\\^])/g, '\\$1') + '=([^;]*)'),
    )
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const decodeJwtPayload = React.useCallback((token: string) => {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const decoded = atob(padded)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }, [])

  const sanitizeLogoUrl = React.useCallback((value: unknown) => {
    const raw = String(value ?? '').trim()
    if (!raw) return ''
    return raw
      .replace(/^`+|`+$/g, '')
      .replace(/^"+|"+$/g, '')
      .replace(/^'+|'+$/g, '')
      .trim()
  }, [])

  const normalizeLogoUrl = React.useCallback(
    (value: unknown) => {
      const sanitized = sanitizeLogoUrl(value)
      if (!sanitized) return ''
      if (/^(https?:|data:|blob:)/i.test(sanitized)) return sanitized
      if (sanitized.startsWith('//')) return `https:${sanitized}`
      if (sanitized.startsWith('/')) return `${ASSET_ROOT}${sanitized}`
      return `${ASSET_ROOT}/${sanitized}`
    },
    [sanitizeLogoUrl, ASSET_ROOT],
  )

  const getBusinessLogo = React.useCallback(
    (businessLike: any) => {
      const settingsData = businessLike?.settings
      const settings = Array.isArray(settingsData)
        ? settingsData[0] || null
        : settingsData || null
      return normalizeLogoUrl(settings?.companyLogo)
    },
    [normalizeLogoUrl],
  )

  const getBusinessInitial = React.useCallback((name: string | null | undefined) => {
    const first = String(name || '').trim().charAt(0)
    return first ? first.toUpperCase() : 'B'
  }, [])

  React.useEffect(() => {
    setSelectedBusiness(currentBusinessId)
  }, [currentBusinessId])

  React.useEffect(() => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) {
      setIsEmployeeSession(false)
      return
    }

    const payload = decodeJwtPayload(token)
    const normalizedRole = String(payload?.role || '').trim().toUpperCase()
    const hasEmployeeId = Boolean(payload?.employeeId)
    setIsEmployeeSession(normalizedRole === 'EMPLOYEE' || hasEmployeeId)
  }, [decodeJwtPayload, getCookie])

  React.useEffect(() => {
    const isCrmPath = pathname.includes('/leads') || pathname.includes('/deals') || pathname.includes('/customers') || pathname.includes('/contacts')
    const isOpsPath = pathname.includes('/quotations') || pathname.includes('/sales-orders') || pathname.includes('/invoices') || pathname.includes('/payments') || pathname.includes('/credit-notes') || pathname.includes('/sales-returns') || pathname.includes('/recurring-invoices') || pathname.includes('/sales-report')
    const isActivitiesPath = pathname.includes('/activities') || pathname.includes('/meetings') || pathname.includes('/calls') || (pathname.includes('/tasks') && !pathname.includes('/project-operations')) || pathname.includes('/notes')
    const isMarketingPath = pathname.includes('/campaigns') || pathname.includes('/email-logs')
    const isAnalyticsPath = pathname.includes('/reports') && !pathname.includes('/purchase-reports') && !pathname.includes('/inventory-reports')

    if (isCrmPath || isOpsPath || isActivitiesPath || isMarketingPath || isAnalyticsPath) {
      setIsSalesOpen(true)
      if (isCrmPath) setIsSalesCrmOpen(true)
      if (isOpsPath) setIsSalesOpsOpen(true)
      if (isActivitiesPath) setIsSalesActivitiesOpen(true)
      if (isMarketingPath) setIsSalesMarketingOpen(true)
      if (isAnalyticsPath) setIsSalesAnalyticsOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    const isVendorsPath = pathname.includes('/vendors')
    const isPurchasingPath = pathname.includes('/purchase-orders') || pathname.includes('/bills') || pathname.includes('/purchase-requests') || pathname.includes('/grn') || pathname.includes('/vendor-payments') || pathname.includes('/purchase-returns') || pathname.includes('/vendor-bills')
    const isAnalyticsPath = pathname.includes('/purchase-reports')

    if (isVendorsPath || isPurchasingPath || isAnalyticsPath) {
      setIsProcurementOpen(true)
      if (isVendorsPath) setIsProcurementVendorsOpen(true)
      if (isPurchasingPath) setIsProcurementPurchasingOpen(true)
      if (isAnalyticsPath) setIsProcurementAnalyticsOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    const isProductPath = pathname.includes('/products') || pathname.includes('/categories') || pathname.includes('/brands') || pathname.includes('/units')
    const isWarehousePath = pathname.includes('/warehouses') || pathname.includes('/stock') || pathname.includes('/stock-transfers') || pathname.includes('/stock-adjustments')
    const isTrackingPath = pathname.includes('/batch-tracking') || pathname.includes('/serial-numbers')
    const isMonitoringPath = pathname.includes('/stock-movements') || pathname.includes('/reorder-alerts')
    const isAnalyticsPath = pathname.includes('/inventory-dashboard') || pathname.includes('/inventory-reports')

    if (isProductPath || isWarehousePath || isTrackingPath || isMonitoringPath || isAnalyticsPath) {
      setIsInventoryOpen(true)
      if (isProductPath) setIsInventoryProductOpen(true)
      if (isWarehousePath) setIsInventoryWarehouseOpen(true)
      if (isTrackingPath) setIsInventoryTrackingOpen(true)
      if (isMonitoringPath) setIsInventoryMonitoringOpen(true)
      if (isAnalyticsPath) setIsInventoryAnalyticsOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    const isEmployeesPath = pathname.includes('/employees') || pathname.includes('/attendance')
    const isWorkforcePath = pathname.includes('/leaves') || pathname.includes('/payrolls') || pathname.includes('/overtime') || pathname.includes('/loans')
    const isRequestsPath = pathname.includes('/bank-change-requests') || pathname.includes('/documents') || pathname.includes('/employee-documents')
    const isAnalyticsPath = pathname.includes('/hr-analytics')

    if (isEmployeesPath || isWorkforcePath || isRequestsPath || isAnalyticsPath) {
      setIsHrOpen(true)
      if (isEmployeesPath) setIsHrEmployeesOpen(true)
      if (isWorkforcePath) setIsHrWorkforceOpen(true)
      if (isRequestsPath) setIsHrRequestsOpen(true)
      if (isAnalyticsPath) setIsHrAnalyticsOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    if (pathname.includes('/accounts') || pathname.includes('/journal-entries') || pathname.includes('/reports') || pathname.includes('/expenses')) {
      setIsProjectManagementOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    if (pathname.includes('/inventory-dashboard')) {
      setIsInventoryDashboardOpen(true)
    }
  }, [pathname])

  React.useEffect(() => {
    if (pathname.includes('/project-operations')) {
      setIsProjectOpsOpen(true)
      if (pathname.includes('/project-operations/inquiries') || pathname.includes('/project-operations/requirements') || pathname.includes('/project-operations/estimations') || pathname.includes('/project-operations/proposals') || pathname.includes('/project-operations/negotiations')) {
        setIsProjectOpsPreSalesOpen(true)
      }
      if (pathname.includes('/project-operations/projects') || pathname.includes('/project-operations/planning') || pathname.includes('/project-operations/tasks') || pathname.includes('/project-operations/milestones') || pathname.includes('/project-operations/resources') || pathname.includes('/project-operations/timesheets') || pathname.includes('/project-operations/issues') || pathname.includes('/project-operations/change-requests')) {
        setIsProjectOpsManagementOpen(true)
      }
      if (pathname.includes('/project-operations/budgets') || pathname.includes('/project-operations/expenses') || pathname.includes('/project-operations/billing') || pathname.includes('/project-operations/profitability')) {
        setIsProjectOpsFinanceOpen(true)
      }
      if (pathname.includes('/project-operations/warranty') || pathname.includes('/project-operations/amc') || pathname.includes('/project-operations/tickets')) {
        setIsProjectOpsSupportOpen(true)
      }
    }
  }, [pathname])

  React.useEffect(() => {
    const fetchUserBusinesses = async () => {
      try {
        const token = getCookie('token') || getCookie('accessToken')
        if (!token) {
          if (!hasShownBusinessError.current) {
            hasShownBusinessError.current = true
            toast({
              title: 'Authentication required',
              description: 'Please sign in to load businesses.',
              variant: 'destructive',
            })
          }
          return
        }

        setIsLoadingBusinesses(true)
        const candidateUrls = [`${API_ROOT}/business`]

        let response: Response | null = null
        let lastError: any = null

        for (const url of candidateUrls) {
          try {
            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            response = res
            if (res.ok) {
              break
            }
          } catch (error) {
            lastError = error
          }
        }

        if (!response) {
          throw lastError || new Error('Failed to fetch businesses')
        }

        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || `Request failed with status ${response.status}`)
        }

        const ownedBusinesses = Array.isArray(data.ownedBusinesses)
          ? data.ownedBusinesses.map((item: any) => ({
              id: item.id,
              name: item.name,
              type: 'owned' as const,
              logoUrl: getBusinessLogo(item),
            }))
          : []
        const memberBusinesses = Array.isArray(data.memberBusinesses)
          ? data.memberBusinesses
              .map((item: any) => item?.business)
              .filter((item: any) => item?.id && item?.name)
              .map((item: any) => ({
                id: item.id,
                name: item.name,
                type: 'member' as const,
                logoUrl: getBusinessLogo(item),
              }))
          : []

        const combinedBusinesses = [...ownedBusinesses, ...memberBusinesses]
        setUserBusinesses(combinedBusinesses)

        const activeBusiness = combinedBusinesses.find((item) => item.id === currentBusinessId)
        if (activeBusiness?.name) {
          setBusinessName(activeBusiness.name)
          window.localStorage.setItem('businessName', activeBusiness.name)
        }
      } catch (error) {
        console.error('Failed to fetch user businesses:', error)
        if (!hasShownBusinessError.current) {
          hasShownBusinessError.current = true
          toast({
            title: 'Failed to load businesses',
            description: 'Please refresh and try again.',
            variant: 'destructive',
          })
        }
      } finally {
        setIsLoadingBusinesses(false)
      }
    }

    fetchUserBusinesses()
  }, [API_ROOT, currentBusinessId, getBusinessLogo, getCookie])

  React.useEffect(() => {
    // Modules are predefined. We don't fetch them.
  }, [])

  const activeBusiness = React.useMemo(
    () => userBusinesses.find((item) => item.id === selectedBusiness) || null,
    [selectedBusiness, userBusinesses],
  )

  // Derive the base dashboard path: /dashboard/{businessId}
  const baseDashboardPath =
    pathname.match(/^\/dashboard\/[^/]+/)?.[0] ?? '/dashboard'

  const moduleRouteMap = React.useMemo(
    () => ({
      customer: '/customers',
      contract: '/contracts',
      employee: '/employees',
      leave: '/leaves',
      payroll: '/payrolls',
      invoice: '/invoices',
      quotation: '/quotations',
      sales_order: '/sales-orders',
      salesorder: '/sales-orders',
      'sales order': '/sales-orders',
      leads: '/leads',
      deal: '/deals',
      contact: '/contacts',
      meeting: '/meetings',
      call: '/calls',
      task: '/tasks',
      note: '/notes',
      activities: '/activities',
      campaign: '/campaigns',
      email_log: '/email-logs',
      recurring_invoice: '/recurring-invoices',
      user: '/users',
      payment: '/payments',
      payments: '/payments',
      report: '/reports',
      reports: '/reports',
      journal: '/journal-entries',
      journal_entries: '/journal-entries',
      'journal entries': '/journal-entries',
      account: '/accounts',
      accounts: '/accounts',
      bankchange: '/bank-change-requests',
      overtime: '/overtime',
      loans: '/loans',
      vendors: '/vendors',
      purchase_order: '/purchase-orders',
      purchaseorder: '/purchase-orders',
      'purchase order': '/purchase-orders',
      bill: '/bills',
      bills: '/bills',
      credit_note: '/credit-notes',
      creditnote: '/credit-notes',
      'credit note': '/credit-notes',
      'credit notes': '/credit-notes',
      product: '/products',
      products: '/products',
      stock: '/stock',
      stocks: '/stock',
      warehouse: '/warehouses',
      warehouses: '/warehouses',
      expenses: '/expenses',
      settings: '/settings',
    }),
    [],
  )

  const moduleIconMap = React.useMemo(
    () => ({
      customer: UsersIcon,
      contract: FileTextIcon,
      employee: UsersIcon,
      leave: CalendarDaysIcon,
      payroll: WalletIcon,
      invoice: FileTextIcon,
      quotation: FileTextIcon,
      sales_order: FileTextIcon,
      salesorder: FileTextIcon,
      'sales order': FileTextIcon,
      leads: UserIcon,
      deal: TrendingUpIcon,
      contact: UserCheckIcon,
      meeting: CalendarDaysIcon,
      call: Phone,
      task: CheckSquare,
      note: StickyNote,
      activities: ActivityIcon,
      campaign: Megaphone,
      email_log: MailSearch,
      recurring_invoice: RefreshCw,
      user: UserCheckIcon,
      payment: WalletIcon,
      payments: WalletIcon,
      report: BarChart3,
      reports: BarChart3,
      journal: FileTextIcon,
      journal_entries: FileTextIcon,
      'journal entries': FileTextIcon,
      account: WalletIcon,
      accounts: WalletIcon,
      settings: SettingsIcon,
      bankchange: CreditCardIcon,
      overtime: ClockIcon,
      loans: HandCoinsIcon,
      vendors: StoreIcon,
      purchase_order: FileTextIcon,
      purchaseorder: FileTextIcon,
      'purchase order': FileTextIcon,
      bill: ReceiptIcon,
      bills: ReceiptIcon,
      credit_note: CreditCardIcon,
      creditnote: CreditCardIcon,
      'credit note': CreditCardIcon,
      'credit notes': CreditCardIcon,
      product: PackageIcon,
      products: PackageIcon,
      stock: PackageIcon,
      stocks: PackageIcon,
      warehouse: PackageIcon,
      warehouses: PackageIcon,
      expenses: ReceiptIcon,
      grn: PackageCheck,
      purchase_returns: Undo2,
      sales_returns: Undo2,
    }),
    [],
  )

  const sidebarModules = React.useMemo(() => {
    const mapped = modules
      .filter((moduleItem) => {
        const key = String(moduleItem?.name || '').toLowerCase().trim()
        const normalized = key.replace(/[\s_-]+/g, '')
        return normalized !== 'inviteuser' && normalized !== 'customercontact' && normalized !== 'project' && normalized !== 'tasks' && normalized !== 'task'
      })
      .map((moduleItem) => {
      const key = moduleItem.name.toLowerCase()
      const routeSuffix = moduleRouteMap[key as keyof typeof moduleRouteMap] || ''
      const href = routeSuffix ? `${baseDashboardPath}${routeSuffix}` : ''
      const Icon = moduleIconMap[key as keyof typeof moduleIconMap] || Building2Icon
      let label = key === 'leave' ? 'Leaves' : key.charAt(0).toUpperCase() + key.slice(1)

      // Apply renames
      if (key === 'deal') label = 'Deals'
      if (key === 'sales_returns') label = 'Returns'
      if (key === 'purchase_returns') label = 'Returns'
      if (key === 'grn') label = 'Receipts'
      if (key === 'vendor_bills') label = 'Bills'
      if (key === 'email_log' || key === 'emaillog') label = 'Email Tracking'
      if (key === 'report' || key === 'reports') label = 'Analytics'
      if (key === 'settings') label = 'Administration'
      if (key === 'leave' || key === 'leaves') label = 'Leave Management'
      if (key === 'loans' || key === 'loan') label = 'Loans & Advances'
      if (key === 'bankchange') label = 'Bank Requests'

      return {
        key,
        label,
        href,
        icon: Icon,
      }
    })

    if (!mapped.some((item) => item.key === 'leave')) {
      mapped.push({
        key: 'leave',
        label: 'Leaves',
        href: `${baseDashboardPath}/leaves`,
        icon: CalendarDaysIcon,
      })
    }

    if (!mapped.some((item) => item.key === 'deal')) {
      mapped.push({
        key: 'deal',
        label: 'Deal',
        href: `${baseDashboardPath}/deals`,
        icon: Building2Icon,
      })
    }

    if (!mapped.some((item) => item.key === 'activities')) {
      mapped.push({
        key: 'activities',
        label: 'Activities',
        href: `${baseDashboardPath}/activities`,
        icon: ActivityIcon,
      })
    }

    const selectedBusinessType = userBusinesses.find((item) => item.id === selectedBusiness)?.type
    const normalizedPermissions = (Array.isArray(permissions) ? permissions : []).map((item) => String(item || '').trim().toLowerCase())
    const canUpdateLeave = normalizedPermissions.includes('leave:update')
    const canViewApprovals = !isEmployeeSession && (selectedBusinessType === 'owned' || canUpdateLeave)

    if (canViewApprovals && !mapped.some((item) => item.key === 'bankchange')) {
      mapped.push({
        key: 'bankchange',
        label: 'Change Bank Request',
        href: `${baseDashboardPath}/bank-change-requests`,
        icon: CreditCardIcon,
      })
    }

    // Employees should also see bank change request (to submit their own requests)
    if (isEmployeeSession && !mapped.some((item) => item.key === 'bankchange')) {
      mapped.push({
        key: 'bankchange',
        label: 'Change Bank Request',
        href: `${baseDashboardPath}/bank-change-requests`,
        icon: CreditCardIcon,
      })
    }

    // Always show Overtime under HR for non-employee sessions (admins/owners)
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'overtime')) {
      mapped.push({
        key: 'overtime',
        label: 'Overtime',
        href: `${baseDashboardPath}/overtime`,
        icon: ClockIcon,
      })
    }

    // Always show Loans under HR for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'loans')) {
      mapped.push({
        key: 'loans',
        label: 'Loans / Advance',
        href: `${baseDashboardPath}/loans`,
        icon: HandCoinsIcon,
      })
    }

    // Always show Vendors for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'vendors')) {
      mapped.push({
        key: 'vendors',
        label: 'Vendors',
        href: `${baseDashboardPath}/vendors`,
        icon: StoreIcon,
      })
    }

    // Always show Expenses for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'expenses')) {
      mapped.push({
        key: 'expenses',
        label: 'Expenses',
        href: `${baseDashboardPath}/expenses`,
        icon: ReceiptIcon,
      })
    }

    // Always show Accounts for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'account' || item.key === 'accounts')) {
      mapped.push({
        key: 'accounts',
        label: 'Accounts',
        href: `${baseDashboardPath}/accounts`,
        icon: WalletIcon,
      })
    }

    // Always show Journal Entries for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'journal' || item.key === 'journal_entries' || item.key === 'journal entries')) {
      mapped.push({
        key: 'journal_entries',
        label: 'Journal Entries',
        href: `${baseDashboardPath}/journal-entries`,
        icon: FileTextIcon,
      })
    }

    // Always show Reports for non-employee sessions
    if (!isEmployeeSession && !mapped.some((item) => item.key === 'report' || item.key === 'reports')) {
      mapped.push({
        key: 'reports',
        label: 'Reports',
        href: `${baseDashboardPath}/reports`,
        icon: BarChart3,
      })
    }

    // Always show Payments (add if not present or if present but has no href)
    if (!mapped.some((item) => item.key === 'payment')) {
      mapped.push({
        key: 'payment',
        label: 'Payments',
        href: `${baseDashboardPath}/payments`,
        icon: WalletIcon,
      })
    } else {
      // If payment exists but has empty href, fix it
      const paymentItem = mapped.find((item) => item.key === 'payment')
      if (paymentItem && !paymentItem.href) {
        paymentItem.href = `${baseDashboardPath}/payments`
      }
    }

    // Always show Inventory modules for non-employee sessions
    if (!isEmployeeSession) {
      if (!mapped.some((item) => item.key === 'product' || item.key === 'products')) {
        mapped.push({
          key: 'products',
          label: 'Products',
          href: `${baseDashboardPath}/products`,
          icon: PackageIcon,
        })
      }
      if (!mapped.some((item) => item.key === 'stock' || item.key === 'stocks')) {
        mapped.push({
          key: 'stock',
          label: 'Stock',
          href: `${baseDashboardPath}/stock`,
          icon: PackageIcon,
        })
      }
      if (!mapped.some((item) => item.key === 'warehouse' || item.key === 'warehouses')) {
        mapped.push({
          key: 'warehouses',
          label: 'Warehouses',
          href: `${baseDashboardPath}/warehouses`,
          icon: PackageIcon,
        })
      }
    }

    return mapped
  }, [baseDashboardPath, isEmployeeSession, moduleIconMap, moduleRouteMap, modules, permissions, selectedBusiness, userBusinesses])

  const handleBusinessSwitch = React.useCallback(
    (value: string) => {
      if (value === 'new') {
        navigate('/create-business')
        return
      }

      if (!value || value === currentBusinessId) {
        return
      }

      const selected = userBusinesses.find((item) => item.id === value)
      if (selected?.name) {
        setBusinessName(selected.name)
        window.localStorage.setItem('businessName', selected.name)
      }

      setSelectedBusiness(value)
      window.localStorage.setItem('activeBusinessId', value)

      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `activeBusinessId=${encodeURIComponent(value)}; Path=/; Max-Age=604800; SameSite=Lax${secure}`

      toast({
        title: 'Business switched',
        description: selected?.name
          ? `Now viewing ${selected.name}.`
          : 'Business context updated.',
      })

      navigate(`/dashboard/${encodeURIComponent(value)}`)
    },
    [currentBusinessId, navigate, userBusinesses],
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 py-3">
        <Select
          value={selectedBusiness}
          onValueChange={handleBusinessSwitch}
          disabled={isLoadingBusinesses}
        >
          <SelectTrigger className="h-auto w-full cursor-pointer rounded-xl border border-blue-100 bg-card text-left text-xs shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:bg-muted py-4 px-5 dark:bg-[#15171a] dark:border-[#23272c] dark:text-white">
            <SelectValue>
              <div className="flex items-center gap-3 ">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-foreground shadow-sm">
                  {activeBusiness?.logoUrl ? (
                    <img
                      src={activeBusiness.logoUrl}
                      alt={activeBusiness?.name || 'Business logo'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getBusinessInitial(activeBusiness?.name || businessName || 'Business')
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-xs font-semibold dark:text-white">
                    {businessName || 'Your Business'}
                  </span>
                  <span className="text-[11px] text-muted-foreground dark:text-[#c2c7d0]">
                    {isEmployeeSession
                      ? 'Employee'
                      : userBusinesses.length > 0
                        ? userBusinesses.find((item) => item.id === selectedBusiness)?.type === 'owned'
                          ? 'Owner'
                          : 'Member'
                        : 'No businesses found'}
                  </span>
                </div>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent 
            className="
              w-64 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl 
              bg-card 
              dark:bg-[#181920] dark:border-[#24272a]
            "
          >
            {userBusinesses.map((item) => (
              <SelectItem
                key={item.id}
                value={item.id}
                className="
                  bg-background transition-colors cursor-pointer
                  hover:bg-muted/80 focus:bg-muted
                  dark:hover:bg-[#23272c] dark:focus:bg-[#23272c]
                  px-3 py-2
                "
              >
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-foreground shadow-sm">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.name || 'Business logo'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getBusinessInitial(item.name)
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate font-semibold dark:text-white text-black">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground dark:text-[#c2c7d0]">
                      {item.type === 'owned' ? 'Owner' : 'Member'}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
            <div className="my-1 border-t border-border dark:border-[#23272c]" />
            <SelectItem
              value="new"
              className="
                bg-background transition-colors cursor-pointer
                hover:bg-muted/80 focus:bg-muted
                dark:hover:bg-[#23272c] dark:focus:bg-[#23272c]
                px-3 py-2
              "
            >
              <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Plus className="size-4" />
                <span>New business</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='rounded-xl my-0.5'
              asChild
              tooltip="Dashboard"
              isActive={pathname.startsWith(baseDashboardPath) && !pathname.includes('/customers') && !pathname.includes('/contracts') && !pathname.includes('/employees') && !pathname.includes('/leads') && !pathname.includes('/deals') && !pathname.includes('/leaves') && !pathname.includes('/payrolls') && !pathname.includes('/invoices') && !pathname.includes('/quotations') && !pathname.includes('/sales-orders') && !pathname.includes('/payments') && !pathname.includes('/reports') && !pathname.includes('/journal-entries') && !pathname.includes('/accounts') && !pathname.includes('/settings') && !pathname.includes('/users') && !pathname.includes('/approvals') && !pathname.includes('/bank-change-requests') && !pathname.includes('/overtime') && !pathname.includes('/loans') && !pathname.includes('/vendors') && !pathname.includes('/products') && !pathname.includes('/stock') && !pathname.includes('/warehouse') && !pathname.includes('/warehouses') && !pathname.includes('/expenses') && !pathname.includes('/credit-notes')}
            >
              <Link to={baseDashboardPath} className="flex items-center gap-2">
                <LayoutDashboardIcon className="size-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!isBusinessLoaded &&
            Array.from({ length: 5 }).map((_, index) => (
              <SidebarMenuItem key={`module-skeleton-${index}`}>
                <div className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </SidebarMenuItem>
            ))}

          {isBusinessLoaded && (
            <>
              {/* 1. Dashboard is already above */}

              {/* 2. USER */}
              {!isEmployeeSession && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className='rounded-xl my-0.5'
                    asChild
                    tooltip="User"
                    isActive={pathname.includes('/users')}
                  >
                    <Link to={`${baseDashboardPath}/users`} className="flex items-center gap-2">
                      <UserCheckIcon className="size-4" />
                      <span>User</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* 3. Reorganized Sales Module */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'Sales')) return null;

                const invoice = sidebarModules.find((m) => m.key === 'invoice')
                const quotation = sidebarModules.find((m) => m.key === 'quotation')
                const salesOrder = sidebarModules.find((m) => m.key === 'sales_order' || m.key === 'salesorder' || m.key === 'sales order')
                const payment = sidebarModules.find((m) => m.key === 'payment' || m.key === 'payments')
                const customer = sidebarModules.find((m) => m.key === 'customer' || m.key === 'customers')
                const leads = sidebarModules.find((m) => m.key === 'leads')

                if (!invoice?.href && !quotation?.href && !salesOrder?.href && !payment?.href && !customer?.href && !leads?.href) return null

                return (
                  <SidebarMenuItem>
                    <Collapsible open={isSalesOpen} onOpenChange={setIsSalesOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Sales">
                          <TrendingUpIcon className="size-4" />
                          <span>Sales</span>
                          <ChevronDownIcon
                            className={`ml-auto size-4 transition-transform duration-200${
                              isSalesOpen ? ' rotate-180' : ''
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1 py-1">
                          {/* GROUP 1: CRM & Customers */}
                          {isMenuVisible(bType, 'Sales', 'CRM & Customers') && (
                          <Collapsible open={isSalesCrmOpen} onOpenChange={setIsSalesCrmOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>CRM & Customers</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isSalesCrmOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/leads`, label: 'Leads', icon: UserIcon, path: '/leads' },
                                { href: `${baseDashboardPath}/deals`, label: 'Deals', icon: TrendingUpIcon, path: '/deals' },
                                { href: `${baseDashboardPath}/customers`, label: 'Customers', icon: UsersIcon, path: '/customers' },
                                { href: `${baseDashboardPath}/contacts`, label: 'Contacts', icon: UserCheckIcon, path: '/contacts' },
                              ].filter(item => isMenuVisible(bType, 'Sales', 'CRM & Customers', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 2: Sales Operations */}
                          {isMenuVisible(bType, 'Sales', 'Sales Operations') && (
                          <Collapsible open={isSalesOpsOpen} onOpenChange={setIsSalesOpsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Sales Operations</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isSalesOpsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/quotations`, label: 'Quotations', icon: FileTextIcon, path: '/quotations' },
                                { href: `${baseDashboardPath}/sales-orders`, label: 'Sales Orders', icon: FileSignature, path: '/sales-orders' },
                                { href: `${baseDashboardPath}/invoices`, label: 'Invoices', icon: ReceiptIcon, path: '/invoices' },
                                { href: `${baseDashboardPath}/payments`, label: 'Payments', icon: WalletIcon, path: '/payments' },
                                { href: `${baseDashboardPath}/credit-notes`, label: 'Credit Notes', icon: CreditCardIcon, path: '/credit-notes' },
                                { href: `${baseDashboardPath}/sales-returns`, label: 'Returns', icon: Undo2, path: '/sales-returns' },
                                { href: `${baseDashboardPath}/recurring-invoices`, label: 'Recurring Invoices', icon: RefreshCw, path: '/recurring-invoices' },
                                { href: `${baseDashboardPath}/sales-report`, label: 'Sales Report', icon: FileTextIcon, path: '/sales-report' },
                              ].filter(item => isMenuVisible(bType, 'Sales', 'Sales Operations', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 3: Activities */}
                          {isMenuVisible(bType, 'Sales', 'Activities') && (
                          <Collapsible open={isSalesActivitiesOpen} onOpenChange={setIsSalesActivitiesOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Activities</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isSalesActivitiesOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/activities?type=Meeting`, label: 'Meetings', icon: CalendarDaysIcon, path: 'type=Meeting' },
                                { href: `${baseDashboardPath}/activities?type=Call`, label: 'Calls', icon: Phone, path: 'type=Call' },
                                { href: `${baseDashboardPath}/crm-tasks`, label: 'Tasks', icon: CheckSquare, path: '/crm-tasks' },
                                { href: `${baseDashboardPath}/notes`, label: 'Notes', icon: StickyNote, path: '/notes' },
                                { href: `${baseDashboardPath}/activities`, label: 'Activities', icon: ActivityIcon, path: '/activities' },
                              ].filter(item => isMenuVisible(bType, 'Sales', 'Activities', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 4: Marketing */}
                          {isMenuVisible(bType, 'Sales', 'Marketing') && (
                          <Collapsible open={isSalesMarketingOpen} onOpenChange={setIsSalesMarketingOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Marketing</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isSalesMarketingOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/campaigns`, label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
                                { href: `${baseDashboardPath}/email-logs`, label: 'Email Tracking', icon: MailSearch, path: '/email-logs' },
                              ].filter(item => isMenuVisible(bType, 'Sales', 'Marketing', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 5: Analytics */}
                          {isMenuVisible(bType, 'Sales', 'Analytics') && (
                          <Collapsible open={isSalesAnalyticsOpen} onOpenChange={setIsSalesAnalyticsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Analytics</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isSalesAnalyticsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/reports`, label: 'Sales Analytics', icon: PieChart, path: '/reports' },
                              ].filter(item => isMenuVisible(bType, 'Sales', 'Analytics', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })()}

              {/* 4. Reorganized Procurement Module */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'Procurement')) return null;

                const vendors = sidebarModules.find((m) => m.key === 'vendors')
                const purchaseOrder = sidebarModules.find((m) => m.key === 'purchase_order' || m.key === 'purchaseorder' || m.key === 'purchase order')
                const bills = sidebarModules.find((m) => m.key === 'bill' || m.key === 'bills')

                if (!vendors?.href && !purchaseOrder?.href && !bills?.href) return null

                return (
                  <SidebarMenuItem>
                    <Collapsible open={isProcurementOpen} onOpenChange={setIsProcurementOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Procurement">
                          <ShoppingCart className="size-4" />
                          <span>Procurement</span>
                          <ChevronDownIcon className={`ml-auto size-4 transition-transform duration-200${isProcurementOpen ? ' rotate-180' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1 py-1">
                          {/* GROUP 1: Vendors */}
                          {isMenuVisible(bType, 'Procurement', 'Vendors') && (
                          <Collapsible open={isProcurementVendorsOpen} onOpenChange={setIsProcurementVendorsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Vendors</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isProcurementVendorsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/vendors`, label: 'Vendors', icon: StoreIcon, path: '/vendors' },
                              ].filter(item => isMenuVisible(bType, 'Procurement', 'Vendors', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 2: Purchasing */}
                          {isMenuVisible(bType, 'Procurement', 'Purchasing') && (
                          <Collapsible open={isProcurementPurchasingOpen} onOpenChange={setIsProcurementPurchasingOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Purchasing</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isProcurementPurchasingOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/purchase-requests`, label: 'Purchase Requests', icon: ClipboardList, path: '/purchase-requests' },
                                { href: `${baseDashboardPath}/purchase-orders`, label: 'Purchase Orders', icon: FileTextIcon, path: '/purchase-orders' },
                                { href: `${baseDashboardPath}/grn`, label: 'Receipts', icon: PackageCheck, path: '/grn' },
                                { href: `${baseDashboardPath}/vendor-bills`, label: 'Bills', icon: ReceiptIcon, path: '/vendor-bills' },
                                { href: `${baseDashboardPath}/vendor-payments`, label: 'Vendor Payments', icon: WalletIcon, path: '/vendor-payments' },
                                { href: `${baseDashboardPath}/purchase-returns`, label: 'Returns', icon: Undo2, path: '/purchase-returns' },
                              ].filter(item => isMenuVisible(bType, 'Procurement', 'Purchasing', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}

                          {/* GROUP 3: Analytics */}
                          {isMenuVisible(bType, 'Procurement', 'Analytics') && (
                          <Collapsible open={isProcurementAnalyticsOpen} onOpenChange={setIsProcurementAnalyticsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Analytics</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isProcurementAnalyticsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/purchase-reports`, label: 'Procurement Analytics', icon: BarChart3, path: '/purchase-reports' },
                              ].filter(item => isMenuVisible(bType, 'Procurement', 'Analytics', item.label)).map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })()}

              {/* 5. Reorganized Inventory Module */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'Inventory')) return null;
                
                const products = sidebarModules.find((m) => m.key === 'product' || m.key === 'products')
                const stock = sidebarModules.find((m) => m.key === 'stock' || m.key === 'stocks')
                const warehouse = sidebarModules.find((m) => m.key === 'warehouse' || m.key === 'warehouses')
                if (!products?.href && !stock?.href && !warehouse?.href) return null
                return (
                  <SidebarMenuItem>
                    <Collapsible open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Inventory">
                          <Archive className="size-4" />
                          <span>Inventory</span>
                          <ChevronDownIcon className={`ml-auto size-4 transition-transform duration-200${isInventoryOpen ? ' rotate-180' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1 py-1">
                          {/* GROUP 1: Product Management */}
                          <Collapsible open={isInventoryProductOpen} onOpenChange={setIsInventoryProductOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Product Management</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isInventoryProductOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/products`, label: 'Products', icon: PackageIcon, path: '/products' },
                                { href: `${baseDashboardPath}/categories`, label: 'Categories', icon: Layers, path: '/categories' },
                                { href: `${baseDashboardPath}/brands`, label: 'Brands', icon: Tag, path: '/brands' },
                                { href: `${baseDashboardPath}/units`, label: 'Units', icon: Ruler, path: '/units' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 2: Warehouse Operations */}
                          <Collapsible open={isInventoryWarehouseOpen} onOpenChange={setIsInventoryWarehouseOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Warehouse Operations</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isInventoryWarehouseOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/warehouses`, label: 'Warehouses', icon: Archive, path: '/warehouses' },
                                { href: `${baseDashboardPath}/stock`, label: 'Stock Overview', icon: PackageCheck, path: '/stock' },
                                { href: `${baseDashboardPath}/stock-transfers`, label: 'Transfers', icon: ArrowLeftRight, path: '/stock-transfers' },
                                { href: `${baseDashboardPath}/stock-adjustments`, label: 'Adjustments', icon: SlidersHorizontal, path: '/stock-adjustments' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 3: Tracking (HIDDEN per user request)
                          <Collapsible open={isInventoryTrackingOpen} onOpenChange={setIsInventoryTrackingOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Tracking</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isInventoryTrackingOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/batch-tracking`, label: 'Batch Tracking', icon: Layers, path: '/batch-tracking' },
                                { href: `${baseDashboardPath}/serial-numbers`, label: 'Serial Tracking', icon: ScanLine, path: '/serial-numbers' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                          */}

                          {/* GROUP 4: Monitoring */}
                          <Collapsible open={isInventoryMonitoringOpen} onOpenChange={setIsInventoryMonitoringOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Monitoring</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isInventoryMonitoringOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[{ href: `${baseDashboardPath}/stock-movements`, label: 'Movement History', icon: History, path: '/stock-movements' },
                                { href: `${baseDashboardPath}/reorder-alerts`, label: 'Reorder Alerts', icon: AlertTriangle, path: '/reorder-alerts' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 5: Analytics */}
                          <Collapsible open={isInventoryAnalyticsOpen} onOpenChange={setIsInventoryAnalyticsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Analytics</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isInventoryAnalyticsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/inventory-dashboard`, label: 'Inventory Analytics', icon: BarChart3, path: '/inventory-dashboard' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })()}

              {/* 6. Project Management collapsible group: Accounts + Journal Entries + Reports + Expenses */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'Accounting & Finance')) return null;

                const accounts = sidebarModules.find((m) => m.key === 'account' || m.key === 'accounts')
                const journalEntries = sidebarModules.find(
                  (m) => m.key === 'journal' || m.key === 'journal_entries' || m.key === 'journal entries' || m.key === 'journal_entry' || m.key === 'journalentry',
                )
                const reports = sidebarModules.find((m) => m.key === 'report' || m.key === 'reports')
                const expenses = sidebarModules.find((m) => m.key === 'expenses')
                if (!accounts?.href && !journalEntries?.href && !reports?.href && !expenses?.href) return null

                return (
                  <SidebarMenuItem>
                    <Collapsible open={isProjectManagementOpen} onOpenChange={setIsProjectManagementOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Accounting & Finance">
                          <Building2Icon className="size-4" />
                          <span>Accounting & Finance</span>
                          <ChevronDownIcon
                            className={`ml-auto size-4 transition-transform duration-200${
                              isProjectManagementOpen ? ' rotate-180' : ''
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {accounts?.href && isMenuVisible(bType, 'Accounting & Finance', 'Accounts') ? (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/accounts')}>
                                <Link to={accounts.href} className="flex items-center gap-2">
                                  <WalletIcon className="size-4" />
                                  <span>Accounts</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : null}

                          {journalEntries?.href && isMenuVisible(bType, 'Accounting & Finance', 'Journal Entries') ? (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/journal-entries')}>
                                <Link to={journalEntries.href} className="flex items-center gap-2">
                                  <FileTextIcon className="size-4" />
                                  <span>Journal Entries</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : null}

                          {expenses?.href && isMenuVisible(bType, 'Accounting & Finance', 'Expenses') ? (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/expenses')}>
                                <Link to={expenses.href} className="flex items-center gap-2">
                                  <ReceiptIcon className="size-4" />
                                  <span>Expenses</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : null}

                          {reports?.href && isMenuVisible(bType, 'Accounting & Finance', 'Reports') ? (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/reports')}>
                                <Link to={reports.href} className="flex items-center gap-2">
                                  <FileTextIcon className="size-4" />
                                  <span>Reports</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ) : null}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })()}

              {/* 6.5 Project Operations */}
              <SidebarMenuItem>
                <Collapsible open={isProjectOpsOpen} onOpenChange={setIsProjectOpsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Project Operations">
                      <CheckSquare className="size-4" />
                      <span>Project Operations</span>
                      <ChevronDownIcon className={`ml-auto size-4 transition-transform duration-200${isProjectOpsOpen ? ' rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 py-1">
                      {/* Dashboard */}
                      <div className="px-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.endsWith('/project-operations')}>
                            <Link to={`${baseDashboardPath}/project-operations`} className="flex items-center gap-2">
                              <LayoutDashboardIcon className="size-4" />
                              <span>Dashboard</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </div>

                      {/* Pre-Sales */}
                      {business?.businessType?.toLowerCase() !== 'basic' && (
                        <Collapsible open={isProjectOpsPreSalesOpen} onOpenChange={setIsProjectOpsPreSalesOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>Pre-Sales</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isProjectOpsPreSalesOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {[
                                { href: `${baseDashboardPath}/project-operations/inquiries`, label: 'Customer Inquiries', icon: MessageSquare, path: '/inquiries' },
                                { href: `${baseDashboardPath}/project-operations/requirements`, label: 'Requirements', icon: FileTextIcon, path: '/requirements' },
                                { href: `${baseDashboardPath}/project-operations/estimations`, label: 'Estimations', icon: Calculator, path: '/estimations' },
                                { href: `${baseDashboardPath}/project-operations/proposals`, label: 'Proposals', icon: FileSignature, path: '/proposals' },
                                { href: `${baseDashboardPath}/project-operations/negotiations`, label: 'Negotiations', icon: HandCoinsIcon, path: '/negotiations' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Project Management */}
                      {business?.businessType?.toLowerCase() !== 'basic' && (
                        <Collapsible open={isProjectOpsManagementOpen} onOpenChange={setIsProjectOpsManagementOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>Management</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isProjectOpsManagementOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {[
                                { href: `${baseDashboardPath}/project-operations/projects`, label: 'Projects', icon: Briefcase, path: '/projects' },
                                { href: `${baseDashboardPath}/project-operations/planning`, label: 'Planning', icon: MapIcon, path: '/planning' },
                                { href: `${baseDashboardPath}/project-operations/tasks`, label: 'Tasks', icon: CheckSquare, path: '/tasks' },
                                { href: `${baseDashboardPath}/project-operations/milestones`, label: 'Milestones', icon: Flag, path: '/milestones' },
                                { href: `${baseDashboardPath}/project-operations/resources`, label: 'Resources', icon: UsersIcon, path: '/resources' },
                                { href: `${baseDashboardPath}/project-operations/timesheets`, label: 'Timesheets', icon: ClockIcon, path: '/timesheets' },
                                { href: `${baseDashboardPath}/project-operations/issues`, label: 'Issues', icon: AlertTriangle, path: '/issues' },
                                { href: `${baseDashboardPath}/project-operations/change-requests`, label: 'Change Requests', icon: ArrowLeftRight, path: '/change-requests' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Project Finance */}
                      {business?.businessType?.toLowerCase() !== 'basic' && (
                        <Collapsible open={isProjectOpsFinanceOpen} onOpenChange={setIsProjectOpsFinanceOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>Finance</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isProjectOpsFinanceOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {[
                                { href: `${baseDashboardPath}/project-operations/budgets`, label: 'Budgets', icon: WalletIcon, path: '/budgets' },
                                { href: `${baseDashboardPath}/project-operations/expenses`, label: 'Expenses', icon: ReceiptIcon, path: '/expenses' },
                                { href: `${baseDashboardPath}/project-operations/billing`, label: 'Billing', icon: DollarSign, path: '/billing' },
                                { href: `${baseDashboardPath}/project-operations/profitability`, label: 'Profitability', icon: TrendingUpIcon, path: '/profitability' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Support */}
                      {business?.businessType?.toLowerCase() !== 'basic' && (
                        <Collapsible open={isProjectOpsSupportOpen} onOpenChange={setIsProjectOpsSupportOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>Support</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isProjectOpsSupportOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {[
                                { href: `${baseDashboardPath}/project-operations/warranty`, label: 'Warranty', icon: ShieldAlert, path: '/warranty' },
                                { href: `${baseDashboardPath}/project-operations/amc`, label: 'AMC', icon: RefreshCw, path: '/amc' },
                                { href: `${baseDashboardPath}/project-operations/tickets`, label: 'Tickets', icon: HeadphonesIcon, path: '/tickets' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Standalone & Settings */}
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        {business?.businessType?.toLowerCase() === 'basic' && (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/project-operations/projects')}>
                              <Link to={`${baseDashboardPath}/project-operations/projects`} className="flex items-center gap-2">
                                <Briefcase className="size-4" />
                                <span>Projects</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/project-operations/documents')}>
                            <Link to={`${baseDashboardPath}/project-operations/documents`} className="flex items-center gap-2">
                              <FileTextIcon className="size-4" />
                              <span>Documents</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/project-operations/reports')}>
                            <Link to={`${baseDashboardPath}/project-operations/reports`} className="flex items-center gap-2">
                              <BarChart3 className="size-4" />
                              <span>Reports</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/project-operations/masters')}>
                            <Link to={`${baseDashboardPath}/project-operations/masters`} className="flex items-center gap-2">
                              <SettingsIcon className="size-4" />
                              <span>Masters</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>

                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* 6.6 General Report */}
              {business?.businessType?.toLowerCase() === 'basic' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="General Report" isActive={pathname.includes('/general-reports')} className="rounded-xl my-0.5">
                    <Link to={`${baseDashboardPath}/general-reports`} className="flex items-center gap-2">
                      <BarChart3 className="size-4" />
                      <span>General Report</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* 7. Reorganized HR Module */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'HR')) return null;

                const employees = sidebarModules.find((m) => m.key === 'employee' || m.key === 'employees')
                const leaves = sidebarModules.find((m) => m.key === 'leave' || m.key === 'leaves')
                const payroll = sidebarModules.find((m) => m.key === 'payroll')
                const bankchange = sidebarModules.find((m) => m.key === 'bankchange')
                const overtime = sidebarModules.find((m) => m.key === 'overtime')
                const loans = sidebarModules.find((m) => m.key === 'loans')
                
                if (!employees && !leaves && !payroll && !bankchange && !overtime && !loans) return null
                return (
                  <SidebarMenuItem>
                    <Collapsible open={isHrOpen} onOpenChange={setIsHrOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className='rounded-xl my-0.5' tooltip="HR">
                          <UsersIcon className="size-4" />
                          <span>HR</span>
                          <ChevronDownIcon className={`ml-auto size-4 transition-transform duration-200${isHrOpen ? ' rotate-180' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1 py-1">
                          {/* GROUP 1: Employees */}
                          <Collapsible open={isHrEmployeesOpen} onOpenChange={setIsHrEmployeesOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Employees</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isHrEmployeesOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: employees?.href || `${baseDashboardPath}/employees`, label: 'Employees', icon: UsersIcon, path: '/employees' },
                                { href: `${baseDashboardPath}/attendance`, label: 'Attendance', icon: CalendarDaysIcon, path: '/attendance' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 2: Workforce Management */}
                          <Collapsible open={isHrWorkforceOpen} onOpenChange={setIsHrWorkforceOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Workforce Management</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isHrWorkforceOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: leaves?.href || `${baseDashboardPath}/leaves`, label: 'Leave Management', icon: CalendarDaysIcon, path: '/leaves' },
                                { href: payroll?.href || `${baseDashboardPath}/payrolls`, label: 'Payroll', icon: WalletIcon, path: '/payrolls' },
                                { href: overtime?.href || `${baseDashboardPath}/overtime`, label: 'Overtime', icon: ClockIcon, path: '/overtime' },
                                { href: loans?.href || `${baseDashboardPath}/loans`, label: 'Loans & Advances', icon: HandCoinsIcon, path: '/loans' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 3: Employee Requests */}
                          <Collapsible open={isHrRequestsOpen} onOpenChange={setIsHrRequestsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Employee Requests</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isHrRequestsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: bankchange?.href || `${baseDashboardPath}/bank-change-requests`, label: 'Bank Requests', icon: CreditCardIcon, path: '/bank-change-requests' },
                                { href: `${baseDashboardPath}/documents`, label: 'Documents', icon: FileTextIcon, path: '/documents' },
                                { href: `${baseDashboardPath}/employee-documents`, label: 'Employee Documents', icon: FileTextIcon, path: '/employee-documents' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* GROUP 4: Analytics */}
                          <Collapsible open={isHrAnalyticsOpen} onOpenChange={setIsHrAnalyticsOpen} className="px-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                                <span>Analytics</span>
                                <ChevronDownIcon className={`size-3 transition-transform ${isHrAnalyticsOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                                {[
                                { href: `${baseDashboardPath}/hr-analytics`, label: 'HR Analytics', icon: BarChart3, path: '/hr-analytics' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })()}

              {/* 8. Contract */}
              {(() => {
                const item = sidebarModules.find((m) => m.key === 'contract' || m.key === 'contracts')
                if (!item?.href) return null
                return (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className='rounded-xl my-0.5'
                      asChild
                      tooltip={item.label}
                      isActive={pathname.includes('/contracts')}
                    >
                      <Link to={item.href} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })()}

              {/* 9. Statutory Reports */}
              {(() => {
                const bType = business?.businessType || business?.industry || (business as any)?.type || (business as any)?.businessCategory || 'unknown';
                if (!isMenuVisible(bType, 'Statutory Reports')) return null;
                
                return (
              <SidebarMenuItem>
                <Collapsible open={isStatutoryOpen} onOpenChange={setIsStatutoryOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className='rounded-xl my-0.5' tooltip="Statutory Reports">
                      <FileTextIcon className="size-4" />
                      <span>Statutory Reports</span>
                      <ChevronDownIcon className={`ml-auto size-4 transition-transform duration-200${isStatutoryOpen ? ' rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 py-1">
                      <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/statutory/dashboard')}>
                            <Link to={`${baseDashboardPath}/statutory/dashboard`} className="flex items-center gap-2">
                              <LayoutDashboardIcon className="size-4" />
                              <span>Dashboard</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <Collapsible open={isStatutoryTaxOpen} onOpenChange={setIsStatutoryTaxOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>{isIndia ? 'GST Reports' : 'VAT Reports'}</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isStatutoryTaxOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {isIndia ? (
                                [
                                  { href: `${baseDashboardPath}/statutory/tax-reports/gstr1`, label: 'GSTR-1', icon: FileTextIcon, path: '/gstr1' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/gstr3b`, label: 'GSTR-3B', icon: FileTextIcon, path: '/gstr3b' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/gstr9`, label: 'GSTR-9', icon: FileTextIcon, path: '/gstr9' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/hsn-summary`, label: 'HSN Summary', icon: PieChart, path: '/hsn-summary' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/tds-report`, label: 'TDS Report', icon: FileTextIcon, path: '/tds-report' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/gst-audit`, label: 'GST Audit', icon: CheckSquare, path: '/gst-audit' },
                                ].map(({ href, label, icon: Icon, path }) => (
                                  <SidebarMenuSubItem key={path}>
                                    <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                      <Link to={href} className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        <span>{label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))
                              ) : (
                                [
                                  { href: `${baseDashboardPath}/statutory/tax-reports/vat-return`, label: 'VAT Return', icon: FileTextIcon, path: '/vat-return' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/vat-summary`, label: 'VAT Summary', icon: PieChart, path: '/vat-summary' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/vat-transaction`, label: 'VAT Transaction Report', icon: FileTextIcon, path: '/vat-transaction' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/vat-audit`, label: 'VAT Audit', icon: CheckSquare, path: '/vat-audit' },
                                  { href: `${baseDashboardPath}/statutory/tax-reports/vat-exception`, label: 'VAT Exception Report', icon: AlertTriangle, path: '/vat-exception' },
                                ].map(({ href, label, icon: Icon, path }) => (
                                  <SidebarMenuSubItem key={path}>
                                    <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                      <Link to={href} className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        <span>{label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))
                              )}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>

                        <Collapsible open={isStatutoryRegistersOpen} onOpenChange={setIsStatutoryRegistersOpen} className="px-2">
                          <CollapsibleTrigger asChild>
                            <button className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                              <span>Registers</span>
                              <ChevronDownIcon className={`size-3 transition-transform ${isStatutoryRegistersOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="space-y-0.5 mt-1 border-l-2 border-border ml-2.5 pl-2">
                              {[{ href: `${baseDashboardPath}/statutory/registers/sales-register`, label: 'Sales Register', icon: TrendingUpIcon, path: '/sales-register' },
                                { href: `${baseDashboardPath}/statutory/registers/purchase-register`, label: 'Purchase Register', icon: ShoppingCart, path: '/purchase-register' },
                              ].map(({ href, label, icon: Icon, path }) => (
                                <SidebarMenuSubItem key={path}>
                                  <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes(path)}>
                                    <Link to={href} className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>

                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/statutory/generated')}>
                            <Link to={`${baseDashboardPath}/statutory/generated`} className="flex items-center gap-2">
                              <History className="size-4" />
                              <span>Generated Reports</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild size="sm" isActive={pathname.includes('/statutory/settings')}>
                            <Link to={`${baseDashboardPath}/statutory/settings`} className="flex items-center gap-2">
                              <SettingsIcon className="size-4" />
                              <span>Settings</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
                );
              })()}

              {/* Dynamically Filtered Modules (Remaining) */}
              {sidebarModules
                .filter((m) => !['payroll', 'bankchange', 'approvals', 'overtime', 'loans', 'vendors', 'expenses', 'loan', 'vendor', 'expense', 'settings', 'leads', 'deal', 'deals', 'invoice', 'quotation', 'sales_order', 'salesorder', 'sales order', 'payment', 'payments', 'purchase_order', 'purchaseorder', 'purchase order', 'bill', 'bills', 'product', 'products', 'stock', 'stocks', 'warehouse', 'warehouses', 'activity', 'activities', 'account', 'accounts', 'journal', 'journal_entries', 'journal entries', 'report', 'reports', 'project', 'projects', 'task', 'tasks', 'campaign', 'campaigns', 'crm_task', 'crm_note', 'crmtask', 'crmnote', 'email_log', 'emaillog', 'customer', 'customers', 'employee', 'employees', 'leave', 'leaves', 'journal_entry', 'journalentry', 'credit_note', 'creditnotes', 'creditnote', 'contact', 'contacts', 'meeting', 'meetings', 'call', 'calls', 'note', 'notes', 'recurring_invoice', 'recurring_invoices', 'grn', 'purchase_returns', 'sales_returns', 'vendor_bills', 'purchase_request', 'purchase_requests', 'email_logs', 'email_tracking', 'user', 'users', 'contract', 'contracts'].includes(m.key))
                .map((moduleItem) => (
                  <SidebarMenuItem key={moduleItem.key}>
                    {moduleItem.href ? (
                      <SidebarMenuButton
                        className='rounded-xl my-0.5'
                        asChild
                        tooltip={moduleItem.label}
                        isActive={pathname.includes(moduleItem.href.replace(baseDashboardPath, ''))}
                      >
                        <Link to={moduleItem.href} className="flex items-center gap-2">
                          <moduleItem.icon className="size-4" />
                          <span>{moduleItem.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        className='rounded-xl my-0.5'
                        tooltip={moduleItem.label}
                        onClick={() => {
                          toast({
                            title: 'Module page not available',
                            description: `${moduleItem.label} is configured but no page is mapped yet.`,
                            variant: 'default',
                          })
                        }}
                      >
                        <moduleItem.icon className="size-4" />
                        <span>{moduleItem.label}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}

              {/* 9. Administration (standalone - at bottom) */}
              {!isEmployeeSession && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className='rounded-xl my-0.5'
                    asChild
                    tooltip="Administration"
                    isActive={pathname.includes('/settings')}
                  >
                    <Link to={`${baseDashboardPath}/settings`} className="flex items-center gap-2">
                      <SettingsIcon className="size-4" />
                      <span>Administration</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {/* <div className="text-muted-foreground px-2 text-xs">
          ⌘B to toggle sidebar
        </div> */}
      </SidebarFooter>
    </Sidebar>
  )
}
