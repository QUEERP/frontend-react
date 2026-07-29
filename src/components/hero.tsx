import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Play, ShieldCheck, Banknote, Server, Users } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-slate-50">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] w-[60%] h-[40%] rounded-full bg-slate-300/20 blur-[100px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Que-ERP is now live in UAE
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 text-balance">
                Know Exactly Where Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Money Moves.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg font-light">
                QueErp is a modern cloud accounting platform designed to give growing businesses
                real-time financial visibility, automated records, and enterprise-grade security.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
              <Link to="/register" className="w-full sm:w-auto">
                <Button className="w-full cursor-pointer sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:-translate-y-1 font-medium text-lg h-14 px-8 rounded-full transition-all duration-300 group flex items-center justify-center gap-2">
                  Start Free Trial
                  <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full cursor-pointer sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-lg h-14 px-8 rounded-full transition-all duration-300 group flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <Play className="w-3 h-3 ml-0.5" />
                </div>
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div className="flex flex-wrap gap-3 pt-6" variants={itemVariants}>
              {[
                { icon: ShieldCheck, label: 'UAE Compliant' },
                { icon: Banknote, label: 'Bank-Level Security' },
                { icon: Server, label: 'Cloud Hosted' },
                { icon: Users, label: 'Multi-Tenant' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-700 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                  <item.icon className="w-4 h-4 text-blue-600" />
                  {item.label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Dashboard Preview */}
          <motion.div
            className="relative lg:ml-10 mt-10 lg:mt-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-20 animate-pulse" />

            <motion.div
              variants={cardVariants}
              className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

              <div className="space-y-8 relative z-10">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Financial Overview</h3>
                      <p className="text-sm text-slate-500 font-medium">Live Dashboard</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                {/* Cards Row */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        +12%
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">AED 847.5k</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-slate-500 font-medium">Outstanding</p>
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                        12 inv
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">AED 142.3k</p>
                  </motion.div>
                </div>

                {/* Simple Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-900 font-bold">Cash Flow</p>
                    <p className="text-xs text-slate-500 font-medium">Last 30 Days</p>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-24 pt-4">
                    {[40, 65, 45, 90, 70, 85, 100].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                        className="w-full relative group cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-blue-100 rounded-t-sm group-hover:bg-blue-200 transition-colors" />
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-sm"
                          style={{ height: `${height * 0.7}%` }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
                  <p className="text-sm text-slate-900 font-bold">Recent Transactions</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Client A Invoice', amount: '+AED 25,000', status: 'Paid', iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
                      { name: 'Service Payment', amount: '-AED 5,200', status: 'Pending', iconClass: 'text-amber-500', bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
                      { name: 'Subscription Renewal', amount: '+AED 12,500', status: 'Paid', iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
                    ].map((tx, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${tx.bgClass} flex items-center justify-center`}>
                            <CheckCircle2 className={`w-5 h-5 ${tx.iconClass}`} />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 block">{tx.name}</span>
                            <span className={`text-xs font-medium ${tx.textClass}`}>{tx.status}</span>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900">{tx.amount}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
