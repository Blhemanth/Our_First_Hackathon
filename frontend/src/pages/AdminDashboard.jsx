import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { Shield, Users, Clock, CheckSquare, Settings } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-bold text-purple-300 uppercase tracking-wider bg-purple-900/50 border border-purple-700/50 px-2.5 py-1 rounded-md mb-2">
                Administrator Portal
              </span>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.name || 'Admin'}! ⚡
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                Full administrative access to Dayflow HRMS controls and workforce data.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <Shield className="w-5 h-5 text-purple-400" />
              <div className="text-xs">
                <p className="text-slate-400 font-medium">Role</p>
                <p className="font-semibold text-purple-300 uppercase">{user?.role || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Directory</h4>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Manage Staff</p>
              <p className="text-xs text-slate-500 mt-0.5">Teammates can expand `/api/users` UI</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Approvals</h4>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Pending Requests</p>
              <p className="text-xs text-slate-500 mt-0.5">Teammates can expand `/api/leave` UI</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Logs</h4>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Daily Tracking</p>
              <p className="text-xs text-slate-500 mt-0.5">Teammates can expand `/api/attendance` UI</p>
            </div>
          </div>
        </div>

        {/* Placeholder Content Section */}
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-sm">
          <Settings className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Admin Dashboard Ready for Team Modules</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            This dashboard shell is configured with role-based routing (`user.role === 'admin'`). Team members can drop their admin control components directly into this view.
          </p>
        </div>
      </main>
    </div>
  );
}
