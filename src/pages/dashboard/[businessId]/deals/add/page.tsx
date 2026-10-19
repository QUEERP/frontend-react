import * as React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DealForm } from '@/components/dashboard/deal-form'
import { CreateDealData, dealsAPI } from '@/lib/api/deals'
import { leadsAPI, Lead } from '@/lib/api/leads'
import { contactsAPI } from '@/lib/api/contacts'

export default function AddDealPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get('leadId')

  const [lead, setLead] = React.useState<Lead | null>(null)
  const [initialData, setInitialData] = React.useState<Partial<CreateDealData> | undefined>(undefined)
  const [loadingLead, setLoadingLead] = React.useState(!!leadId)

  React.useEffect(() => {
    if (!leadId || !businessId) return;

    const loadLeadData = async () => {
      try {
        setLoadingLead(true);
        const [leadRes, custRes] = await Promise.all([
          leadsAPI.getLeadDetails(businessId, leadId),
          contactsAPI.getCustomers(businessId).catch(() => ({ success: false, customers: [] })),
        ]);

        if (leadRes.success && leadRes.data) {
          const l = leadRes.data;
          setLead(l);
          const customers = custRes.customers || [];

          // Find or establish matching customer account
          let targetCustomerId = l.customerId;
          if (!targetCustomerId) {
            const targetName = (l.company || l.name || '').trim().toLowerCase();
            const matched = customers.find(c => 
              (c.company || c.name || '').trim().toLowerCase() === targetName
            );
            if (matched) {
              targetCustomerId = matched.id;
            } else if (l.company || l.name) {
              // Automatically register customer profile so the deal can associate with an account
              try {
                const newCust = await contactsAPI.createCustomer(businessId, {
                  company: l.company || l.name,
                  phone: l.phone,
                  country: l.country || 'India',
                  region: 'INDIA',
                  state: (l.country?.toUpperCase() === 'INDIA' || !l.country) ? (l.state || 'Gujarat') : (l.state || undefined),
                  currency: l.currency || 'INR',
                  address: l.address || undefined,
                  city: l.city || undefined,
                  leadId: l.id,
                } as any);
                if (newCust?.customer?.id) {
                  targetCustomerId = newCust.customer.id;
                }
              } catch (custErr) {
                console.error("Auto customer registration from lead error:", custErr);
              }
            }
          }

          const closeDate = l.expectedDecisionDate 
            ? new Date(l.expectedDecisionDate).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          setInitialData({
            name: l.company ? `${l.company} - Deal` : `${l.name} - Deal`,
            amount: l.leadValue || 0,
            customerId: targetCustomerId || '',
            stage: 'New',
            expectedCloseDate: closeDate,
            source: l.source || '',
            description: l.description || l.businessRequirement || '',
            currency: l.currency || 'INR',
            assignedToId: l.assignedToId || '',
            leadId: l.id,
          });
        }
      } catch (error) {
        console.error('Failed to load lead details for deal creation:', error);
        toast.error('Failed to load lead details');
      } finally {
        setLoadingLead(false);
      }
    };

    loadLeadData();
  }, [businessId, leadId]);

  const handleSubmit = async (data: CreateDealData) => {
    const payload = {
      ...data,
      ...(leadId ? { leadId } : {}),
    };

    const response = await dealsAPI.createDeal(businessId, payload);
    if (response.success) {
      if (leadId) {
        try {
          await leadsAPI.updateLead(businessId, leadId, {
            status: 'CONVERTED',
            customerId: data.customerId,
          });
        } catch {}
        toast.success(`Lead converted to Deal "${data.name}" successfully!`);
      } else {
        toast.success('Deal created successfully');
      }
      navigate(`/dashboard/${businessId}/deals`);
    }
  };

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 bg-[#f8fafc] dark:bg-background px-4 pb-12 pt-0 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(leadId ? `/dashboard/${businessId}/leads/${leadId}` : `/dashboard/${businessId}/deals`)}
            className="h-10 w-10 cursor-pointer bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-50 dark:hover:bg-muted shadow-sm transition-all rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground flex items-center gap-2">
              {lead ? 'Convert Lead to Deal' : 'Add New Deal'}
              {lead && <Sparkles className="h-5 w-5 text-amber-500" />}
            </h1>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              {lead 
                ? `Create a sales deal in your pipeline pre-filled from lead "${lead.company || lead.name}".`
                : 'Create a new deal to track in your pipeline'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        {lead && (
          <div className="mb-6 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  Converting Lead: {lead.company || lead.name}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Opportunity details, amount, expected closing date, and company profile pre-filled from lead.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 rounded-full">
              Deal Conversion
            </span>
          </div>
        )}

        {loadingLead ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-card border border-border rounded-2xl shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Fetching lead data and preparing deal opportunity...</p>
          </div>
        ) : (
          <DealForm
            businessId={businessId as string}
            title={lead ? "Opportunity Details" : "Deal Details"}
            description={lead ? "Review and adjust opportunity values, pipeline stage, and assigned representative." : "Enter the essential information to create a new opportunity in your pipeline."}
            submitLabel={lead ? "Convert Lead to Deal" : "Create Deal"}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}