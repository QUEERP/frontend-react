import { motion } from "framer-motion";
import { ShieldCheck, Lock, Key, Fingerprint, FileSearch, Server, Shield, CheckCircle2, Cloud, Database, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Security() {
  const securityFeatures = [
    { badge: "UAE Ready", description: "Regulatory aligned infrastructure for UAE compliance", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50", dotBg: "bg-blue-500" },
    { badge: "GDPR Principles", description: "Privacy-first approach with data protection standards", icon: Lock, color: "text-sky-600", bg: "bg-sky-50", dotBg: "bg-sky-500" },
    { badge: "Encrypted Data", description: "End-to-end encryption at rest and in transit", icon: Key, color: "text-indigo-600", bg: "bg-indigo-50", dotBg: "bg-indigo-500" },
    { badge: "Secure Access", description: "Multi-factor authentication and session management", icon: Fingerprint, color: "text-cyan-600", bg: "bg-cyan-50", dotBg: "bg-cyan-500" },
    { badge: "Audit Ready", description: "Complete audit trails for regulatory inspection", icon: FileSearch, color: "text-blue-600", bg: "bg-blue-50", dotBg: "bg-blue-500" },
    { badge: "Data Residency", description: "Data stored in secure, compliant cloud regions", icon: Server, color: "text-sky-600", bg: "bg-sky-50", dotBg: "bg-sky-500" },
  ];

  return (
    <section id="security" className="py-32 px-6 bg-slate-50 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-100/50 blur-[100px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3" />

      {/* Grid Pattern Light */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
            <Shield className="w-4 h-4 text-blue-600" />
            Enterprise-Grade
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Built for Security. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Designed for Compliance.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Enterprise-grade security and strict regulatory compliance are built deeply into every layer of QueErp's architecture.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(37,99,235,0.08)] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", feature.bg)}>
                  <feature.icon className={cn("w-7 h-7", feature.color)} />
                </div>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full flex items-center gap-2 shadow-sm">
                  <div className={cn("w-2 h-2 rounded-full", feature.dotBg)} />
                  {feature.badge}
                </div>
              </div>
              
              <p className="text-slate-600 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Security Architecture */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative bg-white rounded-[2.5rem] border border-blue-100 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.1)] p-8 md:p-12 overflow-hidden"
        >
          {/* Internal Top Gradient Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400" />
          
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Security Architecture
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Column 1 */}
            <div className="space-y-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Infrastructure</p>
              </div>
              <ul className="space-y-4">
                {["Cloud-native architecture", "Redundant data centers", "Automated failover", "DDoS protection"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium group cursor-default">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="group-hover:text-blue-700 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm">
                  <Key className="w-6 h-6 text-sky-600" />
                </div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Data Protection</p>
              </div>
              <ul className="space-y-4">
                {["AES-256 encryption", "TLS 1.3 in transit", "Regular backups", "Data isolation"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium group cursor-default">
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <span className="group-hover:text-sky-700 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Compliance</p>
              </div>
              <ul className="space-y-4">
                {["UAE regulatory ready", "GDPR compliant", "Regular audits", "Penetration testing"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium group cursor-default">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="group-hover:text-indigo-700 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
