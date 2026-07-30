import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Subtle Background Grid for the white theme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative rounded-[3rem] overflow-hidden bg-blue-600 shadow-[0_20px_80px_-15px_rgba(37,99,235,0.4)] border border-blue-500/20"
        >
          {/* Abstract geometric background elements inside the CTA (Light Blue theme touches) */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-blue-400/40 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-sky-400/30 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 p-12 md:p-20 lg:p-24 text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold tracking-wide uppercase mb-8 backdrop-blur-md shadow-inner"
            >
              <Sparkles className="w-4 h-4 text-sky-300" />
              Get Started Today
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tight text-balance mb-6">
              Ready to transform your financial workflow?
            </h2>

            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
              Join hundreds of businesses across the UAE who are already gaining absolute clarity and control over their finances with QueErp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full cursor-pointer group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] shadow-lg overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>

              <Link to="/demo" className="w-full sm:w-auto">
                <button className="w-full cursor-pointer px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-lg transition-all duration-300 backdrop-blur-md">
                  Schedule Demo
                </button>
              </Link>
            </div>

            <p className="text-sm text-blue-200 mt-8 font-medium">
              Setup takes less than 5 minutes. No credit card required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
