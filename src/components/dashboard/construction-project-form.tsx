import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getCookie } from '@/lib/utils';
import { useBusinessData } from "@/components/dashboard/business-data-provider";
import { useBusinessCustomers } from "@/hooks/use-business-data";
import { quotationsAPI } from "@/lib/api/quotations";
import { projectOperationsAPI } from "@/lib/api/project-operations";

export function ConstructionProjectForm({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryQuotationId = searchParams.get('quotationId') || '';
  const queryCustomerId = searchParams.get('customerId') || '';
  const { toast } = useToast();
  const { business } = useBusinessData();
  const { customers } = useBusinessCustomers(businessId);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projNumber: 'PRJ-001',
    projName: '',
    customerId: queryCustomerId,
    startDate: '',
    endDate: '',
    currency: 'CAD',
    quotationId: queryQuotationId,
    note: ''
  });

  const [items, setItems] = useState([{
    id: Date.now().toString(),
    itemName: '',
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0
  }]);

  useEffect(() => {
    // Fetch quotations
    const fetchQuotations = async () => {
      try {
        const res = await quotationsAPI.getQuotations(businessId);
        if (res.success && res.quotations) {
          setQuotations(res.quotations);
        }
      } catch (error) {
        console.error("Failed to fetch quotations:", error);
      }
    };
    
    const fetchNextProjectNumber = async () => {
      try {
        const res = await projectOperationsAPI.getProjects(businessId);
        const projects = res.data || res.projects || [];
        
        // Find all projects that start with PRJ-
        const prjNumbers = projects
          .map((p: any) => p.projectCode || '')
          .filter((code: string) => code.startsWith('PRJ-'))
          .map((code: string) => parseInt(code.replace('PRJ-', ''), 10))
          .filter((num: number) => !isNaN(num));

        if (prjNumbers.length > 0) {
          const maxNum = Math.max(...prjNumbers);
          const nextNum = maxNum + 1;
          const formatted = 'PRJ-' + nextNum.toString().padStart(3, '0');
          setFormData(prev => ({ ...prev, projNumber: formatted }));
        }
      } catch (error) {
        console.error("Failed to fetch projects for number generation:", error);
      }
    };

    fetchQuotations();
    fetchNextProjectNumber();
  }, [businessId]);

  useEffect(() => {
    if (formData.customerId && customers) {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      if (selectedCustomer) {
        if (selectedCustomer.currency) {
          setFormData(prev => ({ ...prev, currency: selectedCustomer.currency }));
        } else {
          const region = (selectedCustomer.region || '').toLowerCase();
          const country = (selectedCustomer.country || selectedCustomer.billingCountry || '').toLowerCase();
          
          if (region.includes('india') || country.includes('india') || country === 'in') {
            setFormData(prev => ({ ...prev, currency: 'INR' }));
          } else if (region.includes('uae') || country.includes('uae') || country.includes('united arab emirates') || country === 'ae') {
            setFormData(prev => ({ ...prev, currency: 'AED' }));
          } else {
            setFormData(prev => ({ ...prev, currency: 'CAD' }));
          }
        }
      }
    }
  }, [formData.customerId, customers]);

  useEffect(() => {
    if (formData.quotationId && quotations.length > 0) {
      const selectedQuote = quotations.find(q => q.id === formData.quotationId);
      if (selectedQuote && selectedQuote.items && selectedQuote.items.length > 0) {
        const newItems = selectedQuote.items.map((item: any, index: number) => ({
          id: Date.now().toString() + index,
          itemName: item.itemName || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          rate: item.price || item.unitPrice || 0,
          amount: (item.quantity || 1) * (item.price || item.unitPrice || 0)
        }));
        setItems(newItems);
      }
    }
  }, [formData.quotationId, quotations]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), itemName: '', description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projName || !formData.customerId) {
      toast({ title: "Validation Error", description: "Project Title and Customer are required.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '');
      const payload = {
        projectCode: formData.projNumber,
        projectName: formData.projName,
        customerId: formData.customerId,
        department: 'Construction',
        status: 'ACTIVE',
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        quotationId: formData.quotationId || undefined,
        budget: items.reduce((sum, item) => sum + item.amount, 0),
        executionType: 'CONSTRUCTION'
      };

      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || token === 'null' || token === 'undefined') {
        token = getCookie('token') || getCookie('accessToken') || '';
      }

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-business-id': businessId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to create project');
      }

      toast({ title: "Success", description: "Construction Project created successfully." });
      navigate(`/dashboard/${businessId}/project-operations/projects`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col font-sans">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <span>PROJECT OPERATIONS</span> <span className="text-gray-300 dark:text-gray-600">/</span> <span>CONSTRUCTION</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Construction Project</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold rounded">
                {formData.projNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons moved to bottom */}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Project Number
                </label>
                <input
                  type="text"
                  value={formData.projNumber}
                  disabled
                  className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.projName}
                  onChange={(e) => handleChange('projName', e.target.value)}
                  placeholder="Enter project title"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleChange('customerId', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="" disabled>Select Customer...</option>
                  {customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Expected Complete Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Quotation
                </label>
                <select
                  value={formData.quotationId}
                  onChange={(e) => handleChange('quotationId', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="">None</option>
                  {quotations?.filter(q => !formData.customerId || q.customerId === formData.customerId).map((q: any) => (
                    <option key={q.id} value={q.id}>{q.quoteNumber} {q.title ? `- ${q.title}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg w-1/4">Item Name</th>
                    <th className="px-4 py-3 w-1/3">Description</th>
                    <th className="px-4 py-3 w-24 text-right">Qty</th>
                    <th className="px-4 py-3 w-32 text-right">Rate</th>
                    <th className="px-4 py-3 w-32 text-right">Amount</th>
                    <th className="px-4 py-3 rounded-tr-lg w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="Name"
                          className="w-full p-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded outline-none transition-all"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full p-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded outline-none transition-all"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full p-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded outline-none transition-all text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.rate}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          className="w-full p-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded outline-none transition-all text-right"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-gray-900 dark:text-white">
                        {item.amount.toLocaleString(formData.currency === 'CAD' ? 'en-CA' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
              
              <div className="text-right flex items-center gap-4">
                <span className="text-sm font-bold text-gray-500 uppercase">Total ({formData.currency})</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {items.reduce((sum, item) => sum + item.amount, 0).toLocaleString(formData.currency === 'CAD' ? 'en-CA' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Note</h3>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Add any additional notes for this project..."
              rows={4}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 pb-8">
            <button onClick={() => navigate(-1)} className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Start & Save Project"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
