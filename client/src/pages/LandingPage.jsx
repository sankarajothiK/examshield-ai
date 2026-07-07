import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Video, RefreshCw, Cpu, Award, Users, GraduationCap, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen medical-gradient overflow-hidden relative selection:bg-brand-200">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full glow-blue"></div>
      <div className="absolute top-1/2 right-10 w-96 h-96 rounded-full glow-cyan"></div>

      {/* Header / Top Landing Nav */}
      <header className="px-6 py-4 flex items-center justify-between relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-brand-900 dark:text-brand-100 leading-none">
              ExamShield AI
            </span>
            <span className="text-[9px] font-bold text-tealbrand-600 dark:text-tealbrand-400 tracking-wider">
              SMART EXAMINATION PORTAL
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/student'}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Enter Portal
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 text-sm font-semibold">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Callout */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs font-bold mb-6"
          >
            <ShieldCheck size={14} /> AI-Powered Secure Proctoring
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-tight"
          >
            AI-Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 to-tealbrand-500 bg-clip-text text-transparent">
              Online Examination
            </span> & Proctoring Platform
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            ExamShield AI offers an enterprise-grade examination platform. Featuring continuous face tracking, device detection, and browser integrity monitoring to enable high-stakes medical and scientific entry exams online.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              to="/register"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
            >
              Get Started (Student Registration)
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl font-bold border border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all text-sm"
            >
              Portal Login
            </Link>
          </motion.div>
        </div>

        {/* Right Card Mockup Illustration */}
        <div className="lg:col-span-6 flex justify-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="w-full max-w-lg glassmorphism p-6 rounded-2xl shadow-xl relative overflow-hidden"
          >
            {/* Visual Header Mock */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <span className="text-xs font-bold text-slate-400">EXAM_PORTAL_ACTIVE.EXE</span>
            </div>

            {/* Simulated Exam Info */}
            <div className="flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-400">CURRENT MODULE</h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Advanced Physiology & Anatomy II</p>
                </div>
                <div className="px-3 py-1 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-extrabold rounded-lg animate-pulse">
                  REC 🔴
                </div>
              </div>

              {/* Proctoring metrics block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100/60 dark:border-brand-900/20 rounded-xl">
                  <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 mb-1">
                    <Video size={14} />
                    <span className="text-[10px] font-bold">PROCTOR FEED</span>
                  </div>
                  <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* Simulated Camera Wireframe */}
                    <div className="absolute inset-2 border border-brand-500/40 border-dashed rounded flex flex-col items-center justify-center">
                      <Cpu size={24} className="text-brand-500 animate-spin-slow" />
                      <span className="text-[8px] font-bold text-slate-500 mt-1">Analyzing Eye Track...</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-tealbrand-50/40 dark:bg-tealbrand-950/20 border border-tealbrand-100/60 dark:border-tealbrand-900/20 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-tealbrand-600 dark:text-tealbrand-400">INTEGRITY FEED</span>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Status: SECURE</h5>
                  </div>
                  <ul className="text-[9px] text-slate-500 dark:text-slate-400 space-y-1 mt-2">
                    <li className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Fullscreen locked</li>
                    <li className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Keyboard hooks OK</li>
                    <li className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> DevTools blocked</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">State of the Art Proctoring Features</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">ExamShield AI integrates high-performance browser security and AI models to construct a comprehensive shield.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 glassmorphism rounded-2xl shadow-sm text-left hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
              <Video size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Continuous AI Camera Audit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Detects mobile phones, headphones, books, multiple faces, looking away, and no-face violations using local TF.js.</p>
          </div>

          <div className="p-6 glassmorphism rounded-2xl shadow-sm text-left hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-tealbrand-100 dark:bg-tealbrand-950 flex items-center justify-center text-tealbrand-600 dark:text-tealbrand-400 mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Strict Browser Sandboxing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Locks students in fullscreen, blocking tab switching, multiple windows, copy-paste, right clicks, and dev tools.</p>
          </div>

          <div className="p-6 glassmorphism rounded-2xl shadow-sm text-left hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
              <RefreshCw size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Automated Evaluation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Compares selected options against correct answers instantly upon submission, generating detailed score metrics.</p>
          </div>

          <div className="p-6 glassmorphism rounded-2xl shadow-sm text-left hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-tealbrand-100 dark:bg-tealbrand-950 flex items-center justify-center text-tealbrand-600 dark:text-tealbrand-400 mb-4">
              <Award size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Verified Result Certificates</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Generates downloadable PDFs complete with score breakdowns, violation audits, and cryptographically linked QR verification.</p>
          </div>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="bg-brand-900 text-white py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-extrabold text-brand-100 flex justify-center items-center gap-1">
              <Users size={24} /> 50k+
            </div>
            <p className="text-xs text-brand-300 mt-1 uppercase font-bold tracking-wider">Students Enrolled</p>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-100 flex justify-center items-center gap-1">
              <GraduationCap size={24} /> 1.2M+
            </div>
            <p className="text-xs text-brand-300 mt-1 uppercase font-bold tracking-wider">Exams Protected</p>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-100 flex justify-center items-center gap-1">
              <ShieldCheck size={24} /> 99.9%
            </div>
            <p className="text-xs text-brand-300 mt-1 uppercase font-bold tracking-wider">Integrity Rate</p>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-100 flex justify-center items-center gap-1">
              <Cpu size={24} /> &lt; 50ms
            </div>
            <p className="text-xs text-brand-300 mt-1 uppercase font-bold tracking-wider">AI Inference Time</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Trusted by Educational Authorities</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">See how institutions ensure secure medical examinations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 glassmorphism rounded-2xl text-left shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              "We transitioned our medical biology entrance exam online with ExamShield AI. The camera-based phone detection and tab lockouts worked flawlessly. The live monitoring dashboard allowed our invigilators to audit multiple sessions concurrently."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-extrabold text-sm">
                Dr
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dr. Sarah Jenkins</h4>
                <span className="text-[10px] text-slate-400 block">Dean of Medicine, Metro Science Academy</span>
              </div>
            </div>
          </div>

          <div className="p-6 glassmorphism rounded-2xl text-left shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              "For our remote certification tests, security was the primary concern. ExamShield AI solved this. Their PDF results with violation logs provide the cryptographic proof we need to guarantee that certificates were earned fairly."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-extrabold text-sm">
                Prof
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Prof. Marcus Sterling</h4>
                <span className="text-[10px] text-slate-400 block">Director, National Medical Licensing Board</span>
              </div>
            </div>
          </div>

          <div className="p-6 glassmorphism rounded-2xl text-left shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              "The React-based interface is exceptionally responsive, and local TensorFlow.js object detection means students don't experience network latency during camera audits. A stellar design that fits modern educational needs."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-extrabold text-sm">
                Eng
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Ir. Helena Rostova</h4>
                <span className="text-[10px] text-slate-400 block">IT Director, Euro Medical Institute</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ExamShield AI Portal</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 ExamShield Inc. Developed for enterprise medical and academic examinations. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
