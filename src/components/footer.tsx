
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Security", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
    Security: [
      { label: "Data Protection", href: "#" },
      { label: "Compliance", href: "#" },
      { label: "Certifications", href: "#" },
      { label: "Penetration Testing", href: "#" },
    ],
    Compliance: [
      { label: "UAE Regulations", href: "#" },
      { label: "GDPR", href: "#" },
      { label: "Audit Reports", href: "#" },
      { label: "Data Residency", href: "#" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Data Protection", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 relative overflow-hidden">
      {/* Subtle decorative background blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-12 mb-16">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-bold text-slate-900 text-sm mb-6 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} 
                      className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-6">
            <Link to="/" className="inline-block">
              <img
                src="/que-logo.png"
                alt="QueErp"
                width={660}
                height={180}
                className="h-10 w-auto object-contain"
                
              />
            </Link>
            <p className="text-sm text-slate-500 max-w-sm text-center md:text-left font-medium leading-relaxed">
              Built with security and regulatory readiness in mind. QueErp is your trusted partner for modern financial management.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-400">
              © {new Date().getFullYear()} QueErp. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
