import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';

// Components
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageTests from './pages/ManageTests';
import QuestionBank from './pages/QuestionBank';
import ExamSetup from './pages/ExamSetup';
import ExamPortal from './pages/ExamPortal';
import ResultDetails from './pages/ResultDetails';

// Route Guards
const ProtectedRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return children;
};

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Header navbar matches for authenticated dashboard panels */}
            <Navbar />
            
            <div className="flex-1">
              <Routes>
                {/* Public Landings */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify" element={<VerificationPage />} />

                {/* Candidate Protected Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/setup/:id"
                  element={
                    <ProtectedRoute role="student">
                      <ExamSetup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/attempt/:id"
                  element={
                    <ProtectedRoute role="student">
                      <ExamPortal />
                    </ProtectedRoute>
                  }
                />
                
                {/* Shared Results View (accessible to candidate or admin) */}
                <Route
                  path="/student/results/:id"
                  element={
                    <ProtectedRoute>
                      <ResultDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tests"
                  element={
                    <ProtectedRoute role="admin">
                      <ManageTests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <ProtectedRoute role="admin">
                      <QuestionBank />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/monitor"
                  element={
                    <ProtectedRoute role="admin">
                      {/* Dynamically loads Live Invigilator page */}
                      <LiveMonitorRoute />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </DarkModeProvider>
  );
}

// Lazy/Dynamic import helper for LiveMonitor to prevent loading weights when not needed
const LiveMonitorRoute = () => {
  const [LiveMonitor, setLiveMonitor] = React.useState(null);
  
  React.useEffect(() => {
    import('./pages/LiveMonitor').then((module) => {
      setLiveMonitor(() => module.default);
    });
  }, []);

  if (!LiveMonitor) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <LiveMonitor />;
};

export default App;
