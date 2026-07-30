
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('/signin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const checkAuth = () => {
      if (typeof document === 'undefined') return;
      const cookies = document.cookie.split('; ');
      const token = cookies.find(row => row.startsWith('token='))?.split('=')[1];
      if (token) {
        setIsLoggedIn(true);
        const businessId = cookies.find(row => row.startsWith('activeBusinessId='))?.split('=')[1];
        if (businessId) {
          setDashboardUrl(`/dashboard/${decodeURIComponent(businessId)}`);
        } else {
          setDashboardUrl('/create-business');
        }
      }
    };
    checkAuth();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Compliance', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Customers', href: '#customers' },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          isScrolled
            ? "top-4 px-4 sm:px-6"
            : "top-0 px-6 sm:px-8 py-4"
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between transition-all duration-500",
            isScrolled
              ? "max-w-5xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full py-2 px-6"
              : "max-w-7xl bg-transparent py-2"
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 relative z-50 group">
            <div className="relative overflow-hidden">
              <img
                src="/que-logo.png"
                alt="QueErp"
                width={660}
                height={180}
                className="h-9 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                
              />
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 rounded-full hover:bg-blue-50/50 group"
              >
                {link.label}
                <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 relative z-50">
            {isLoggedIn ? (
              <Link to={dashboardUrl}>
                <Button className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 font-medium px-6 rounded-full transition-all duration-300 ease-out group flex items-center gap-2">
                  Open Dashboard
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <Button className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 font-medium px-6 rounded-full transition-all duration-300 ease-out group flex items-center gap-2">
                    Start Free Trial
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden relative z-50 p-2 text-slate-600 hover:text-blue-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-white/95 backdrop-blur-2xl z-40 flex flex-col pt-32 px-6 md:hidden transition-all duration-500 ease-in-out",
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-4 transition-all duration-500 delay-100",
            isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          {navLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between text-2xl font-medium text-slate-800 hover:text-blue-600 transition-colors py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ transitionDelay: `${150 + index * 50}ms` }}
            >
              {link.label}
              <ChevronRight className="w-5 h-5 opacity-50" />
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-8">
            {isLoggedIn ? (
              <Link to={dashboardUrl} onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 font-medium py-7 text-lg rounded-2xl transition-all">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin"
                  className="w-full py-4 text-center text-lg font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 font-medium py-7 text-lg rounded-2xl transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
