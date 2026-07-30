import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small businesses just starting out.",
      monthlyPrice: 99,
      features: [
        "Up to 3 users",
        "Basic invoicing",
        "Manual ledger entries",
        "Monthly reports",
        "Email support",
        "5GB Cloud storage",
      ],
    },
    {
      name: "Growth",
      description: "For growing businesses that need more power.",
      monthlyPrice: 299,
      highlighted: true,
      features: [
        "Up to 10 users",
        "Invoice automation",
        "Smart ledger system",
        "Real-time dashboard",
        "Advanced analytics",
        "Priority support",
        "100GB Cloud storage",
        "Payment tracking",
      ],
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations.",
      monthlyPrice: "Custom",
      features: [
        "Unlimited users",
        "Full automation",
        "Custom workflows",
        "API access",
        "Advanced security",
        "24/7 dedicated support",
        "Unlimited storage",
        "SLA guarantee",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Pricing Plans
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Transparent</span> Pricing
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            No hidden fees. No surprises. Choose the perfect plan for your business and scale as you grow.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative flex items-center p-1.5 bg-slate-200/50 rounded-full border border-slate-200 backdrop-blur-md">
            {/* Animated Slider Background using pure framer-motion */}
            <div className="absolute inset-y-1.5 inset-x-1.5 flex pointer-events-none">
              <div className="w-1/2 h-full relative">
                {!isAnnual && (
                  <motion.div layoutId="pricing-slider-light" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </div>
              <div className="w-1/2 h-full relative">
                {isAnnual && (
                  <motion.div layoutId="pricing-slider-light" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </div>
            </div>

            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "relative z-10 px-8 py-3 cursor-pointer rounded-full text-sm font-bold transition-colors duration-300 w-40",
                !isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "relative z-10 px-6 py-3 cursor-pointer rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center w-45",
                isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Annually
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-black transition-colors duration-300",
                isAnnual ? "bg-emerald-100 text-emerald-700" : "bg-slate-300 text-slate-500"
              )}>
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
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
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={cn(
                "relative rounded-[2rem] border transition-all duration-500 overflow-hidden group flex flex-col bg-white",
                plan.highlighted
                  ? "border-blue-200 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)] md:-translate-y-4"
                  : "border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300"
              )}
            >
              {plan.highlighted && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              )}

              <div className="p-8 lg:p-10 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{plan.description}</p>
                  </div>
                  {plan.highlighted && (
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-8 mt-auto pt-6">
                  {typeof plan.monthlyPrice === "number" ? (
                    <>
                      <span className="text-5xl font-black tracking-tight text-slate-900">
                        <span className="text-2xl text-slate-400 font-medium mr-1">AED</span>
                        {isAnnual ? Math.floor(plan.monthlyPrice * 12 * 0.8) : plan.monthlyPrice}
                      </span>
                      <span className="font-medium text-slate-500">
                        /{isAnnual ? "yr" : "mo"}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-black tracking-tight text-slate-900">
                      {plan.monthlyPrice}
                    </span>
                  )}
                </div>

                <Link to="/register"
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn",
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.3)]"
                      : "bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {typeof plan.monthlyPrice === "number" ? "Start Free Trial" : "Contact Sales"}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                <div className="mt-10 space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-full p-1",
                        plan.highlighted ? "bg-blue-50" : "bg-slate-50"
                      )}>
                        <CheckCircle2 className={cn("w-4 h-4 shrink-0", plan.highlighted ? "text-blue-600" : "text-slate-400")} />
                      </div>
                      <span className={cn("text-sm font-medium", plan.highlighted ? "text-slate-700" : "text-slate-600")}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-center mt-16 text-slate-500 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          All plans include a 14-day free trial. <span className="font-bold text-slate-700">No credit card required.</span> Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
