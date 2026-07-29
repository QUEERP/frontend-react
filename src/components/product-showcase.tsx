
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp } from "lucide-react";

export default function ProductShowcase() {
  return (
    <section className="py-32 px-6 bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Dark */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
            Platform Interface
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
            Dashboard Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Precision.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Intuitive, powerful, and built specifically for modern financial management. Experience absolute control over your ledger.
          </p>
        </motion.div>

        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Main Dashboard Container */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_0_100px_rgba(37,99,235,0.15)] overflow-hidden">

            {/* macOS styled window header */}
            <div className="h-12 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center px-4 gap-2 relative z-10">
              <div className="flex gap-2 w-16">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-slate-950/50 text-slate-400 text-xs font-medium border border-slate-800 flex items-center gap-2 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                erp.queinfotech.com
              </div>
            </div>

            {/* Dashboard Image */}
            <div className="relative w-full bg-slate-950">
              <img
                src="/dashboard-preview.png"
                alt="QueErp dashboard preview"
                width={1920}
                height={1080}
                className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity duration-500"
                
              />
            </div>
          </div>

          {/* Floating UI Elements (Parallax effect) */}
          <motion.div
            className="absolute -top-6 -right-6 lg:-right-12 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4 z-20"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">Revenue Up</p>
              <p className="text-xl font-black text-slate-900">+14.5%</p>
            </div>
          </motion.div>

          <motion.div
            className="absolute -bottom-6 -left-6 lg:-left-12 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4 z-20"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">Reconciliation</p>
              <p className="text-xl font-black text-slate-900">Completed</p>
            </div>
          </motion.div>

        </motion.div>

        <motion.p
          className="text-center text-sm text-slate-500 mt-20 font-medium tracking-widest uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Designed for uncompromising financial precision
        </motion.p>
      </div>
    </section>
  );
}
