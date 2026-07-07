import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, ClipboardCheck, Calendar, BookOpen, AlertCircle, TrendingUp, RefreshCw, Award } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch available tests
      const testRes = await api.get('/tests');
      if (testRes.success) {
        setTests(testRes.data);
      }

      // 2. Fetch student results history
      const resultRes = await api.get('/results/my');
      if (resultRes.success) {
        setResults(resultRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Performance Chart configuration
  const chartData = {
    labels: results.slice().reverse().map((r, i) => `Test ${i + 1}`),
    datasets: [
      {
        label: 'Exam score percentage (%)',
        data: results.slice().reverse().map(r => r.percentage),
        borderColor: '#0c85eb',
        backgroundColor: 'rgba(12, 133, 235, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#7f8c8d' },
        grid: { color: 'rgba(127, 140, 141, 0.1)' }
      },
      x: {
        ticks: { color: '#7f8c8d' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Loading candidate dashboard...</p>
      </div>
    );
  }

  // Segment tests into active/upcoming
  const now = new Date();
  const availableExams = tests.filter((t) => {
    const isWithinTime = now >= new Date(t.startDate) && now <= new Date(t.endDate);
    // filter out tests already attempted maximum times
    const pastAttempts = results.filter(r => r.test?._id === t._id).length;
    return isWithinTime && pastAttempts < t.maxAttempts;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Board */}
      <div className="glassmorphism p-6 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="text-left relative z-10">
          <span className="text-[10px] font-extrabold text-tealbrand-600 dark:text-tealbrand-400 tracking-widest uppercase">
            Medical Entrance Academy
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor your upcoming proctored tests, scorecard history, and progress logs.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start md:self-auto shrink-0"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Sync Portal'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Column - Tests List */}
        <div className="lg:col-span-7 space-y-8">
          {/* Active Proctor Exams */}
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="flex w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              Live Examination Modules
            </h3>

            {availableExams.length === 0 ? (
              <div className="glassmorphism p-8 rounded-2xl text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800">
                <AlertCircle size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                There are no exam windows active right now, or you have completed all scheduled attempts.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableExams.map((test) => (
                  <div
                    key={test._id}
                    className="p-5 glassmorphism rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-300 transition-colors"
                  >
                    <div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 rounded-md uppercase">
                        {test.questions.length} Questions
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-2">
                        {test.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md line-clamp-2">
                        {test.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <ClipboardCheck size={11} /> Pass: {test.passingMarks} Marks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Duration: {test.duration} min
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/exam/setup/${test._id}`)}
                      className="px-4 py-2.5 bg-tealbrand-600 hover:bg-tealbrand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 hover:translate-x-0.5 transition-transform"
                    >
                      <Play size={12} fill="white" /> Enter Exam
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Result History Logs */}
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              Attempt History & Certificates
            </h3>

            {results.length === 0 ? (
              <div className="glassmorphism p-8 rounded-2xl text-center text-slate-400 text-xs">
                No past exam records found. Your completed scores will populate here.
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3 text-left">Exam Module</th>
                      <th className="px-5 py-3 text-center">Score</th>
                      <th className="px-5 py-3 text-center">Result</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {results.map((result) => (
                      <tr key={result._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-left">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                            {result.test?.title || 'Exam Module'}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Attempted: {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {result.score}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {result.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              result.status === 'pass'
                                ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/30'
                                : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/30'
                            }`}
                          >
                            {result.status === 'pass' ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center flex items-center justify-center gap-2">
                          <Link
                            to={`/student/results/${result._id}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[10px] transition-colors"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Performance graph and Notifications */}
        <div className="lg:col-span-5 space-y-8">
          {/* Performance analytics chart card */}
          {results.length > 0 && (
            <div className="glassmorphism p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-brand-500" />
                Performance Metrics Graph
              </h3>
              <div className="h-60 flex items-center justify-center">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Guidelines Box */}
          <div className="p-5 bg-brand-50/30 dark:bg-brand-950/10 border border-brand-100/50 dark:border-brand-900/20 rounded-2xl">
            <h3 className="text-xs font-bold text-brand-800 dark:text-brand-400 uppercase tracking-wider mb-2">
              ⚠️ Proctoring Exam Rules
            </h3>
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
              <li>Webcam & Microphone permissions are mandatory.</li>
              <li>Leaving full-screen locks will trigger alerts.</li>
              <li>More than 3 tab switches results in immediate disqualification.</li>
              <li>A safe proctor rating requires keeping your eyes on screen.</li>
              <li>Do not open developer inspect consoles during exams.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
