import React, { useState, useEffect } from 'react'
import {  useNavigate, useParams  } from 'react-router-dom';
import { leadsAPI, Lead, CreateLeadData } from '@/lib/api/leads'
import { usersAPI, BusinessUser } from '@/lib/api/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditLeadPageProps {
  businessId: string;
}

export default function EditLeadPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  const navigate = useNavigate()
  const params = useParams()
  
  const { id } = useParams();
const leadId = id as string
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    position: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    status: 'NEW',
    source: 'WEBSITE',
    assignedTo: '',
    tags: [],
    leadValue: 0,
    description: '',
    isPublic: true,
    contactedToday: false,
    defaultLanguage: 'English',
  })
  const [tagsInput, setTagsInput] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])

  useEffect(() => {
    if (!businessId) return
    usersAPI.getBusinessUsers(businessId)
      .then(res => setBusinessUsers(res.users || res.data || []))
      .catch(() => {})
  }, [businessId])


  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true)
        const response = await leadsAPI.getLeadDetails(businessId, leadId)
        if (response.success) {
          const leadData = response.data
          setLead(leadData)
          setFormData({
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone || '',
            company: leadData.company || '',
            website: leadData.website || '',
            position: leadData.position || '',
            city: leadData.city || '',
            state: leadData.state || '',
            country: leadData.country || '',
            zipCode: leadData.zipCode || '',
            status: leadData.status,
            source: leadData.source || 'WEBSITE',
            assignedTo: leadData.assignedTo || '',
            tags: leadData.tags || [],
            leadValue: leadData.leadValue || 0,
            description: leadData.description || '',
            isPublic: leadData.isPublic ?? true,
            contactedToday: leadData.contactedToday ?? false,
            defaultLanguage: leadData.defaultLanguage || 'English',
          })
          setTagsInput(leadData.tags ? leadData.tags.join(', ') : '')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch lead')
        navigate(`/dashboard/${businessId}/leads`)
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [businessId, leadId, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    // Convert tags input to array
    const submissionData = {
      ...formData,
      tags: tagsInput ? tagsInput.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
    }

    setFormLoading(true)
    try {
      const response = await leadsAPI.updateLead(businessId, leadId, submissionData)
      if (response.success) {
        toast.success('Lead updated successfully')
        navigate(`/dashboard/${businessId}/leads`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update lead')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Lead not found</h2>
          <p className="text-muted-foreground">The lead you're trying to edit doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 pb-10 pt-0 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/${businessId}/leads`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Lead</h1>
          <p className="text-muted-foreground">Update lead information</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  value={formData.assignedTo || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">— Unassigned —</SelectItem>
                    {businessUsers.map(bu => (
                      <SelectItem key={bu.id} value={bu.id}>
                        {bu.user?.name || bu.user?.email || bu.id}
                        {bu.role?.name ? ` (${bu.role.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  value={formData.defaultLanguage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/${businessId}/leads`)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Lead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
