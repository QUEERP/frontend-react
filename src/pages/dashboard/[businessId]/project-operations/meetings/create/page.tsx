import { toast } from 'sonner';
import React, { useState, useEffect, use, Suspense } from 'react';
import {   useNavigate, useSearchParams  , useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Calendar, Clock, Users, FileText, Info } from 'lucide-react';
import { projectOperationsAPI } from "@/lib/api/project-operations";

function CreateMeetingContent({ businessId }: { businessId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requirementId = searchParams.get('requirementId');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    meetingDate: '',
    meetingTime: '',
    meetingType: '',
    attendees: '',
    notes: ''
  });
  
  const [reqData, setReqData] = useState<any>(null);
  const [loadingReq, setLoadingReq] = useState(false);

  useEffect(() => {
    if (!requirementId) return;
    const fetchRequirement = async () => {
      try {
        setLoadingReq(true);
        const res = await projectOperationsAPI.getRequirementDetails(businessId, requirementId);
        if (res.requirement) {
          setReqData(res.requirement);
          setFormData(prev => ({
            ...prev,
            title: `Meeting: ${res.requirement.title}`
          }));
        }
      } catch (err) {
        console.error("Error fetching requirement:", err);
      } finally {
        setLoadingReq(false);
      }
    };
    fetchRequirement();
  }, [requirementId, businessId]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.meetingDate || !formData.meetingTime) {
        toast({ title: "Validation Error", description: "Title, Date and Time are required.", variant: "destructive" });
        return;
      }
      
      const payload = {
        title: formData.title,
        requirementId: requirementId || null,
        customerId: reqData?.customerId || null,
        inquiryId: reqData?.inquiries?.[0]?.id || null,
        meetingDate: formData.meetingDate,
        meetingTime: formData.meetingTime,
        meetingType: formData.meetingType,
        attendees: formData.attendees,
        notes: formData.notes,
        status: "Scheduled"
      };
      
      await projectOperationsAPI.createMeeting(businessId, payload);
      toast({ title: "Success", description: "Meeting scheduled successfully!" });
      navigate(`/dashboard/${businessId}/project-operations/requirements/${requirementId}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to schedule meeting", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Link to={`/dashboard/${businessId}/project-operations/requirements`}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Project Operations</span>
              <span>/</span>
              <span>Meetings</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">Schedule Meeting</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Schedule Project Meeting</h1>
        </div>

        {/* Auto-filled Reference Section */}
        {loadingReq ? (
          <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reqData && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
              <Info className="w-4 h-4" /> Linked References (Auto-Filled)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Requirement</span>
                <span className="font-semibold text-gray-900 dark:text-white">{reqData.requirementNumber} - {reqData.title}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Customer</span>
                <span className="font-semibold text-gray-900 dark:text-white">{reqData.customer?.company || reqData.customer?.name || "Unknown"}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Inquiry</span>
                <span className="font-semibold text-gray-900 dark:text-white">{reqData.inquiries?.[0]?.inquiryTitle || reqData.inquiries?.[0]?.name || "None"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Details Form */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Meeting Title <span className="text-red-500">*</span></label>
            <input 
              name="title" value={formData.title} onChange={handleInputChange} 
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date <span className="text-red-500">*</span></label>
              <input 
                type="date" name="meetingDate" value={formData.meetingDate} onChange={handleInputChange} 
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time <span className="text-red-500">*</span></label>
              <input 
                type="time" name="meetingTime" value={formData.meetingTime} onChange={handleInputChange} 
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Meeting Type</label>
              <select 
                name="meetingType" value={formData.meetingType} onChange={handleInputChange} 
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select Meeting Type...</option>
                <option value="Online">Online / Video Call</option>
                <option value="In-Person">In-Person</option>
                <option value="Phone Call">Phone Call</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Attendees</label>
              <input 
                name="attendees" value={formData.attendees} onChange={handleInputChange} placeholder="Comma separated emails"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Notes / Agenda</label>
            <textarea 
              name="notes" value={formData.notes} onChange={handleInputChange} rows={4}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={() => navigate(`/dashboard/${businessId}/project-operations/requirements`)} 
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
          >
            <Save className="w-4 h-4" /> Save Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateMeetingPage() {
  const routerParams = useParams() as any;
  const { businessId } = routerParams;

  
  
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <CreateMeetingContent businessId={businessId as string} />
    </Suspense>
  );
}
