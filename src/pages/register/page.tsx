import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle2, Sparkles, Gift, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTrial =
    searchParams.get('trial') === '90' ||
    searchParams.get('trial') === 'true' ||
    searchParams.get('plan') === 'trial';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          isTrial,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        const message = data?.message || 'Registration failed';
        toast.error(message);
        setIsLoading(false);
        return;
      }

      toast.success(
        isTrial
          ? '🎉 Account created! Your 90-Day Free Trial is active. Please sign in.'
          : 'Account created successfully. Please sign in.'
      );
      navigate('/signin');
    } catch (err) {
      toast.error('Unable to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white w-full flex flex-col-reverse lg:flex-row">
      {/* Left: Premium Visual Side */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden bg-blue-600">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-300/30 blur-[100px] rounded-full pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Decorative Grid Light */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-lg"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.2 }}
        >
          {isTrial ? (
            <div className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
              <Gift className="w-4 h-4 text-amber-300" />
              Special 90-Day Free Trial Offer
            </div>
          ) : (
            <div className="mb-10 text-blue-200">
              <ShieldCheck className="w-16 h-16 opacity-50" />
            </div>
          )}

          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Start managing your business finances with enterprise-grade security.
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            {isTrial
              ? 'Join modern businesses using QueErp to automate records, generate invoices, track projects, and monitor performance in real-time.'
              : 'Join thousands of modern businesses using QueErp to automate records, generate invoices, and track performance in real-time.'}
          </p>

          <div className="flex flex-col gap-4">
            {(isTrial
              ? [
                  '⭐ 90-Day All-Inclusive Free Trial automatically activated',
                  'Fast, 2-minute onboarding with no setup fees',
                  'UAE & Indian Regulatory compliance ready',
                  'Enterprise-grade security and automated backups',
                ]
              : [
                  'Fast, 2-minute onboarding',
                  'UAE Regulatory compliance ready',
                  'End-to-end encrypted data',
                ]
            ).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/50 flex items-center justify-center border border-blue-400/50 shrink-0">
                  {isTrial ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-blue-50 font-medium text-sm sm:text-base">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 relative bg-white">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_left,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <motion.div
          className="w-full max-w-[480px] relative z-10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Logo */}
          <Link to="/" className="inline-block mb-8 transition-transform hover:scale-105">
            <img src="/que-logo.png" alt="QueErp" width={660} height={180} className="h-9 w-auto" />
          </Link>

          {/* 90-Day Free Trial Banner (ONLY on trial signup) */}
          {isTrial && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase tracking-wider font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full text-blue-50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Complimentary Access
                </span>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  ⭐ 90 Days Free
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">
                90-Day Free Trial Activated
              </h3>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Every new account receives 90 days of complete enterprise access automatically upon business setup. No credit card required.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
              {isTrial ? 'Start Your 90-Day Free Trial' : 'Create an Account'}
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">
              {isTrial
                ? 'Create your account to activate 90 days of full access for your business.'
                : 'Join QueErp and start managing your finances.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.fullName ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                } bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium text-sm`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                } bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium text-sm`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border ${
                      errors.password ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                    } bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-11 rounded-xl border ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                    } bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all font-medium text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
              </motion.div>
            </div>

            <motion.div
              className="flex items-start gap-3 py-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-xs font-medium text-slate-600 cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </motion.div>
            {errors.agreeToTerms && <p className="text-red-500 text-xs font-medium -mt-1.5">{errors.agreeToTerms}</p>}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 cursor-pointer text-white hover:bg-blue-700 font-bold py-5 rounded-xl transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
              >
                {isLoading
                  ? 'Creating Account...'
                  : isTrial
                  ? 'Start Free 90-Day Trial'
                  : 'Create Account'}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            className="mt-8 text-sm font-medium text-slate-500 text-center sm:text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
