import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  Star,
  Sparkles,
  Mail,
  Building2,
  Phone,
  Globe,
  User,
  Loader2,
  ShieldCheck,
  Check,
  Send,
  Tag,
  MessageSquareText,
  ChevronDown,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_ROOT } from "@/config/api";

export default function Pricing() {
  // Modal states
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);
  const [isPriceInquiryOpen, setIsPriceInquiryOpen] = useState(false);

  // Contact Sales form state
  const [salesForm, setSalesForm] = useState({
    name: "",
    companyName: "",
    email: "",
    country: "",
    phone: "",
  });
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [salesSuccess, setSalesSuccess] = useState(false);

  // Price Inquiry form state
  const [priceForm, setPriceForm] = useState({
    name: "",
    email: "",
    companyName: "",
    companyEmail: "",
    phone: "",
    country: "",
  });
  const [priceSubmitting, setPriceSubmitting] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Plans data
  const plans = [
    {
      name: "Free",
      tagline: "90-Day All-Inclusive Trial",
      description: "Full access to all modules for 90 days. Zero setup fees or credit card required.",
      price: "$0",
      period: "for 90 days",
      highlighted: false,
      ctaText: "Start 90-Day Free Trial",
      ctaLink: "/register?trial=90",
      badgeText: "90 Days Free",
      trialLine: "90 Days Free Trial included",
      trialNotice: "Full 90 days trial • No credit card required",
      features: [
        "90 Days Full Access",
        "All Modules Included (CRM, Invoicing, Bills, Inventory, Accounting & HR)",
        "Up to 3 Users included",
        "Multi-currency & statutory tax engine",
        "Real-time dashboards & analytics",
        "Email support & cloud backup",
        "No credit card required",
      ],
    },
    {
      name: "Growth",
      tagline: "Complete ERP Power",
      description: "For growing businesses that need complete multi-user ERP power and automation.",
      price: "$7",
      period: "/ month per business",
      highlighted: true,
      ctaText: "Start Free Trial",
      ctaLink: "/register?plan=growth&trial=7",
      badgeText: "Most Popular",
      trialLine: "7 Days Free Trial included",
      trialNotice: "7 days free trial • Automatically deactivates unless subscribed",
      features: [
        "7 Days Free Trial included",
        "1 - 5 Users included",
        "All ERP modules & advanced workflows",
        "Automated invoicing & vendor billing",
        "Smart double-entry ledger & bank reconciliation",
        "Multi-warehouse inventory & tracking",
        "Priority support & automated backups",
        "100GB Secure cloud storage",
        "Unlimited transactions & clients",
      ],
    },
    {
      name: "Enterprise",
      tagline: "Custom Corporate Scale",
      description: "Custom solutions for large organizations, multiple branches, and dedicated infrastructure.",
      price: "Custom",
      period: "Tailored for your scale",
      highlighted: false,
      ctaText: "Contact Sales",
      isContactSales: true,
      badgeText: "Enterprise",
      features: [
        "Unlimited users & business entities",
        "Full automation & custom workflows",
        "Dedicated account manager & 24/7 support",
        "Custom API integrations & webhooks",
        "Advanced security & granular permissions",
        "Unlimited cloud storage",
        "Enterprise 99.9% SLA guarantee",
      ],
    },
  ];

  // Submit Contact Sales Form
  const handleContactSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salesForm.name.trim() || !salesForm.companyName.trim() || !salesForm.email.trim() || !salesForm.phone.trim() || !salesForm.country.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSalesSubmitting(true);
    try {
      const res = await fetch(`${API_ROOT}/contact-sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact_sales",
          ...salesForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit inquiry.");
      }

      setSalesSuccess(true);
      toast.success("Inquiry sent to our team at queerp@queinfotech.com!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSalesSubmitting(false);
    }
  };

  // Submit Price Inquiry Form
  const handlePriceInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!priceForm.name.trim() || !priceForm.email.trim() || !priceForm.companyName.trim() || !priceForm.companyEmail.trim() || !priceForm.phone.trim() || !priceForm.country.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setPriceSubmitting(true);
    try {
      const res = await fetch(`${API_ROOT}/contact-sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "price_inquiry",
          ...priceForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit price inquiry.");
      }

      setPriceSuccess(true);
      toast.success("Pricing details request sent to queerp@queinfotech.com!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setPriceSubmitting(false);
    }
  };

  const resetSalesModal = () => {
    setIsContactSalesOpen(false);
    setTimeout(() => {
      setSalesSuccess(false);
      setSalesForm({ name: "", companyName: "", email: "", country: "", phone: "" });
    }, 200);
  };

  const resetPriceModal = () => {
    setIsPriceInquiryOpen(false);
    setTimeout(() => {
      setPriceSuccess(false);
      setPriceForm({ name: "", email: "", companyName: "", companyEmail: "", phone: "", country: "" });
    }, 200);
  };

  return (
    <section id="pricing" className="py-28 px-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-bold tracking-wide uppercase mb-2 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Pricing Plans
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Transparent</span> Pricing
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            No hidden fees. No surprises. Start free with full module access and scale smoothly as your business grows.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              whileHover={{ y: -10, transition: { duration: 0.25, ease: "easeOut" } }}
              className={cn(
                "relative rounded-[2rem] border transition-all duration-300 overflow-hidden group flex flex-col bg-white",
                "hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 hover:shadow-[0_24px_50px_-12px_rgba(37,99,235,0.22)]",
                plan.highlighted
                  ? "border-blue-400/80 shadow-[0_16px_40px_-15px_rgba(37,99,235,0.2)] ring-1 ring-blue-500/20"
                  : "border-slate-200 shadow-sm"
              )}
            >
              <div
                className={cn(
                  "absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-opacity duration-300",
                  plan.highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              />

              <div className="p-8 lg:p-10 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                      {plan.badgeText && (
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                            plan.highlighted
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {plan.badgeText}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{plan.tagline}</p>
                  </div>
                  {plan.highlighted && (
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shadow-xs">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-500 leading-relaxed mb-6 min-h-[42px]">{plan.description}</p>

                {/* Price Display */}
                <div className="flex flex-col gap-1.5 mb-8 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight text-slate-900">
                      {plan.price}
                    </span>
                    <span className="font-semibold text-slate-500 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  {plan.trialLine && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-200/80 px-2.5 py-1 rounded-lg w-fit shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{plan.trialLine}</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div>
                  {plan.isContactSales ? (
                    <button
                      type="button"
                      onClick={() => setIsContactSalesOpen(true)}
                      className="w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)]"
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <Link
                      to={plan.ctaLink || "/register"}
                      className="w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)]"
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  )}
                  {plan.trialNotice && (
                    <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
                      {plan.trialNotice}
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="mt-8 space-y-3.5 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "rounded-full p-1 mt-0.5 shrink-0",
                          plan.highlighted ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-emerald-600"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium leading-tight",
                          plan.highlighted ? "text-slate-800" : "text-slate-600"
                        )}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ATTRACTIVE BELOW-CARD SECTION: 20% OFF TAG & PRICE CONNECT BUTTON */}
        <motion.div
          className="mt-14 max-w-4xl mx-auto flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Attractive Annually 20% Off Tag */}
          <div className="relative group w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-white via-emerald-50/40 to-white rounded-2xl border border-emerald-200 shadow-md">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white tracking-wider uppercase shadow-xs">
                      🔥 Annually 20% OFF
                    </span>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Save Big on Annual Subscriptions
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    Commit annually and instantly receive <strong>20% off</strong> on all business licenses, plus priority onboarding assistance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceInquiryOpen(true)}
                className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide uppercase transition-all shadow-sm cursor-pointer hover:shadow-md"
              >
                Claim 20% Discount
              </button>
            </div>
          </div>

          {/* Attractive Button: "For More details of Price connect with team" */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button
              type="button"
              onClick={() => setIsPriceInquiryOpen(true)}
              className="relative group px-8 py-4 rounded-2xl cursor-pointer font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden w-full sm:w-auto"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-300 group-hover:opacity-95" />
              {/* Animated shimmer */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />

              <div className="relative flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="text-base tracking-tight font-extrabold">
                  For More Details of Price, Connect with Team
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CONTACT SALES (Enterprise Card) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isContactSalesOpen} onOpenChange={setIsContactSalesOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 bg-white p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Enterprise Consultation
              </span>
            </div>
            <DialogTitle className="text-2xl font-black text-white">Contact Sales Team</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm mt-1">
              Speak with our enterprise solutions architect to build a custom ERP plan for your organization.
            </DialogDescription>
          </div>

          {salesSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Inquiry Received!</h4>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong>{salesForm.name}</strong>. Your enterprise consultation request has been delivered to our management team at <strong>queerp@queinfotech.com</strong>.
              </p>
              <p className="text-xs text-slate-500">
                A confirmation copy has been sent to <strong>{salesForm.email}</strong>. Our enterprise solutions team will contact you shortly.
              </p>
              <Button onClick={resetSalesModal} className="w-full mt-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleContactSalesSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sales-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="sales-name"
                    required
                    placeholder="e.g. Alexander Vance"
                    value={salesForm.name}
                    onChange={(e) => setSalesForm({ ...salesForm, name: e.target.value })}
                    className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sales-company" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Company Name <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="sales-company"
                    required
                    placeholder="e.g. Vance Trading LLC"
                    value={salesForm.companyName}
                    onChange={(e) => setSalesForm({ ...salesForm, companyName: e.target.value })}
                    className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sales-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="sales-email"
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={salesForm.email}
                    onChange={(e) => setSalesForm({ ...salesForm, email: e.target.value })}
                    className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sales-country" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Country <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="sales-country"
                      required
                      value={salesForm.country}
                      onChange={(e) => setSalesForm({ ...salesForm, country: e.target.value })}
                      className="w-full pl-9 pr-8 h-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-all hover:border-slate-300"
                    >
                      <option value="" disabled>Select Country</option>
                      <optgroup label="Popular Countries">
                        <option value="India">India</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Singapore">Singapore</option>
                      </optgroup>
                      <optgroup label="All Countries (A-Z)">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sales-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone Number <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="sales-phone"
                      type="tel"
                      required
                      placeholder="+971 50 123 4567"
                      value={salesForm.phone}
                      onChange={(e) => setSalesForm({ ...salesForm, phone: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={salesSubmitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-md cursor-pointer"
                >
                  {salesSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending to Sales Team...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Sales Inquiry
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Notification will be sent directly to <strong>queerp@queinfotech.com</strong>
                </p>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: FOR MORE DETAILS OF PRICE CONNECT WITH TEAM */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isPriceInquiryOpen} onOpenChange={setIsPriceInquiryOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-slate-200 bg-white p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Custom Pricing Consultation
              </span>
            </div>
            <DialogTitle className="text-2xl font-black text-white">
              Connect with Pricing Team
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Provide your organization details below and our team will get in touch with detailed customized quotation, multi-currency options, and annual savings.
            </DialogDescription>
          </div>

          {priceSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Request Delivered!</h4>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong>{priceForm.name}</strong>. Your pricing inquiry for <strong>{priceForm.companyName}</strong> has been forwarded to our corporate pricing desk at <strong>queerp@queinfotech.com</strong>.
              </p>
              <p className="text-xs text-slate-500">
                A confirmation copy has been sent to <strong>{priceForm.email}</strong>. Our pricing team will review your requirements and reach out shortly.
              </p>
              <Button onClick={resetPriceModal} className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePriceInquirySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="price-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contact Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="price-name"
                      required
                      placeholder="e.g. John Doe"
                      value={priceForm.name}
                      onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Primary Email <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="price-email"
                      type="email"
                      required
                      placeholder="john@company.com"
                      value={priceForm.email}
                      onChange={(e) => setPriceForm({ ...priceForm, email: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="price-company" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Company Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="price-company"
                      required
                      placeholder="e.g. Acme Global Industries"
                      value={priceForm.companyName}
                      onChange={(e) => setPriceForm({ ...priceForm, companyName: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price-comp-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Company Email <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="price-comp-email"
                      type="email"
                      required
                      placeholder="info@acmeglobal.com"
                      value={priceForm.companyEmail}
                      onChange={(e) => setPriceForm({ ...priceForm, companyEmail: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="price-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone Number <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="price-phone"
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={priceForm.phone}
                      onChange={(e) => setPriceForm({ ...priceForm, phone: e.target.value })}
                      className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price-country" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Country <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="price-country"
                      required
                      value={priceForm.country}
                      onChange={(e) => setPriceForm({ ...priceForm, country: e.target.value })}
                      className="w-full pl-9 pr-8 h-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-all hover:border-slate-300"
                    >
                      <option value="" disabled>Select Country</option>
                      <optgroup label="Popular Countries">
                        <option value="India">India</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Singapore">Singapore</option>
                      </optgroup>
                      <optgroup label="All Countries (A-Z)">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={priceSubmitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold gap-2 shadow-md cursor-pointer"
                >
                  {priceSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting with Team...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Connect with Pricing Team
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  All requests dispatched directly to <strong>queerp@queinfotech.com</strong>
                </p>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
