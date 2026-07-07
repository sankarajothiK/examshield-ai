import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please populate all registration fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await register(name, email, password);
      if (data) {
        // Dev facilitation: Save verification code to localStorage so user can easily find it
        if (data.verificationCode) {
          localStorage.setItem('dev_verification_code', data.verificationCode);
        }
        navigate('/verify');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Email might already be taken.');
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
          <Link to="/" className="inline-flex items-center gap-1 text-2xl mb-2">
            🛡️
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Candidate Registration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Register your profile to attempt proctored mock entry tests.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-4 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-slate-100"
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="john.doe@medacademy.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-slate-100"
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all dark:text-slate-100"
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating Account...
              </>
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:underline dark:text-brand-400">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
