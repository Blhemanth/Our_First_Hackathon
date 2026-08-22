import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { User, Mail, Hash, Calendar, Shield, Clock, FileText, DollarSign } from 'lucide-react';

export function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md mb-2">
                Employee Portal
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome, {user?.name || 'Employee'}! 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here is your Dayflow workspace overview and quick stats.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <Shield className="w-5 h-5 text-blue-600" />
              <div className="text-xs">
                <p className="text-slate-400 font-medium">Role</p>
                <p className="font-semibold text-slate-800 uppercase">{user?.role || 'Employee'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Profile Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">{user?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-800">{user?.employee_id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-800">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Module Placeholders for Teammates */}
          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col justify-center items-center text-center">
            <Clock className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">Attendance Module</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Check-in / Check-out tracking feature will be integrated here by teammates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col justify-center items-center text-center">
            <FileText className="w-8 h-8 text-purple-500 mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">Leave Management</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Leave requests and approvals feature will be integrated here by teammates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
