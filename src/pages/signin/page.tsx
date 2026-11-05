import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Quote, Eye, EyeOff } from 'lucide-react';
import { setCookie, clearCookie } from '@/lib/utils';
import { clearAuthSession } from '@/lib/auth';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Handle logout message or incoming from email without force-redirecting away
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isLoggedOut = params.get('logged_out') === 'true';
    const isFromEmail = params.get('from_email') === 'true';

    // In all cases on /signin, cleanly wipe any prior user's stale auth session
    clearAuthSession();

    if (isLoggedOut) {
      toast.success('Logged out successfully');
      window.history.replaceState({}, '', '/signin');
    } else if (isFromEmail) {
      const emailParam = params.get('email');
      if (emailParam) {
        try {
          setEmail(decodeURIComponent(emailParam));
        } catch {
          setEmail(emailParam);
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const message = data?.message || 'Login failed';
        toast.error(message);
        setIsLoading(false);
        return;
      }

      const token: string = data.token;
      setCookie('token', token, 7);

      // Check if user is Subscription Admin / Super Admin
      const isSubAdmin =
        Boolean(data.isSubscriptionAdmin) ||
        data.role === 'SUPER_ADMIN' ||
        data.user?.role === 'SUPER_ADMIN' ||
        data.user?.isSubscriptionAdmin === true ||
        email.trim().toLowerCase() === 'admin@admin.com';

      if (isSubAdmin) {
        setCookie('isSubscriptionAdmin', 'true', 7);
        setCookie('userRole', 'SUPER_ADMIN', 7);
        clearCookie('activeBusinessId');
        toast.success('Welcome back, Subscription Administrator');
        navigate('/admin');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const targetBusinessId = params.get('businessId');

      const businesses: Array<{ businessId: string }> = Array.isArray(data.businesses) ? data.businesses : [];

      // If user came with a specific businessId from email, check if it belongs to them
      const matched = targetBusinessId && businesses.find((b) => String(b.businessId) === String(targetBusinessId));
      const activeBusinessId = matched ? String(matched.businessId) : (businesses[0]?.businessId ? String(businesses[0].businessId) : null);

      if (activeBusinessId) {
        setCookie('activeBusinessId', activeBusinessId, 7);
        clearCookie('isSubscriptionAdmin');
        clearCookie('userRole');
        toast.success('Logged in successfully');
        navigate(`/dashboard/${encodeURIComponent(activeBusinessId)}`);
      } else {
        // No businesses yet
        clearCookie('activeBusinessId');
        clearCookie('isSubscriptionAdmin');
        clearCookie('userRole');
        toast.success("Logged in successfully — let's create your first business");
        navigate('/create-business');
      }
    } catch (err) {
      toast.error('Unable to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white w-full flex">
      {/* Left: Login Form */}
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
            <img src="/que-logo.png" alt="QueErp" width={660} height={180} className="h-9 w-auto" />
          </Link>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 font-medium text-lg">Sign in to your QueErp account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

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
                {isLoading ? 'Signing in...' : 'Sign In'}
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
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Sign up
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
            <Quote className="w-16 h-16 opacity-50" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-8 leading-tight">
            &quot;QueErp completely transformed how we handle our regulatory compliance and invoicing. It&apos;s incredibly fast and secure.&quot;
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center font-bold text-blue-950 text-lg">
            </div>
            <div>
              <p className="text-blue-200 font-medium">Que Infotech</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
