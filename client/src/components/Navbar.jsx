import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Sun, Moon, LogOut, ShieldAlert, BookOpen, BarChart3, Radio, FileText, Bell } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path)
      ? 'bg-brand-500 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
    }
  `;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 w-full glassmorphism px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Brand Logo */}
      <Link to={isAdmin ? "/admin" : "/student"} className="flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-brand-900 dark:text-brand-100 leading-none">
            ExamShield AI
          </span>
          <span className="text-[10px] font-bold text-tealbrand-600 dark:text-tealbrand-400 tracking-wider">
            PROCTORING PORTAL
          </span>
        </div>
      </Link>

      {/* Dynamic Navigation Links based on Role */}
      <div className="hidden md:flex items-center gap-2">
        {isAdmin ? (
          <>
            <Link to="/admin" className={linkClass('/admin')}>
              <BarChart3 size={16} />
              Dashboard
            </Link>
            <Link to="/admin/tests" className={linkClass('/admin/tests')}>
              <BookOpen size={16} />
              Manage Exams
            </Link>
            <Link to="/admin/questions" className={linkClass('/admin/questions')}>
              <FileText size={16} />
              Question Bank
            </Link>
            <Link to="/admin/monitor" className={linkClass('/admin/monitor')}>
              <Radio size={16} className="animate-pulse text-red-500" />
              Live Monitor
            </Link>
          </>
        ) : (
          <>
            <Link to="/student" className={linkClass('/student')}>
              <BookOpen size={16} />
              Dashboard
            </Link>
            <Link to="/student/results" className={linkClass('/student/results')}>
              <BarChart3 size={16} />
              My History
            </Link>
          </>
        )}
      </div>

      {/* Action utilities */}
      <div className="flex items-center gap-3">
        {/* Dark Mode switch */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glassmorphism rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Recent Notifications</span>
                <button
                  onClick={fetchNotifications}
                  className="text-[10px] text-brand-500 font-bold hover:underline"
                >
                  Refresh
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-4 py-2 border-b border-slate-50 dark:border-slate-800/40 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                        !n.read ? 'bg-brand-50/20 dark:bg-brand-950/10' : ''
                      }`}
                      onClick={() => markRead(n._id)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1"></span>}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <span className="text-[8px] text-slate-400 block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
            <span className="text-[9px] font-bold text-brand-500 uppercase tracking-wider leading-none">
              {user.role}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-extrabold text-brand-600 dark:text-brand-400 text-xs shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
