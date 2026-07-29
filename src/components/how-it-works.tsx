import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Create Your Business",
      description: "Sign up and set up your business profile with essential financial information in minutes.",
      icon: Building2,
      color: "text-sky-500",
      bg: "bg-sky-50",
      border: "border-sky-200",
      numberBg: "bg-sky-500"
    },
    {
      number: "2",
      title: "Manage Invoices",
      description: "Add customers, create professional invoices, and automate your entire billing workflow.",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      numberBg: "bg-blue-500"
    },
    {
      number: "3",
      title: "Track Every Dirham",
      description: "Monitor every transaction, payment, and expense in real-time with comprehensive reports.",
      icon: TrendingUp,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      numberBg: "bg-indigo-500"
    },
  ];

  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Light Blue Decorative background blurs */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none translate-x-1/3" />

      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-24 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Onboarding
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Effortless</span> Setup
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Get up and running with QueErp in minutes, not hours. Our streamlined onboarding gets you to value instantly.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-slate-100 rounded-full">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              style={{ originX: 0 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx} 
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + idx * 0.2 }}
              >
                {/* Step Icon Node */}
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-8 relative z-10 bg-white border-4 shadow-xl shadow-blue-900/5 transition-transform duration-500 group-hover:scale-110",
                    step.border
                  )}>
                    <div className={cn("absolute inset-0 rounded-full opacity-30", step.bg)} />
                    <step.icon className={cn("w-10 h-10", step.color)} />
                    
                    {/* Floating Step Number */}
                    <div className={cn(
                      "absolute -top-3 -right-3 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-lg",
                      step.numberBg
                    )}>
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:-translate-y-1 group">
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-slate-500 font-medium">No credit card required. Setup takes 2 minutes.</p>
        </motion.div>
      </div>
    </section>
  );
}
