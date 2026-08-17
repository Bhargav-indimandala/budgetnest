import { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, Mail, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RESEND_COOLDOWN_SECONDS = 60;

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const requestForm = useForm();
  const resetForm = useForm();
  const cooldownRef = useRef(null);

  useEffect(() => {
    cooldownRef.current = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(cooldownRef.current);
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onRequestSubmit = async (data) => {
    setSubmitting(true);
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep('reset');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("If that email is registered, we've sent a reset code");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
    setSubmitting(false);
  };

  const onResetSubmit = async (data) => {
    setSubmitting(true);
    try {
      await resetPassword(email, data.otp, data.newPassword);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await forgotPassword(email);
      toast.success('A new code has been sent, if that account exists');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend code');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px]" />
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
            <KeyRound size={22} className="text-primary-400" />
          </div>

          {step === 'request' ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Forgot password?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset code.</p>

              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                <div>
                  <label className="label text-gray-300">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      {...requestForm.register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                      })}
                      placeholder="Enter your email"
                      className="input-field pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-primary-500/50"
                    />
                  </div>
                  {requestForm.formState.errors.email && (
                    <p className="text-xs text-red-400 mt-1">{requestForm.formState.errors.email.message}</p>
                  )}
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
                    'Send Reset Code'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Enter reset code</h2>
              <p className="text-sm text-gray-400 mb-6">
                If <span className="text-gray-200">{email}</span> is registered, a 6-digit code is on its way. Enter it with your new password below.
              </p>

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div>
                  <label className="label text-gray-300">Reset code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    {...resetForm.register('otp', {
                      required: 'Enter the 6-digit code',
                      pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
                    })}
                    placeholder="000000"
                    className="input-field text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white placeholder-gray-600 focus:ring-primary-500/50"
                  />
                  {resetForm.formState.errors.otp && (
                    <p className="text-xs text-red-400 mt-1">{resetForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <div>
                  <label className="label text-gray-300">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...resetForm.register('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      placeholder="Create a new password"
                      className="input-field pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-primary-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-400 mt-1">{resetForm.formState.errors.newPassword.message}</p>
                  )}
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
                    'Reset Password'
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
            </>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Remembered it?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Back to Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
