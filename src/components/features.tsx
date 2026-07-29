import { motion } from "framer-motion";
import { LineChart, BookOpen, Receipt, Wallet, ShieldCheck, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Features() {
  const features = [
    {
      icon: LineChart,
      title: "Real-Time Dashboard",
      description: "See your entire financial picture at a glance with live updates, comprehensive analytics, and customizable widgets.",
      color: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Smart Ledger System",
      description: "Automated double-entry bookkeeping with intelligent categorization, automatic tagging, and easy reconciliation.",
      color: "from-indigo-500 to-purple-500",
      bgLight: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      icon: Receipt,
      title: "Invoice Automation",
      description: "Create, send, and track professional invoices automatically with intelligent follow-ups and payment reminders.",
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: Wallet,
      title: "Payment Tracking",
      description: "Monitor all incoming and outgoing payments with complete transaction history, receipt scanning, and clear insights.",
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Access",
      description: "Granular permissions and customizable workflows to manage who can view, edit, and approve critical financial operations.",
      color: "from-rose-500 to-red-500",
      bgLight: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      icon: History,
      title: "Audit & Traceability",
      description: "Complete immutable audit trails of all financial activities with exportable regulatory compliance documentation.",
      color: "from-slate-500 to-gray-500",
      bgLight: "bg-slate-100",
      iconColor: "text-slate-700",
    },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-bold tracking-wide uppercase mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Core Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Powerful Features for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Modern Finance</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Everything you need to manage your business finances with confidence, speed, and absolute precision.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
              }}
              whileHover={{ y: -5 }}
              className="group relative bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-slate-100"
            >
              {/* Gradient glow on hover */}
              <div className={cn(
                "absolute top-0 right-0 w-48 h-48 opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none bg-gradient-to-br",
                feature.color
              )} />
              
              <div className="relative z-10">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm",
                  feature.bgLight
                )}>
                  <feature.icon className={cn("w-8 h-8", feature.iconColor)} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>

              {/* Bottom decorative line that fills on hover */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r group-hover:w-full transition-all duration-500 ease-out" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
