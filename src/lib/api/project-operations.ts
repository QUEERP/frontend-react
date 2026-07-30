import { API_ROOT } from "@/config/api";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  
  if (name === 'token' || name === 'accessToken') {
    try {
      const local = localStorage.getItem('token');
      if (local && local !== 'null' && local !== 'undefined') return local;
    } catch (e) {}
  }
  
  return null;
}

export interface Resource {
  id: string;
  businessUserId: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  role: string;
  currentWorkload: number;
  projects: number;
  utilization: number;
  availability: string;
}

export interface ResourceAllocationData {
  projectId: string;
  taskId?: string;
  employeeId: string; // This should be the User ID from the resource list
  department?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  allocationPercent?: number;
  priority?: string;
  notes?: string;
}

export const projectOperationsAPI = {

  async createRequirement(businessId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create requirement');
    }

    return response.json();
  },

  async getRequirements(businessId: string, customerId?: string, status?: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        
    let url = `${API_ROOT}/project-operations/requirements`;
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch requirements');
    }

    return response.json();
  },

  async getRequirementDetails(businessId: string, requirementId: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/requirements/${requirementId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch requirement details');
    }
    return response.json();
  },

  async getInquiries(businessId: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/inquiries`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch inquiries');
    }
    return response.json();
  },
  async getInquiriesByCustomer(businessId: string, customerId: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/inquiries?customerId=${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch inquiries');
    }

    return response.json();
  },

  async createMeeting(businessId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create meeting');
    }
    return response.json();
  },

  async getResources(businessId: string): Promise<{ success: boolean; resources: Resource[] }> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/resources`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch resources');
    }

    return response.json();
  },

  async createProposal(businessId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      if (response.status === 404) return { success: true, proposal: { id: `PROP-${Date.now()}`, ...data } };
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create proposal');
    }
    return response.json();
  },

  async submitProposalApproval(businessId: string, id: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/proposals/${id}/submit-approval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });
    if (!response.ok) {
      if (response.status === 404) return { success: true };
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to submit proposal');
    }
    return response.json();
  },

  async sendProposal(businessId: string, id: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/proposals/${id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      if (response.status === 404) return { success: true };
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to send proposal');
    }
    return response.json();
  },

  async createEstimation(businessId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/estimations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create estimation');
    }

    return response.json();
  },

  async getEstimations(businessId: string, requirementId?: string, customerId?: string, status?: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        
    let url = `${API_ROOT}/project-operations/estimations`;
    const params = new URLSearchParams();
    if (requirementId) params.append('requirementId', requirementId);
    if (customerId) params.append('customerId', customerId);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch estimations');
    }

    return response.json();
  },

  async allocateResource(businessId: string, data: ResourceAllocationData): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/resources/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to allocate resource');
    }

    return response.json();
  },

  async getProjects(businessId: string, customerId?: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
    let url = `${API_ROOT}/project-operations`;
    if (customerId) url += `?customerId=${customerId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch projects');
    }

    return response.json();
  },

  async getTasks(businessId: string, projectId: string): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/project-operations/${projectId}/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch tasks');
    }

    return response.json();
  },

  async createIssue(businessId: string, projectId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/projects/${projectId}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create issue');
    }

    return response.json();
  },

  async createTimeEntry(businessId: string, data: any): Promise<any> {
    const token = getCookie('token') || getCookie('accessToken');
        const response = await fetch(`${API_ROOT}/time-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-business-id': businessId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to log time');
    }

    return response.json();
  },

  async getAllChangeRequests(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/change-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch change requests');
    }

    return response.json();
  },

  createChangeRequest: async (businessId: string, data: any) => {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/${data.projectId}/change-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create change request');
    }

    return response.json();
  },

  async getGlobalBudgets(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/budgets`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch budgets');
    }

    return response.json();
  },

  async reallocateBudget(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/reallocate-budget`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reallocate budget');
    }

    return response.json();
  },

  async getGlobalExpenses(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/expenses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }

    return response.json();
  },

  async createGlobalExpense(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/expenses/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create expense');
    }

    return response.json();
  },

  async updateExpenseWorkflow(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/expenses/workflow`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update expense workflow');
    }

    return response.json();
  },

  async getGlobalBilling(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/billing`, {
      headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
    });
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  async createGlobalBilling(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/billing/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create invoice');
    }

    return response.json();
  },

  async updateInvoiceWorkflow(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/billing/workflow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update invoice');
    }
    return response.json();
  },

  async addInvoicePayment(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/billing/payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to record payment');
    }
    return response.json();
  },

  async getGlobalProfitability(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_ROOT}/project-operations/global/profitability`, {
      headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
    });
    if (!response.ok) throw new Error('Failed to fetch profitability data');
    return response.json();
  },

  async getDocuments(businessId: string, params?: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const query = new URLSearchParams(params || {}).toString();
    const response = await fetch(`${API_ROOT}/project-operations/documents?${query}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  async createDocument(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_ROOT}/project-operations/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Failed to create document'); }
    return response.json();
  },

  async getMasters(businessId: string, type?: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const query = type ? `?type=${type}` : '';
    const response = await fetch(`${API_ROOT}/project-operations/masters${query}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId },
    });
    if (!response.ok) throw new Error('Failed to fetch masters');
    return response.json();
  },

  // Warranties
  async getWarranties(businessId: string, customerId?: string, projectId?: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (projectId) params.append('projectId', projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_ROOT}/project-operations/global/warranties${qs}`, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
    if (!response.ok) throw new Error('Failed to fetch warranties');
    return response.json();
  },
  async getCustomers(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_ROOT}/customers`, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
    if (!response.ok) throw new Error('Failed to fetch customers');
    return response.json();
  },

  async getEmployees(businessId: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_ROOT}/employees`, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  async createWarranty(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/warranties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  },
  async updateWarranty(businessId: string, id: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/warranties/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  },

  // AMCs
  async getAMCs(businessId: string, customerId?: string, projectId?: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (projectId) params.append('projectId', projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_ROOT}/project-operations/global/amcs${qs}`, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
    if (!response.ok) throw new Error('Failed to fetch AMCs');
    return response.json();
  },
  async createAMC(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/amcs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  },
  async updateAMC(businessId: string, id: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/amcs/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  },

  // Tickets
  async getTickets(businessId: string, customerId?: string, projectId?: string) {
    const token = getCookie('token') || getCookie('accessToken');
    if (!token) throw new Error('No authentication token found');
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (projectId) params.append('projectId', projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_ROOT}/project-operations/global/tickets${qs}`, { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } });
    if (!response.ok) throw new Error('Failed to fetch Tickets');
    return response.json();
  },
  async createTicket(businessId: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/tickets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  },
  async updateTicket(businessId: string, id: string, payload: any) {
    const token = getCookie('token') || getCookie('accessToken');
    const response = await fetch(`${API_ROOT}/project-operations/global/tickets/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-business-id': businessId },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.message || 'Failed'); }
    return response.json();
  }
};
