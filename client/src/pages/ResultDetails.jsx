import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, Download, ShieldCheck, Check, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import api, { API_BASE } from '../services/api';

const ResultDetails = () => {
  const { id } = useParams(); // result ID
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/${id}`);
        if (res.success) {
          setResult(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load result sheet.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    // Open in new tab which prompts browser file download directly from server-side res.setHeader headers!
    window.open(`${API_BASE}/results/${id}/pdf?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Generating scorecard analytics...</p>
      </div>
    );
  }

  if (errorMsg || !result) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-red-500">
        <AlertTriangle className="mx-auto mb-2 text-red-500" />
        <span className="text-sm font-bold">{errorMsg || 'Result not found.'}</span>
        <button
          onClick={() => navigate('/student')}
          className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPass = result.status === 'pass';
  const vReport = result.violationReport;
  const warningCount = vReport ? vReport.violations.length : 0;
  const isDisqualified = result.session && result.session.status === 'disqualified';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-left">
      <div className="mb-6">
        <Link
          to={result.student._id === result.student?._id ? "/student" : "/admin"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Examination Scorecard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Candidate Transcript ID: <strong className="text-slate-700 dark:text-slate-350">{result._id}</strong>
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column - Score Analytics */}
        <div className="md:col-span-7 space-y-6">
          {/* Status Panel */}
          <div className={`p-6 rounded-2xl border text-center shadow-sm relative overflow-hidden ${
            isPass
              ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200/40 text-green-700 dark:text-green-400'
              : 'bg-red-50/50 dark:bg-red-950/10 border-red-200/40 text-red-700 dark:text-red-400'
          }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest block">
              Result Status
            </span>
            <h3 className="text-3xl font-extrabold mt-2 tracking-tight">
              {isPass ? 'PASSED 🎓' : 'FAILED ❌'}
            </h3>
            <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 leading-normal max-w-sm mx-auto">
              {isPass
                ? 'Congratulations! You have cleared the qualifying score parameters for this examination module.'
                : 'Qualifying score parameters not met. Please review instructions and re-attempt module.'}
            </p>
          </div>

          {/* Scores breakups */}
          <div className="glassmorphism p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
              Performance Index
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Correct</span>
                <span className="text-lg font-extrabold text-green-600 dark:text-green-400 block mt-0.5">
                  {result.correctAnswers}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Incorrect</span>
                <span className="text-lg font-extrabold text-red-500 block mt-0.5">
                  {result.wrongAnswers}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Skipped</span>
                <span className="text-lg font-extrabold text-slate-500 dark:text-slate-350 block mt-0.5">
                  {result.skippedAnswers}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                <span>Score Obtained</span>
                <span className="text-slate-950 dark:text-slate-150">
                  {result.score} / {result.totalMarksPossible} Marks
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                <span>Percentage Index</span>
                <span className="text-slate-950 dark:text-slate-150">{result.percentage}%</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span>Attempted Module Date</span>
                <span className="text-slate-550 dark:text-slate-400">
                  {new Date(result.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Proctoring Audit */}
        <div className="md:col-span-5 space-y-6">
          {/* Invigilator Audit Card */}
          <div className="glassmorphism p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-widest pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
              🛡️ Proctor Audit Log
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Integrity Status:</span>
                <span className={`uppercase font-extrabold ${
                  isDisqualified
                    ? 'text-red-500'
                    : warningCount > 3
                    ? 'text-orange-500'
                    : 'text-green-500 dark:text-green-400'
                }`}>
                  {isDisqualified
                    ? 'DISQUALIFIED'
                    : warningCount > 0
                    ? 'CLEARED WITH WARNINGS'
                    : 'SECURE'}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Audit Warnings:</span>
                <span className="text-slate-800 dark:text-slate-200">{warningCount} Warnings</span>
              </div>

              {/* Incidents logs list */}
              {vReport && vReport.violations.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl max-h-32 overflow-y-auto">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Registered Incidents:</span>
                  <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc list-inside">
                    {vReport.violations.map((v, i) => (
                      <li key={i} className="leading-relaxed">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                          {v.type.replace('-', ' ')}
                        </span>{' '}
                        at {new Date(v.timestamp).toLocaleTimeString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions CTA */}
            <button
              onClick={handleDownloadPdf}
              className="w-full mt-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold shadow flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Download Result PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetails;
