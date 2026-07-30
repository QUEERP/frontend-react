import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "QueErp gave us financial clarity within weeks. We went from messy spreadsheets to real-time insights without any operational downtime.",
      author: "Ahmed Al-Mansouri",
      role: "CEO",
      company: "BuildTech Solutions",
      initials: "AA",
    },
    {
      quote: "The automated compliance features saved us months of manual work. Everything is strictly audit-ready from day one, giving us total peace of mind.",
      author: "Fatima Al-Zaabi",
      role: "CFO",
      company: "CloudSync Systems",
      initials: "FA",
    },
    {
      quote: "Invoice automation alone has freed up 15 hours per week for our team. The return on investment on this platform was immediate and incredible.",
      author: "Mohammed Al-Kindi",
      role: "Finance Director",
      company: "DataFlow Inc",
      initials: "MK",
    },
  ];

  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-20 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight text-balance">
            Trusted by forward-thinking teams.
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            Don't just take our word for it. Here is what industry leaders are saying about their experience with QueErp.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div 
              key={idx} 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group relative bg-slate-50/50 hover:bg-white rounded-3xl border border-slate-100 p-10 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500"
            >
              {/* Background Quote Icon */}
              <Quote className="absolute top-8 right-8 w-16 h-16 text-slate-100 group-hover:text-blue-50 transition-colors duration-500 -z-0 rotate-12" />

              <div className="relative z-10">
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-slate-700 leading-relaxed font-medium mb-10">
                  "{testimonial.quote}"
                </p>
              </div>

              <div className="flex items-center gap-4 relative z-10 pt-6 border-t border-slate-100 group-hover:border-slate-200 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-inner">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}, <span className="text-slate-700 font-medium">{testimonial.company}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
