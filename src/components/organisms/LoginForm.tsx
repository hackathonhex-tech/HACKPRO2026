"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Button } from '../atoms/Button';
import { BrandLogo } from '../atoms/BrandLogo';
import { unifiedLoginAction } from '@/server/actions/auth.actions';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';

export const LoginForm: React.FC = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);

  React.useEffect(() => {
    getPublicSettingsAction()
      .then((res: any) => {
        if (res.success && 'settings' in res && res.settings) {
          setIsRegistrationOpen(res.settings.isRegistrationOpen ?? true);
        } else {
          setIsRegistrationOpen(true);
        }
      })
      .catch(() => setIsRegistrationOpen(true));
  }, []);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await unifiedLoginAction(id, password);

      if (data.success) {
        if (data.role === 'admin' || data.role === 'sub-admin') router.push('/admin/dashboard');
        else if (data.role === 'judge') router.push('/judge/dashboard');
        else if (data.role === 'team') router.push('/team/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      id="login-section"
      className="lg:col-span-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
    >
      <div className="relative group">
        {/* Card Glow Effect matching brand primary & secondary */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#3760F8]/40 to-[#D3FE4F]/40 rounded-[2.2rem] blur-xl opacity-60 group-hover:opacity-85 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80 p-8 sm:p-9 shadow-2xl">
          {/* Header inside the login card */}
          <div className="text-center mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex justify-center mb-4">
              <BrandLogo size="md" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Sign in to access Admin, Judge, or Team Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label>Email / Login ID</Label>
              <Input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter your email or unique ID..."
                className="focus:border-[#3760F8] focus:ring-[#3760F8]/20"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Password / Team ID</Label>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus:border-[#3760F8] focus:ring-[#3760F8]/20"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 dark:text-red-400 text-sm text-center font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 py-2.5 px-4 rounded-xl leading-snug"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              isLoading={loading} 
              variant="primary"
              className="w-full mt-2 text-sm uppercase tracking-wider py-3.5"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {isRegistrationOpen !== false && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60 text-center">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                New participant team?{' '}
                <Link href="/register" className="text-[#3760F8] dark:text-[#5F8AFA] hover:underline font-black transition-colors">
                  Register Your Team →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

