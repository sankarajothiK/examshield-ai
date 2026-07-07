import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Camera, AlertTriangle, Clock, ChevronLeft, ChevronRight, HelpCircle, ShieldAlert, Loader2 } from 'lucide-react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ExamPortal = () => {
  const { id } = useParams(); // sessionId
  const navigate = useNavigate();
  const { user } = useAuth();

  // Exam Data States
  const [session, setSession] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewed, setReviewed] = useState({}); // Track questions marked for review
  const [loading, setLoading] = useState(true);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  // Proctoring Warnings
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [disqualifiedReason, setDisqualifiedReason] = useState('');

  // AI Model States
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // 1. Initial Load: Fetch Session & Test Questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const sessionRes = await api.get(`/exams/session/${id}`);
        if (sessionRes.success) {
          setSession(sessionRes.data);
          setWarningCount(sessionRes.data.warningCount);
          
          // Load answers from database map
          const loadedAnswers = {};
          if (sessionRes.data.answers) {
            Object.entries(sessionRes.data.answers).forEach(([qId, idx]) => {
              loadedAnswers[qId] = idx;
            });
          }
          setAnswers(loadedAnswers);

          // Fetch full test contents (Note: students get stripped correct answers for security)
          const testRes = await api.get(`/tests/${sessionRes.data.test._id}`);
          if (testRes.success) {
            setTest(testRes.data);
            setQuestions(testRes.data.questions);
            
            // Calculate remaining time
            const start = new Date(sessionRes.data.startTime).getTime();
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const totalSec = testRes.data.duration * 60;
            const remaining = totalSec - elapsed;
            
            if (remaining <= 0) {
              handleAutoSubmit();
            } else {
              setTimeLeft(remaining);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  // 2. Set up WebSockets & Camera Feed
  useEffect(() => {
    if (!loading && session && user) {
      // Connect to socket server
      socketRef.current = io('http://localhost:5000');
      
      socketRef.current.emit('join-exam', {
        sessionId: id,
        studentName: user.name,
        testTitle: session.test.title,
      });

      // Start webcam stream
      startWebcam();

      // Load TF.js model
      loadAiModel();
    }

    return () => {
      // Clean up sockets
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      // Clean up intervals
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [loading, session, user]);

  // 3. Mount Browser Lockout Listeners (Security Constraints)
  useEffect(() => {
    if (loading || !session) return;

    // Fullscreen lock loop
    const ensureFullscreen = () => {
      if (!document.fullscreenElement) {
        handleViolationEvent('fullscreen-exit');
      }
    };

    // Tab switcher warning
    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolationEvent('tab-switch');
      }
    };

    const onBlur = () => {
      handleViolationEvent('tab-switch');
    };

    // Disables keyboard shortcuts (reload, print screen, copy-paste)
    const onKeyDown = (e) => {
      // Prevent Refresh (F5, Ctrl+R, F12)
      if (
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') // Inspect DevTools
      ) {
        e.preventDefault();
        handleViolationEvent('dev-tools-attempt');
      }

      // Prevent Copy-Paste keyboard hooks
      if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v') || (e.ctrlKey && e.key === 'a')) {
        e.preventDefault();
        handleViolationEvent('key-shortcut');
      }
    };

    // Disable Right-Click
    const onContextMenu = (e) => {
      e.preventDefault();
      handleViolationEvent('right-click');
    };

    // Disable Copy / Paste
    const onCopyPaste = (e) => {
      e.preventDefault();
      handleViolationEvent('copy-paste');
    };

    // Register event listeners
    document.addEventListener('fullscreenchange', ensureFullscreen);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopyPaste);
    document.addEventListener('paste', onCopyPaste);

    return () => {
      document.removeEventListener('fullscreenchange', ensureFullscreen);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopyPaste);
      document.removeEventListener('paste', onCopyPaste);
    };
  }, [loading, session]);

  // 4. Timer Countdown loop & Heartbeat Broadcast
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Heartbeat reporting to Admin lobby via socket every 5 seconds
    const heartbeat = setInterval(() => {
      if (socketRef.current && user && questions[currentIdx]) {
        socketRef.current.emit('exam-heartbeat', {
          sessionId: id,
          studentName: user.name,
          currentQuestionIndex: currentIdx,
          timeLeft: Math.floor(timeLeft),
          warningCount,
          status: 'in-progress',
        });
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [loading, timeLeft, currentIdx, warningCount]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      handleViolationEvent('camera-disabled');
    }
  };

  const loadAiModel = async () => {
    try {
      // Set tf backend
      await tf.ready();
      const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      setModel(loadedModel);
      setModelLoading(false);
      
      // Start Detection Loop every 1.5 seconds
      startDetectionLoop(loadedModel);
    } catch (err) {
      console.error('Failed to load TF model:', err);
      setModelError(true);
      setModelLoading(false);
    }
  };

  // 5. Continuous AI Detection Loop
  const startDetectionLoop = (loadedModel) => {
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await loadedModel.detect(videoRef.current);
          
          let personCount = 0;
          let phoneDetected = false;
          let bookDetected = false;
          let laptopDetected = false;

          predictions.forEach((p) => {
            if (p.class === 'person') personCount++;
            if (p.class === 'cell phone') phoneDetected = true;
            if (p.class === 'book') bookDetected = true;
            if (p.class === 'laptop' || p.class === 'tv') laptopDetected = true;
          });

          // Check Conditions
          if (phoneDetected) {
            handleViolationEvent('mobile-detected');
          } else if (personCount > 1) {
            handleViolationEvent('multiple-faces');
          } else if (personCount === 0) {
            handleViolationEvent('no-face');
          } else if (bookDetected) {
            handleViolationEvent('book-detected');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 1500);
  };

  // 6. Capture base64 screenshot helper from video element
  const captureScreenshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      
      const ctx = canvas.getContext('2d');
      // Mirror image like video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/jpeg', 0.6); // 60% quality base64
    }
    return '';
  };

  // 7. Core Violation Register Action (Triggers backend updates, screenshots, socket alarms)
  const handleViolationEvent = async (type) => {
    // Prevent double warning modals if already disqualified
    if (disqualifiedReason) return;

    try {
      const screenshot = captureScreenshot();

      // Submit warning event to REST backend
      const res = await api.post('/exams/violation', {
        sessionId: id,
        violationType: type,
        screenshot,
      });

      if (res.success) {
        setWarningCount(res.warningCount);

        // Broadcast warning immediately via Socket.io to active admins
        if (socketRef.current && user && test) {
          socketRef.current.emit('student-violation', {
            sessionId: id,
            studentName: user.name,
            testTitle: test.title,
            violationType: type,
            warningCount: res.warningCount,
            screenshotUrl: screenshot, // fallback visual
          });
        }

        // Auto disqualification check
        if (res.disqualified) {
          setDisqualifiedReason(res.message);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
        } else {
          // Trigger alert modal popup warning
          setWarningReason(getWarningText(type));
          setShowWarningModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getWarningText = (type) => {
    switch (type) {
      case 'tab-switch': return 'DO NOT SWITCH TABS! Tab transfers are strictly monitored and logged.';
      case 'fullscreen-exit': return 'EXAMINER SECURITY: Exiting fullscreen mode is forbidden. Please re-engage.';
      case 'mobile-detected': return 'OBJECT ALARM: Handheld mobile devices are prohibited in the webcam area.';
      case 'multiple-faces': return 'VISUAL SECURITY: Multiple face profiles registered in proctor stream.';
      case 'no-face': return 'VISUAL WARNING: Candidate face profile not visible in proctor feed.';
      case 'book-detected': return 'OBJECT ALARM: Reading material detected in examination area.';
      case 'right-click': return 'PROHIBITED ACTION: Mouse right-clicks are disabled.';
      case 'copy-paste': return 'PROHIBITED ACTION: Clipboard copying and pasting are disabled.';
      case 'dev-tools-attempt': return 'SECURITY ALERT: Invocation of developer consoles is prohibited.';
      default: return 'SECURITY SYSTEM WARNING: Irregular proctor activity logged.';
    }
  };

  // 8. Question Answer Options toggles
  const handleSelectOption = async (optionIndex) => {
    const qId = questions[currentIdx]._id;
    const prevAnswer = answers[qId];

    // Toggle logic: If click same option, deselect/clear
    let nextValue = optionIndex;
    if (prevAnswer === optionIndex) {
      nextValue = -1; // index to represent skip/clear
    }

    // Local update
    const copy = { ...answers };
    if (nextValue === -1) {
      delete copy[qId];
    } else {
      copy[qId] = nextValue;
    }
    setAnswers(copy);

    // Save choice to backend
    try {
      await api.post('/exams/save-answer', {
        sessionId: id,
        questionId: qId,
        selectedOptionIndex: nextValue,
      });
    } catch (err) {
      console.error('Failed to auto-save selected answer:', err);
    }
  };

  const toggleReview = () => {
    const qId = questions[currentIdx]._id;
    setReviewed(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // 9. Submissions
  const handleAutoSubmit = async () => {
    try {
      const res = await api.post('/exams/submit', { sessionId: id });
      if (res.success) {
        navigate(`/student/results/${res.data._id}`);
      }
    } catch (err) {
      console.error(err);
      navigate('/student');
    }
  };

  const handleManualSubmit = () => {
    if (window.confirm('Are you sure you want to submit your exam answers? You cannot return after submission.')) {
      handleAutoSubmit();
    }
  };

  // Formats timer values
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-brand-500 mb-2" size={32} />
        <span className="text-xs">Preparing secure examination matrix...</span>
      </div>
    );
  }

  // Disqualification Modal Override
  if (disqualifiedReason) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-slate-900 border border-red-950 p-8 rounded-2xl text-center">
          <span className="inline-flex w-14 h-14 bg-red-950/50 text-red-500 rounded-full items-center justify-center text-3xl mb-4">
            🚨
          </span>
          <h2 className="text-xl font-extrabold text-white">Exam Terminated</h2>
          <p className="text-xs text-red-400 mt-2 font-bold leading-normal">
            Auto-disqualified due to integrity violations:
          </p>
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-[11px] text-red-300 mt-3 font-semibold text-left">
            {disqualifiedReason}
          </div>
          <button
            onClick={() => navigate('/student')}
            className="w-full mt-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col relative select-none">
      {/* Hidden temporary canvas for screenshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Portal Header */}
      <header className="glassmorphism px-6 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm relative z-30">
        <div className="flex items-center gap-2 text-left">
          <span className="text-lg">🛡️</span>
          <div>
            <h1 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
              {test?.title}
            </h1>
            <span className="text-[9px] font-bold text-slate-400">
              Exam Session Reference: #{id.substring(0, 8)}
            </span>
          </div>
        </div>

        {/* Floating Timer */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold ${
            timeLeft < 300
              ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200/20 animate-pulse'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}>
            <Clock size={14} />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleManualSubmit}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* Left Section - Question Workspace */}
        <div className="lg:col-span-8 flex flex-col justify-between glassmorphism p-6 rounded-2xl shadow-sm text-left">
          {currentQuestion ? (
            <div>
              {/* Question Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800/40 mb-4">
                <span className="text-xs font-extrabold px-2.5 py-1 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 rounded-lg">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Weight: {currentQuestion.marks} Mark(s)
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed mb-6">
                {currentQuestion.text}
              </h2>

              {/* Options list */}
              <div className="grid grid-cols-1 gap-3.5 mb-8">
                {currentQuestion.options.map((option, oIdx) => {
                  const isSelected = answers[currentQuestion._id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full p-4 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md translate-x-0.5'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-[11px] ${
                        isSelected
                          ? 'bg-white text-brand-600 border-white'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Question matrix unavailable.
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/40 mt-6">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <button
              onClick={toggleReview}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                reviewed[currentQuestion?._id]
                  ? 'bg-yellow-500 border-yellow-500 text-white shadow'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <HelpCircle size={14} />
              {reviewed[currentQuestion?._id] ? 'Review Marked' : 'Mark for Review'}
            </button>

            <button
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIdx === questions.length - 1}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Section - Camera, Navigator */}
        <div className="lg:col-span-4 space-y-6 text-left">
          {/* Proctor Feed Card */}
          <div className="p-4 bg-slate-900 rounded-2xl relative border border-slate-800 shadow-lg text-center overflow-hidden">
            <span className="absolute top-3 left-3 bg-red-600 text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest animate-pulse z-10 flex items-center gap-1">
              PROCTOR FEED 🔴
            </span>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800/60 mb-3 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              
              {modelLoading && (
                <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white">
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                  <span className="text-[9px] font-bold mt-1 text-slate-450 uppercase">Loading AI Models...</span>
                </div>
              )}
            </div>

            {/* Warn Tally */}
            <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
              <span>System Warnings:</span>
              <span className={`text-xs font-extrabold ${warningCount > 3 ? 'text-red-500' : 'text-slate-300'}`}>
                {warningCount} / 5
              </span>
            </div>
            {/* Warning indicator line */}
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(warningCount / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Grid Navigator */}
          <div className="p-5 glassmorphism rounded-2xl shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4">
              Questions Navigation Map
            </h3>

            <div className="grid grid-cols-5 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const hasAnswer = answers[q._id] !== undefined;
                const isMarked = reviewed[q._id];
                const isCurrent = currentIdx === idx;
                
                let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500';
                if (hasAnswer) {
                  btnStyle = 'bg-green-500 border-green-500 text-white font-bold';
                }
                if (isMarked) {
                  btnStyle = 'bg-yellow-500 border-yellow-500 text-white font-bold';
                }
                if (isCurrent) {
                  btnStyle += ' ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-950';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-9 h-9 border rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Indicators legend */}
            <div className="flex flex-wrap items-center gap-3.5 mt-5 text-[9px] text-slate-400 font-bold border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded"></span> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded"></span> Under Review
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded"></span> Skipped
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning popup Alert Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs px-6">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-yellow-500 p-6 text-center warning-pulse">
            <span className="inline-flex w-12 h-12 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 rounded-full items-center justify-center text-2xl mb-4">
              ⚠️
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Proctor Integrity Warning
            </h3>
            <p className="text-[10px] text-red-500 dark:text-red-400 mt-2 font-bold leading-normal">
              {warningReason}
            </p>
            <p className="text-[9px] text-slate-400 mt-2">
              Warning count: {warningCount} of 5. Exceeding 5 warnings terminates exam.
            </p>
            <button
              onClick={() => {
                setShowWarningModal(false);
                // Force fullscreen back on close
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                }
              }}
              className="mt-5 px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-xs shadow transition-colors"
            >
              I Understand (Resume Exam)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPortal;
