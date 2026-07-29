import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { Quote } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Failed to send reset link.');
        setIsLoading(false);
        return;
      }

      toast.success(data.message || 'Password reset link sent to your email.');
      setEmail('');
    } catch (err) {
      toast.error('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white w-full flex">
      {/* Left: Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-white">
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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Forgot Password</h1>
            <p className="text-slate-500 font-medium text-lg">Enter your email and we'll send you a link to reset your password.</p>
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
              className="pt-2 flex flex-col gap-4"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 cursor-pointer text-white hover:bg-blue-700 font-bold py-6 rounded-xl transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
              >
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>

              <Link to="/signin" className="w-full text-center py-4 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border-2 border-transparent hover:border-slate-100">
                Back to Sign In
              </Link>
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Right: Premium Visual Side */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden bg-blue-600">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-400/20 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/30 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />
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
            "We take security seriously. Restoring access to your enterprise data is just a few clicks away."
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center font-bold text-blue-950 text-lg">
              
            </div>
            <div>
              <p className="text-blue-200 font-medium">Security Team</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
