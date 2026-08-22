import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, UserCheck, Shield } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              D
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Dayflow</h1>
              <span className="text-xs font-medium text-slate-500">Human Resource Management</span>
            </div>
          </div>

          {/* User Profile & Actions */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800">{user.name || user.email}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {user.employee_id || 'N/A'}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                  {user.role}
                </span>
              </div>

              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                title="Sign out of Dayflow"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
