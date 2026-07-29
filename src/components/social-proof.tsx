import { motion } from 'framer-motion';
import { Cloud, Database, Cpu, Code, Globe, Shield, Zap, Layers } from 'lucide-react';

export default function SocialProof() {
  const companies = [
    { name: 'Acme Corp', icon: Cloud },
    { name: 'BuildTech', icon: Database },
    { name: 'CloudSync', icon: Globe },
    { name: 'DataFlow', icon: Cpu },
    { name: 'ElevateAI', icon: Zap },
    { name: 'FutureScale', icon: Layers },
    { name: 'SecureCore', icon: Shield },
    { name: 'DevWorks', icon: Code },
  ];

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
      {/* Background gradients for fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 mb-10 relative z-20">
        <p className="text-center text-sm font-semibold tracking-wider text-slate-500 uppercase">
          Trusted by fast-growing companies in the UAE and beyond
        </p>
      </div>

      <div className="relative flex overflow-hidden group">
        <motion.div
          className="flex whitespace-nowrap shrink-0"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 30, repeat: Infinity }}
        >
          {/* We duplicate the array to create a seamless infinite loop */}
          {[...companies, ...companies].map((company, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center gap-3 px-12 mx-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:border-blue-200 hover:shadow-md">
                <company.icon className="w-6 h-6 text-slate-700 hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight hover:text-slate-900">
                {company.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
