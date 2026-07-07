import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Mic, Maximize, UserCheck, ShieldAlert, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const ExamSetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Checklist State
  const [hasCam, setHasCam] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${id}`);
        if (res.success) {
          setTest(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();

    return () => {
      // Clean up stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [id]);

  const requestHardwarePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCam(true);
      setHasMic(true);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Camera and Microphone access are mandatory for proctored exams.');
      setHasCam(false);
      setHasMic(false);
    }
  };

  const triggerFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  // Fullscreen listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const runFaceIdentityVerification = () => {
    if (!hasCam) {
      setErrorMsg('Please grant webcam permissions before identity scan.');
      return;
    }

    setVerifyingFace(true);
    setErrorMsg('');
    
    // Simulate biometric analysis scan
    setTimeout(() => {
      setVerifyingFace(false);
      setIsVerified(true);
    }, 2500);
  };

  const handleStartExam = async () => {
    if (!hasCam || !hasMic || !isFullscreen || !isVerified) {
      setErrorMsg('Please complete all checkpoint checks to start.');
      return;
    }

    try {
      // Create exam session on backend
      const res = await api.post('/exams/start', { testId: id });
      if (res.success) {
        // Stop stream here to let ExamPortal open its own stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        navigate(`/exam/attempt/${res.data._id}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start exam session.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-4">Syncing secure connection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-left">
      <div className="mb-6">
        <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 tracking-widest uppercase block">
          Hardware & Identity Checks
        </span>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
          Secure Exam Entry Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Module: <strong className="text-slate-700 dark:text-slate-350">{test?.title}</strong> • Duration: {test?.duration} mins
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-6 flex items-start gap-2 border border-red-100 dark:border-red-900/20">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left column - Live feed */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-slate-900 aspect-video rounded-2xl overflow-hidden shadow-inner relative border border-slate-800 flex items-center justify-center">
            {hasCam ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="text-center text-slate-500">
                <Camera size={40} className="mx-auto mb-2 text-slate-700" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Webcam preview offline</span>
              </div>
            )}

            {verifyingFace && (
              <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <Loader2 size={32} className="animate-spin text-tealbrand-400" />
                <span className="text-xs font-bold mt-2">Biometric Scan Active...</span>
                <span className="text-[9px] text-slate-300 mt-0.5">Keep face centered</span>
              </div>
            )}

            {isVerified && (
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-lg shadow flex items-center gap-1">
                <UserCheck size={12} /> IDENTITY CONFIRMED
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Exam Instructions Summary</h4>
            <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 mt-2 list-disc list-inside">
              <li>Keep the room well-lit and silent.</li>
              <li>No secondary monitors or keyboards are permitted.</li>
              <li>Calculators or helper notebooks are prohibited.</li>
            </ul>
          </div>
        </div>

        {/* Right column - Checklist */}
        <div className="md:col-span-6 space-y-4">
          <div className="glassmorphism p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
              Prerequisites Checklist
            </h3>

            {/* Check 1: Camera & Microphone */}
            <div className="flex items-center justify-between py-1">
              <div className="flex gap-3 items-center">
                <div className={`p-2 rounded-xl shrink-0 ${hasCam ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hardware Access</h4>
                  <p className="text-[9px] text-slate-400">Webcam and Microphone capture permission</p>
                </div>
              </div>
              {hasCam ? (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">READY</span>
              ) : (
                <button
                  onClick={requestHardwarePermissions}
                  className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                >
                  Grant
                </button>
              )}
            </div>

            {/* Check 2: Fullscreen Mode */}
            <div className="flex items-center justify-between py-1">
              <div className="flex gap-3 items-center">
                <div className={`p-2 rounded-xl shrink-0 ${isFullscreen ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Maximize size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Lock Fullscreen</h4>
                  <p className="text-[9px] text-slate-400">Forces exam browser to cover screen</p>
                </div>
              </div>
              {isFullscreen ? (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">LOCKED</span>
              ) : (
                <button
                  onClick={triggerFullscreen}
                  className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                >
                  Lock
                </button>
              )}
            </div>

            {/* Check 3: Face confirmation */}
            <div className="flex items-center justify-between py-1">
              <div className="flex gap-3 items-center">
                <div className={`p-2 rounded-xl shrink-0 ${isVerified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Identity Scan</h4>
                  <p className="text-[9px] text-slate-400">Biometric facial verification scan</p>
                </div>
              </div>
              {isVerified ? (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">PASSED</span>
              ) : (
                <button
                  onClick={runFaceIdentityVerification}
                  disabled={verifyingFace}
                  className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
                >
                  Verify
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!hasCam || !hasMic || !isFullscreen || !isVerified}
            className={`w-full py-3 text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all ${
              hasCam && hasMic && isFullscreen && isVerified
                ? 'bg-tealbrand-600 hover:bg-tealbrand-700 cursor-pointer'
                : 'bg-slate-350 cursor-not-allowed opacity-50'
            }`}
          >
            Launch Proctor Exam <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetup;
