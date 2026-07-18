import { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Leaf, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmailPage = () => {
  const { verifyEmail, resendOtp, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const cooldownRef = useRef(null);

  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data) => {
    if (!email) {
      toast.error('Enter the email you signed up with');
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmail(email, data.otp);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter the email you signed up with');
      return;
    }
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('A new code has been sent, if that account needs verifying');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend code');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Leaf size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BudgetNest</h1>
            <p className="text-xs text-gray-400">Smart Expense Manager</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="w-12 h-12 rounded-full bg-primary-500/15 flex items-center justify-center mb-4">
            <ShieldCheck size={22} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Verify your email</h2>
          <p className="text-sm text-gray-400 mb-6">
            {email
              ? <>We sent a 6-digit code to <span className="text-gray-200">{email}</span>. Enter it below to activate your account.</>
              : 'Enter the email you signed up with and the code we sent you.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!location.state?.email && (
              <div>
                <label className="label text-gray-300">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-field pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-primary-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label text-gray-300">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...register('otp', {
                  required: 'Enter the 6-digit code',
                  pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
                })}
                placeholder="000000"
                className="input-field text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white placeholder-gray-600 focus:ring-primary-500/50"
              />
              {errors.otp && <p className="text-xs text-red-400 mt-1">{errors.otp.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full flex-shrink-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full text-center text-sm text-primary-400 hover:text-primary-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors mt-5"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending...' : 'Resend code'}
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            Wrong email?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Start over
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
