import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate  } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { Info, Rocket } from 'lucide-react';

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('IN');
  const [businessType, setBusinessType] = useState('Construction');
  const [countries, setCountries] = useState<{code: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002';

  const CURRENCY_SYMBOLS: Record<string, string> = {
    'IN': '₹', 'AE': 'د.إ', 'US': '$', 'GB': '£', 'AU': 'A$', 'CA': 'C$', 'SG': 'S$',
    'DE': '€', 'FR': '€', 'IT': '€', 'ES': '€', 'NL': '€', 'AT': '€', 'BE': '€',
    'FI': '€', 'IE': '€', 'PT': '€', 'GR': '€', 'CY': '€', 'MT': '€', 'SI': '€',
    'SK': '€', 'EE': '€', 'LV': '€', 'LT': '€', 'SA': '﷼', 'ZA': 'R', 'NZ': 'NZ$',
    'CH': 'CHF', 'SE': 'kr', 'NO': 'kr', 'DK': 'kr', 'PL': 'zł', 'HU': 'Ft', 'CZ': 'Kč',
    'RO': 'lei', 'BG': 'лв', 'HR': '€', 'RU': '₽', 'TR': '₺', 'BR': 'R$', 'MX': '$',
    'AR': '$', 'CL': '$', 'CO': '$', 'PE': 'S/', 'VE': 'Bs.', 'JP': '¥', 'CN': '¥',
    'KR': '₩', 'ID': 'Rp', 'MY': 'RM', 'PH': '₱', 'TH': '฿', 'VN': '₫', 'PK': 'Rs',
    'BD': '৳', 'LK': 'Rs', 'NG': '₦', 'EG': 'E£', 'KE': 'KSh', 'GH': 'GH₵', 'MA': 'د.م.',
  };

  React.useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/countries`);
        const data = await res.json();
        if (data.success && data.data) {
          setCountries(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };
    fetchCountries();
  }, [API_BASE]);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  };

  const setCookie = (name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }

    const token = getCookie('token');
    if (!token) {
      toast.error('You must be logged in to create a business.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/business/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: businessName.trim(), country, businessType }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const message = data?.message || 'Failed to create business';
        toast.error(message);
        setIsLoading(false);
        return;
      }

      const created = data.data;
      const newBusinessId: string = created?.id || created?.businessId;
      if (!newBusinessId) {
        toast.error('Unable to determine new business id.');
        setIsLoading(false);
        return;
      }

      // Persist helpful UI info
      try {
        localStorage.setItem('businessName', businessName.trim());
      } catch { }

      // Set activeBusinessId cookie for routing
      setCookie('activeBusinessId', newBusinessId);
      toast.success('Business created successfully');
      navigate(`/dashboard/${encodeURIComponent(newBusinessId)}`);
    } catch (err) {
      toast.error('Something went wrong while creating business.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white w-full flex">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-white">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <motion.div
          className="w-full max-w-[440px] relative z-10"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Logo */}
          <Link to="/" className="inline-block mb-12 transition-transform hover:scale-105">
            <img src="/que-logo.png" alt="QueErp" width={660} height={180} className="h-9 w-auto"  />
          </Link>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Create Your Business</h1>
            <p className="text-slate-500 font-medium text-lg">Tell us your business name to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Acme Inc."
                className={`w-full px-5 py-4 rounded-xl border ${error ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                  } bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium`}
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-1.5 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Business Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium max-h-48`}
              >
                {countries.length > 0 ? (
                  countries.map(c => (
                    <option key={c.code} value={c.code}>{c.code === 'AE' ? 'UAE' : c.name} {CURRENCY_SYMBOLS[c.code] ? `(${CURRENCY_SYMBOLS[c.code]})` : ''}</option>
                  ))
                ) : (
                  <>
                    <option value="IN">India (₹)</option>
                    <option value="AE">UAE (د.إ)</option>
                  </>
                )}
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium`}
              >
                <option value="Construction">Construction</option>
                <option value="Other">Other</option>
              </select>
            </motion.div>

            {/* Info Text */}
            <motion.div
              className="flex items-start gap-3 bg-blue-50/80 border border-blue-100 p-4 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-blue-800 leading-relaxed">
                You can update this later in your business settings. Let&apos;s get your financial dashboard ready!
              </p>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 cursor-pointer text-white hover:bg-blue-700 font-bold py-6 rounded-xl transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
              >
                {isLoading ? 'Creating...' : 'Create Business'}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            className="mt-10 text-sm font-medium text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Want to sign out?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Go back to sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right: Premium Visual Side */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden bg-blue-600">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-400/20 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/30 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

        {/* Decorative Grid Light */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-lg"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.2 }}
        >
          <div className="mb-10 text-blue-200">
            <Rocket className="w-16 h-16 opacity-50" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Let&apos;s get down to business.
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            You&apos;re just one step away. Set up your organization to unlock real-time financial insights, generate invoices, and collaborate with your team.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
