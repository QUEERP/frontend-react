import React, { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {  useNavigate, useSearchParams  } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { Eye, EyeOff, Check, X, Quote } from 'lucide-react';

function ResetPasswordForm() {
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
    }
  }, [token]);

  // Validation criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = password && password === confirmPassword;
  
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing reset token. Please request a new link.');
      return;
    }

    if (!isValid) {
      toast.error('Please ensure all password requirements are met.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Failed to reset password.');
        setIsLoading(false);
        return;
      }

      toast.success('Your password has been reset successfully.');
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (err) {
      toast.error('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-emerald-600' : 'text-slate-500'}`}>
      {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-50" />}
      <span>{text}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <label className="block text-sm font-bold text-slate-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Confirm Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className={`w-full px-5 py-4 rounded-xl border ${confirmPassword && !isMatch ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium`}
          required
        />
        {confirmPassword && !isMatch && (
          <p className="text-red-500 text-xs font-semibold mt-2">Passwords do not match</p>
        )}
      </motion.div>

      {/* Password Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-slate-50 p-4 rounded-xl border border-slate-100"
      >
        <p className="text-sm font-bold text-slate-700 mb-3">Password requirements:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ValidationItem met={hasMinLength} text="Minimum 8 characters" />
          <ValidationItem met={hasUpper} text="One uppercase letter" />
          <ValidationItem met={hasLower} text="One lowercase letter" />
          <ValidationItem met={hasNumber} text="One number" />
          <ValidationItem met={hasSpecial} text="One special character" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="pt-2"
      >
        <Button
          type="submit"
          disabled={isLoading || !isValid || !token}
          className="w-full bg-blue-600 cursor-pointer text-white hover:bg-blue-700 font-bold py-6 rounded-xl transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </motion.div>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-white w-full flex">
      {/* Left: Reset Password Form */}
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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Set New Password</h1>
            <p className="text-slate-500 font-medium text-lg">Create a strong, secure password for your account.</p>
          </div>

          <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
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
