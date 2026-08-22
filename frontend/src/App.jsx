import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';

import { Toaster } from 'react-hot-toast';

export function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Employee Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Employee Leave Request */}
          <Route
            path="/leave"
            element={
              <ProtectedRoute requiredRole="employee">
                <LeaveRequestPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Leave Approval */}
          <Route
            path="/leave/approval"
            element={
              <ProtectedRoute requiredRole="admin">
                <LeaveApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback & Root Redirection */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
