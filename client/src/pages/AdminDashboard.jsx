import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckCircle2, ShieldAlert, BookOpen, Radio, ArrowRight, BarChart3, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/tests/analytics');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Mock Violation Trend Chart
  const chartData = {
    labels: ['Tab Switch', 'Mobile Phone', 'Multiple Faces', 'Headphones', 'Looking Away'],
    datasets: [
      {
        label: 'Incident Occurrences',
        data: [18, 5, 8, 3, 22],
        backgroundColor: [
          'rgba(241, 196, 15, 0.65)',  // Yellow
          'rgba(231, 76, 60, 0.65)',   // Red
          'rgba(155, 89, 182, 0.65)',  // Purple
          'rgba(52, 152, 219, 0.65)',  // Blue
          'rgba(230, 126, 34, 0.65)',  // Orange
        ],
        borderColor: [
          '#F1C40F',
          '#E74C3C',
          '#9B59B6',
          '#3498DB',
          '#E67E22',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Loading administrator console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left">
      {/* Dashboard Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Administrator Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit proctored sessions, compile analytics reports, and customize exam banks.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/monitor"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm animate-pulse"
          >
            <Radio size={14} /> Live Monitor Room
          </Link>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students */}
        <div className="p-5 glassmorphism rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Students
            </span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 block mt-1">
              {stats?.totalStudents || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Users size={18} />
          </div>
        </div>

        {/* Total Tests */}
        <div className="p-5 glassmorphism rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Tests
            </span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 block mt-1">
              {stats?.totalTests || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tealbrand-100 dark:bg-tealbrand-950/60 flex items-center justify-center text-tealbrand-600 dark:text-tealbrand-400">
            <FileText size={18} />
          </div>
        </div>

        {/* Completed Exams */}
        <div className="p-5 glassmorphism rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Exams Completed
            </span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 block mt-1">
              {stats?.completedExams || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Violation Count */}
        <div className="p-5 glassmorphism rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Warnings
            </span>
            <span className="text-2xl font-extrabold text-red-600 dark:text-red-400 block mt-1">
              {stats?.violationCount || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column - Recent activities */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glassmorphism p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen size={16} className="text-brand-500" />
                Recent Candidates Submissions
              </h3>
              <span className="text-[10px] text-slate-400">Showing last 5</span>
            </div>

            {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent exam submissions reported yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {stats.recentSubmissions.map((sub) => (
                  <div key={sub._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {sub.student?.name || 'Anonymous Candidate'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Exam: {sub.test?.title || 'Unknown Exam'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                        {sub.score} Marks ({sub.percentage}%)
                      </span>
                      <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 ${
                        sub.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Violation Chart */}
        <div className="lg:col-span-5">
          <div className="glassmorphism p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <BarChart3 size={16} className="text-brand-500" />
              Proctoring Violation Incidents Trend
            </h3>
            <div className="h-60 flex items-center justify-center">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
