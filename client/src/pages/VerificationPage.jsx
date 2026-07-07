import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, Key, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VerificationPage = () => {
  const { verifyEmail, user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already verified
    if (user && user.isVerified) {
      navigate('/student');
    }
    // Fetch simulated registration verification code
    const savedCode = localStorage.getItem('dev_verification_code');
    if (savedCode) {
      setDevCode(savedCode);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrorMsg('Verification code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const verified = await verifyEmail(code);
      if (verified) {
        setSuccessMsg('Email verified successfully! Redirecting...');
        localStorage.removeItem('dev_verification_code');
        setTimeout(() => {
          navigate('/student');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Glow Rings */}
      <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full glow-blue"></div>
      <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full glow-cyan"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glassmorphism p-8 rounded-2xl shadow-xl relative z-10 text-left"
      >
        <div className="text-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4 text-2xl">
            📧
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            We have sent a verification code to your registered email address. Enter the code below to complete authorization.
          </p>
        </div>

        {/* Developer Sandbox Note */}
        {devCode && (
          <div className="p-3 bg-tealbrand-50 dark:bg-tealbrand-950/20 text-tealbrand-700 dark:text-tealbrand-300 text-xs font-bold rounded-xl mb-4 border border-tealbrand-100 dark:border-tealbrand-900/20">
            💡 <span className="underline">Dev-Sandbox Helper</span>: Your simulated verification code is <strong className="text-sm bg-tealbrand-100 dark:bg-tealbrand-950 px-1.5 py-0.5 rounded">{devCode}</strong>.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-green-100 dark:border-green-900/20">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              6-Digit Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-center text-lg font-extrabold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-slate-100"
              />
              <Key size={16} className="absolute left-3.5 top-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying Code...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default VerificationPage;
