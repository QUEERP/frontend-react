import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { contractsAPI, Contract } from '@/lib/api/contracts';
import { useBusinessData } from '@/components/dashboard/business-data-provider';
import {
  ArrowLeft, Edit, Trash2, Calendar, FileText, CheckCircle2,
  Building2, Phone, Mail, Clock, Download, ShieldCheck, Printer,
  FileSignature, AlertCircle, Sparkles, User, MapPin, Globe, Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContractDetailsClientProps {
  businessId: string;
  contractId: string;
}

export function ContractDetailsClient({ businessId, contractId }: ContractDetailsClientProps) {
  const navigate = useNavigate();
  const { business } = useBusinessData();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isProjectOps = typeof window !== 'undefined' && window.location.pathname.includes('/project-operations');
  const contractsBasePath = isProjectOps
    ? `/dashboard/${businessId}/project-operations/contracts`
    : `/dashboard/${businessId}/contracts`;

  useEffect(() => {
    fetchContract();
  }, [businessId, contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await contractsAPI.getContractById(businessId, contractId);
      const c = res.contract || (res as any).data;
      if (c) {
        setContract(c);
      } else {
        toast.error('Contract not found');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number, currency?: string) => {
    const curr = (currency || 'USD').toUpperCase();
    try {
      const locale = curr === 'INR' ? 'en-IN' : (curr === 'EUR' ? 'de-DE' : (curr === 'GBP' ? 'en-GB' : 'en-US'));
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
      }).format(val || 0);
    } catch {
      return `${curr} ${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'INACTIVE': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'TERMINATED': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default: return 'bg-muted text-foreground border-border dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const parseContractMeta = (description?: string) => {
    if (!description) return { negNumber: null, proposalId: null, scope: null, timeline: null, otherText: '' };
    const lines = description.split('\n');
    let negNumber: string | null = null;
    let proposalId: string | null = null;
    let scope: string | null = null;
    let timeline: string | null = null;
    const otherLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^Auto-generated from Negotiation:\s*/i.test(trimmed) || /^Negotiation:\s*/i.test(trimmed)) {
        negNumber = trimmed.replace(/^Auto-generated from Negotiation:\s*/i, '').replace(/^Negotiation:\s*/i, '').trim();
      } else if (/^Proposal:\s*/i.test(trimmed)) {
        proposalId = trimmed.replace(/^Proposal:\s*/i, '').trim();
      } else if (/^Scope:\s*/i.test(trimmed)) {
        scope = trimmed.replace(/^Scope:\s*/i, '').trim();
      } else if (/^Timeline:\s*/i.test(trimmed)) {
        timeline = trimmed.replace(/^Timeline:\s*/i, '').trim();
      } else if (trimmed.length > 0) {
        otherLines.push(trimmed);
      }
    }

    return { negNumber, proposalId, scope, timeline, otherText: otherLines.join('\n') };
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) return;
    try {
      setIsDeleting(true);
      await contractsAPI.deleteContract(businessId, contractId);
      toast.success('Contract deleted successfully');
      navigate(`/dashboard/${businessId}/contracts`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete contract');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contract) return;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const { negNumber, proposalId, scope, timeline, otherText } = parseContractMeta(contract.description);
    const clientName = contract.customer?.company || contract.customer?.name || 'Valued Client';
    const bizName = business?.name || 'QueERP Solutions';

    // 1. Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 28, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('COMMERCIAL CONTRACT AGREEMENT', 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Ref: ${contract.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Date: ${new Date(contract.startDate || contract.createdAt).toLocaleDateString()}`, pageWidth - 14, 20, { align: 'right' });

    // 2. Parties Table
    autoTable(doc, {
      startY: 38,
      head: [['FIRST PARTY (SERVICE PROVIDER)', 'SECOND PARTY (CLIENT / BUYER)']],
      body: [
        [
          `${bizName}\n` +
          `${business?.address || [business?.city, business?.country].filter(Boolean).join(', ') || 'Corporate Headquarters'}\n` +
          `Email: ${business?.email || 'N/A'}\n` +
          `Phone: ${business?.phone || 'N/A'}` +
          (business?.vatNumber ? `\nTax ID: ${business.vatNumber}` : ''),
          `${clientName}\n` +
          `${[(contract.customer as any)?.billingStreet, (contract.customer as any)?.billingCity, (contract.customer as any)?.billingCountry].filter(Boolean).join(', ') || (contract.customer as any)?.address || 'Client Address on File'}\n` +
          `Email: ${contract.customer?.email || 'N/A'}\n` +
          `Phone: ${contract.customer?.phone || 'N/A'}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [203, 213, 225] },
    });

    // 3. Agreement & Commercial Terms
    const afterPartiesY = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. COMMERCIAL & FINANCIAL SPECIFICATIONS', 14, afterPartiesY + 8);

    autoTable(doc, {
      startY: afterPartiesY + 11,
      head: [['Agreement Term', 'Agreed Parameters']],
      body: [
        ['Contract Title', contract.title],
        ['Agreed Total Value', `${formatCurrency(contract.value, contract.currency)} (${contract.currency || 'USD'})`],
        ['Agreement Type', contract.type?.name || 'Commercial Contract Agreement'],
        ['Effective Start Date', new Date(contract.startDate).toLocaleDateString()],
        ['Expiration / End Date', contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Mutual Completion / Open-Ended'],
        ['Origin Negotiation Ref', negNumber || 'Direct Agreement'],
        ['Linked Proposal Ref', proposalId || 'N/A'],
        ['Current Status', contract.status],
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } }
    });

    // 4. Scope & Conditions
    const afterTermsY = (doc as any).lastAutoTable?.finalY || 135;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. SCOPE OF WORK & OPERATIONAL TERMS', 14, afterTermsY + 8);

    autoTable(doc, {
      startY: afterTermsY + 11,
      body: [
        ['Scope Definition', scope || 'Standard Scope as detailed in the linked proposal and technical specifications.'],
        ['Timeline & Milestones', timeline || 'Standard milestones and phase schedules as mutually agreed.'],
        ...(otherText ? [['Additional Notes', otherText]] : [])
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3.5, lineColor: [226, 232, 240] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] } }
    });

    // 5. Standard Legal Clauses
    const afterScopeY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. STANDARD AGREEMENT COVENANTS', 14, afterScopeY + 8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const clauses = [
      '• Delivery & Quality: The Service Provider agrees to perform the obligations with professional diligence and standards.',
      `• Consideration: The Client agrees to disburse payments in ${contract.currency || 'USD'} as per agreed invoice schedules.`,
      '• Confidentiality: Both parties mutually undertake to safeguard proprietary materials and commercial terms.',
      '• Entire Agreement: This contract constitutes the binding understanding between the parties regarding the subject matter.'
    ];
    let clauseY = afterScopeY + 13;
    clauses.forEach(c => {
      doc.text(c, 14, clauseY);
      clauseY += 4.5;
    });

    // 6. Signatures
    autoTable(doc, {
      startY: clauseY + 4,
      head: [['AUTHORIZED SIGNATURE (PARTY A)', 'AUTHORIZED SIGNATURE (PARTY B)']],
      body: [
        [
          `\n\n_____________________________________\nFor: ${bizName}\nTitle: Executive Officer\nDate: _______________________________`,
          `\n\n_____________________________________\nFor: ${clientName}\nTitle: Authorized Representative\nDate: _______________________________`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4, lineColor: [203, 213, 225] },
    });

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Commercial Contract Agreement • Ref: ${contract.id.slice(0, 8).toUpperCase()} • Generated via QueERP • Confidential`,
        14,
        290
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 290, { align: 'right' });
    }

    doc.save(`${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_Agreement.pdf`);
    toast.success('Official Contract PDF downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-500">Loading contract agreement...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Contract Not Found</h2>
        <p className="text-sm text-gray-500">The requested agreement does not exist or has been deleted.</p>
        <Button onClick={() => navigate(contractsBasePath)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contracts
        </Button>
      </div>
    );
  }

  const clientName = contract.customer?.company || contract.customer?.name || 'Valued Client';
  const bizName = business?.name || 'QueERP Solutions';
  const { negNumber, proposalId, scope, timeline, otherText } = parseContractMeta(contract.description);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. SCREEN VIEW (Hidden during print)
      ────────────────────────────────────────────────────────────── */}
      <div className="print:hidden min-h-full bg-gray-50/60 dark:bg-gray-950 p-4 md:p-6 lg:p-8 w-full min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Top Header Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div className="flex items-center gap-3.5">
                <Link
                  to={contractsBasePath}
                  className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm text-gray-600 dark:text-gray-300"
                  title="Back to Contracts"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    <span>Contracts</span>
                    <span>/</span>
                    <span className="text-blue-600 dark:text-blue-400">{contract.type?.name || 'Agreement'}</span>
                    {negNumber && (
                      <>
                        <span>/</span>
                        <span className="text-orange-600 dark:text-orange-400 font-mono">Negotiation: {negNumber}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                      {contract.title}
                    </h1>
                    <Badge variant="outline" className={`font-bold border px-2.5 py-0.5 ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="gap-1.5 font-bold text-xs shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" /> Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 font-bold text-xs shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-600" /> Print Agreement
                </Button>
                {negNumber ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/${businessId}/project-operations/negotiations/create?edit=${negNumber}`)}
                      className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm"
                    >
                      <Handshake className="w-3.5 h-3.5" /> Edit Negotiation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`${contractsBasePath}/${contract.id}/edit`)}
                      className="gap-1.5 font-bold text-xs shadow-sm text-gray-700 dark:text-gray-300"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Contract
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => navigate(`${contractsBasePath}/${contract.id}/edit`)}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Contract
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>

            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Main Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Financial Value Banner */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" /> Agreed Contract Value
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-white">
                    {formatCurrency(contract.value, contract.currency)}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2.5 border border-white/10 text-right">
                  <span className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider block">Currency</span>
                  <span className="text-lg font-black text-white">{contract.currency || 'USD'}</span>
                </div>
              </div>

              {/* Contract Description & Scope Card */}
              <Card className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Scope of Work & Agreement Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {/* Clean Formatted Metadata Grid if from Negotiation */}
                  {(negNumber || proposalId || scope || timeline) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs">
                      {negNumber && (
                        <div>
                          <span className="text-gray-400 font-bold uppercase block text-[10px]">Negotiation Reference</span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{negNumber}</span>
                        </div>
                      )}
                      {proposalId && (
                        <div>
                          <span className="text-gray-400 font-bold uppercase block text-[10px]">Linked Proposal</span>
                          <span className="font-mono font-bold text-gray-700 dark:text-gray-300 truncate block max-w-full">{proposalId}</span>
                        </div>
                      )}
                      {scope && (
                        <div>
                          <span className="text-gray-400 font-bold uppercase block text-[10px]">Agreed Scope</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{scope}</span>
                        </div>
                      )}
                      {timeline && (
                        <div>
                          <span className="text-gray-400 font-bold uppercase block text-[10px]">Project Timeline</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{timeline}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {otherText ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {otherText}
                    </div>
                  ) : (!negNumber && !proposalId && !contract.description && (
                    <p className="text-xs text-gray-400 italic">No additional scope description provided for this contract.</p>
                  ))}
                </CardContent>
              </Card>

              {/* General Agreement Parameters Card */}
              <Card className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-indigo-600" />
                    Contract Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Agreement Type</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {contract.type?.name || 'Standard Agreement'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Current Status</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {contract.status}
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Agreement Start</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {new Date(contract.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Agreement Expiry</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Ongoing / Open-ended'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Customer Information Card */}
              <Card className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> Client Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-base">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">{clientName}</h3>
                      <p className="text-xs text-gray-400">Primary Counterparty</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                    {contract.customer?.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={`mailto:${contract.customer.email}`} className="hover:text-blue-600 truncate underline">
                          {contract.customer.email}
                        </a>
                      </div>
                    )}
                    {contract.customer?.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{contract.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contract Timeline Details */}
              <Card className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" /> Timeline & Lifecycle
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 font-semibold uppercase">Effective Date</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {new Date(contract.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 font-semibold uppercase">Expiration</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Active Ongoing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 font-semibold uppercase">Contract ID</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300 text-[11px] truncate max-w-[180px]">
                      {contract.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-500 font-semibold uppercase">Recorded At</span>
                    <span className="font-bold text-gray-600 dark:text-gray-400">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DEDICATED PRINT DOCUMENT (Shown ONLY during print)
      ────────────────────────────────────────────────────────────── */}
      <div className="hidden print:block w-full bg-white text-slate-900 font-sans p-2">
        {/* Document Header / Letterhead */}
        <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              {bizName}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              {business?.address || [business?.city, business?.country].filter(Boolean).join(', ') || 'Corporate Headquarters'}
            </p>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3">
              {business?.email && <span>Email: {business.email}</span>}
              {business?.phone && <span>Tel: {business.phone}</span>}
              {business?.vatNumber && <span>Tax ID: {business.vatNumber}</span>}
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded">
              Contract Agreement
            </span>
            <div className="text-xs text-slate-700 mt-2 space-y-0.5">
              <p><span className="font-bold text-slate-900">Contract Ref:</span> {contract.id.slice(0, 8).toUpperCase()}</p>
              {negNumber && <p><span className="font-bold text-slate-900">Negotiation Ref:</span> {negNumber}</p>}
              <p><span className="font-bold text-slate-900">Date:</span> {new Date(contract.startDate || contract.createdAt).toLocaleDateString()}</p>
              <p><span className="font-bold text-slate-900">Status:</span> {contract.status}</p>
            </div>
          </div>
        </div>

        {/* Contract Title Banner */}
        <div className="my-5 p-3.5 bg-slate-100 rounded-lg border border-slate-300 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject / Agreement Title</span>
            <h2 className="text-lg font-black text-slate-900">{contract.title}</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agreed Value</span>
            <span className="text-xl font-black text-slate-900">{formatCurrency(contract.value, contract.currency)}</span>
          </div>
        </div>

        {/* Parties Box (Two Columns) */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="p-3.5 border border-slate-300 rounded-lg">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200">
              First Party (Service Provider)
            </h3>
            <p className="text-sm font-bold text-slate-900">{bizName}</p>
            <p className="text-xs text-slate-600 mt-1">{business?.address || 'Corporate Headquarters'}</p>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              {business?.email && <p>Email: {business.email}</p>}
              {business?.phone && <p>Phone: {business.phone}</p>}
            </div>
          </div>

          <div className="p-3.5 border border-slate-300 rounded-lg">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200">
              Second Party (Client / Buyer)
            </h3>
            <p className="text-sm font-bold text-slate-900">{clientName}</p>
            <p className="text-xs text-slate-600 mt-1">
              {[(contract.customer as any)?.billingStreet, (contract.customer as any)?.billingCity, (contract.customer as any)?.billingCountry].filter(Boolean).join(', ') || (contract.customer as any)?.address || 'Client Address on File'}
            </p>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              {contract.customer?.email && <p>Email: {contract.customer.email}</p>}
              {contract.customer?.phone && <p>Phone: {contract.customer.phone}</p>}
            </div>
          </div>
        </div>

        {/* Commercial & Contract Terms Table */}
        <div className="my-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
            1. Commercial Specifications
          </h3>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-50 w-1/4 border-r border-slate-300">Agreed Value</td>
                <td className="p-2 font-bold text-slate-900 w-1/4 border-r border-slate-300">{formatCurrency(contract.value, contract.currency)}</td>
                <td className="p-2 font-bold bg-slate-50 w-1/4 border-r border-slate-300">Currency</td>
                <td className="p-2 font-bold text-slate-900 w-1/4">{contract.currency || 'USD'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Agreement Type</td>
                <td className="p-2 border-r border-slate-300">{contract.type?.name || 'Standard Agreement'}</td>
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Effective Date</td>
                <td className="p-2">{new Date(contract.startDate).toLocaleDateString()}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Expiration Date</td>
                <td className="p-2 border-r border-slate-300">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Mutual Completion / Open-Ended'}</td>
                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Status</td>
                <td className="p-2 font-bold text-emerald-700">{contract.status}</td>
              </tr>
              {negNumber && (
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Negotiation Reference</td>
                  <td className="p-2 font-mono border-r border-slate-300">{negNumber}</td>
                  <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Proposal ID</td>
                  <td className="p-2 font-mono text-[10px] truncate max-w-[150px]">{proposalId || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Scope of Work */}
        <div className="my-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
            2. Scope of Work & Deliverables
          </h3>
          <div className="p-3 border border-slate-300 rounded-lg text-xs space-y-2 leading-relaxed">
            {scope && (
              <div>
                <span className="font-bold text-slate-900">Agreed Scope: </span>
                <span className="text-slate-700">{scope}</span>
              </div>
            )}
            {timeline && (
              <div>
                <span className="font-bold text-slate-900">Delivery Timeline: </span>
                <span className="text-slate-700">{timeline}</span>
              </div>
            )}
            {otherText && (
              <div className="pt-1.5 border-t border-slate-200 text-slate-700 whitespace-pre-wrap">
                {otherText}
              </div>
            )}
            {!scope && !otherText && (
              <p className="text-slate-600">The Service Provider agrees to deliver the professional services, deliverables, and specifications as detailed in the linked proposal and negotiation scope.</p>
            )}
          </div>
        </div>

        {/* Standard Clauses */}
        <div className="my-4 text-[10.5px] text-slate-600 space-y-1 leading-relaxed">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
            3. Standard Terms & Conditions
          </h3>
          <p>• <span className="font-bold text-slate-800">Performance & Standards:</span> The Service Provider covenants to perform the contracted scope with reasonable professional diligence and technical standards.</p>
          <p>• <span className="font-bold text-slate-800">Payment Terms:</span> The Client agrees to make payments in {contract.currency || 'USD'} as per agreed invoice disbursements and milestones.</p>
          <p>• <span className="font-bold text-slate-800">Confidentiality:</span> Both parties undertake to protect proprietary technical, financial, and operational information exchanged in connection with this agreement.</p>
          <p>• <span className="font-bold text-slate-800">Binding Effect:</span> This document represents the binding understanding between the parties regarding the subject matter.</p>
        </div>

        {/* Signatures & Execution Block */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 break-inside-avoid">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                For First Party ({bizName})
              </p>
              <div className="h-12 border-b border-slate-400"></div>
              <div className="text-xs text-slate-700 space-y-0.5">
                <p><span className="font-bold">Authorized Signatory:</span> {bizName}</p>
                <p><span className="font-bold">Designation:</span> Executive Officer</p>
                <p><span className="font-bold">Date:</span> _________________________________</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                For Second Party ({clientName})
              </p>
              <div className="h-12 border-b border-slate-400"></div>
              <div className="text-xs text-slate-700 space-y-0.5">
                <p><span className="font-bold">Authorized Signatory:</span> {clientName}</p>
                <p><span className="font-bold">Designation:</span> Authorized Representative</p>
                <p><span className="font-bold">Date:</span> _________________________________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Official Commercial Agreement • Generated via QueERP • Confidential Document
        </div>
      </div>
    </>
  );
}
