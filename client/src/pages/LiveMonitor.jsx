import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Radio, Users, ShieldAlert, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react';

const LiveMonitor = () => {
  const [sessions, setSessions] = useState({}); // key is sessionId, value is session details
  const [alerts, setAlerts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io('http://localhost:5000');

    // Join Admin Monitoring Lobby Room
    socketRef.current.emit('join-admin-lobby');

    // Listen for new student entry
    socketRef.current.on('student-entered', (data) => {
      setSessions((prev) => ({
        ...prev,
        [data.sessionId]: {
          sessionId: data.sessionId,
          studentName: data.studentName,
          testTitle: data.testTitle,
          currentQuestionIndex: 0,
          timeLeft: 'Calculating...',
          warningCount: 0,
          status: 'started',
          online: true,
        },
      }));
    });

    // Listen for progress updates (heartbeats)
    socketRef.current.on('proctor-update', (data) => {
      setSessions((prev) => {
        const existing = prev[data.sessionId] || {};
        return {
          ...prev,
          [data.sessionId]: {
            ...existing,
            sessionId: data.sessionId,
            studentName: data.studentName || existing.studentName,
            currentQuestionIndex: data.currentQuestionIndex,
            timeLeft: data.timeLeft,
            warningCount: data.warningCount,
            status: data.status,
            online: true,
          },
        };
      });
    });

    // Listen for proctor alarms (violations)
    socketRef.current.on('proctor-alert', (data) => {
      // Append to local alerts queue
      const newAlert = {
        id: Date.now(),
        ...data,
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 10)); // keep last 10 alerts

      // Update session warning count immediately
      setSessions((prev) => {
        const existing = prev[data.sessionId] || {};
        return {
          ...prev,
          [data.sessionId]: {
            ...existing,
            warningCount: data.warningCount,
            latestViolation: data.violationType,
            online: true,
          },
        };
      });
    });

    // Student disconnected listener
    socketRef.current.on('student-disconnected', (data) => {
      // Find session with socketId or mark sessions as offline (heartbeat handles offline)
      console.log('Student socket disconnected:', data.socketId);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const clearAlerts = () => setAlerts([]);

  // Formats timer values
  const formatTime = (secs) => {
    if (isNaN(secs)) return secs;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  const activeSessionList = Object.values(sessions);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans">
              Live Invigilator Monitor Room
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>WebSocket stream connected</span> • <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> <span>Active feeds: {activeSessionList.length}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section - Live feeds grid */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users size={16} className="text-brand-500" />
            Active Examinees Feeds
          </h3>

          {activeSessionList.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 glassmorphism rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-slate-300 dark:text-slate-700" />
              Waiting for student connections... Open a student portal and start an exam to see real-time updates.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSessionList.map((sess) => {
                const isWarned = sess.warningCount > 3;
                const isDisq = sess.status === 'disqualified';
                return (
                  <div
                    key={sess.sessionId}
                    className={`p-5 bg-white dark:bg-slate-900 border rounded-2xl relative shadow-sm transition-all duration-300 ${
                      isDisq
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isWarned
                        ? 'border-orange-500 animate-pulse'
                        : 'border-slate-200 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Status Badge */}
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      isDisq ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isDisq ? 'DISQUALIFIED' : sess.status}
                    </span>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {sess.studentName}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Module: {sess.testTitle}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/40 pt-3">
                      <div>
                        <span>Current Index:</span>
                        <p className="text-slate-850 dark:text-slate-200 font-extrabold mt-0.5">
                          Q #{sess.currentQuestionIndex + 1}
                        </p>
                      </div>
                      <div>
                        <span>Time Left:</span>
                        <p className="text-slate-850 dark:text-slate-200 font-extrabold mt-0.5 flex items-center gap-0.5">
                          <Clock size={10} /> {formatTime(sess.timeLeft)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <ShieldAlert size={12} className="text-red-500" />
                        <span>Warnings:</span>
                        <span className={`text-xs font-extrabold ${sess.warningCount > 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sess.warningCount} / 5
                        </span>
                      </div>
                      {sess.latestViolation && !isDisq && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded uppercase">
                          Last: {sess.latestViolation.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section - Flashing Proctor Alarms */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-red-500 animate-bounce" />
              Integrity Incident Alerts
            </h3>
            {alerts.length > 0 && (
              <button
                onClick={clearAlerts}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="glassmorphism p-5 rounded-2xl shadow-sm space-y-4 max-h-[60vh] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400">
                No active integrity alarms triggered. All systems normal.
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-red-50/60 dark:bg-red-950/10 border border-red-200/35 rounded-xl text-left"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-extrabold text-red-600 uppercase">
                        {alert.violationType.replace('-', ' ')}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Candidate: {alert.studentName}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Exam: {alert.testTitle} (Warning #{alert.warningCount})
                    </p>

                    {/* Screenshot attachment preview */}
                    {alert.screenshotUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video relative group cursor-pointer">
                        <img
                          src={alert.screenshotUrl}
                          alt="Proctor Violation Frame"
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
