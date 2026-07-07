import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setSuccessMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Email not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full glow-blue"></div>
      <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full glow-cyan"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glassmorphism p-8 rounded-2xl shadow-xl relative z-10 text-left"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Forgot Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Enter your registered email address and we will generate a temporary login credential for your account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-tealbrand-50 dark:bg-tealbrand-950/20 text-tealbrand-700 dark:text-tealbrand-300 text-xs font-bold rounded-xl mb-4 border border-tealbrand-100 dark:border-tealbrand-900/20 leading-relaxed">
            <div className="flex items-center gap-1.5 mb-1.5 text-sm">
              <ShieldCheck size={16} className="text-tealbrand-600" />
              <span>Password Reset Success!</span>
            </div>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="registered-email@academy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-slate-100"
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Fetching Instructions...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
