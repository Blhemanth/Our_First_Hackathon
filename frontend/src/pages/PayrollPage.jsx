import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
}

// ─── Employee Payroll Card ────────────────────────────────────────────────────

function EmployeePayrollCard({ user }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {(user?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{user?.name}</p>
            <p className="text-blue-100 text-sm">{user?.job_title}</p>
            <p className="text-blue-200 text-xs font-mono mt-0.5">{user?.employee_id}</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
          <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Monthly Salary</p>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(user?.salary)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">Email</p>
            <p className="font-medium truncate text-xs">{user?.email || '—'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">Member Since</p>
            <p className="font-medium text-xs">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Salary details are confidential. Contact HR for any discrepancies.
      </p>
    </div>
  );
}

// ─── Admin Salary Row ─────────────────────────────────────────────────────────

function SalaryRow({ employee, authHeader, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(employee.salary ?? '');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState(null);

  const handleSave = async () => {
    const newSalary = parseFloat(value);
    if (isNaN(newSalary) || newSalary < 0) {
      setRowError('Enter a valid salary amount.');
      return;
    }
    setSaving(true);
    setRowError(null);
    try {
      const res = await fetch(`${API}/users/${employee.id}`, {
        method: 'PATCH',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: newSalary }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update salary.');
      setEditing(false);
      onUpdated(employee.id, newSalary);
    } catch (err) {
      setRowError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(employee.salary ?? '');
    setEditing(false);
    setRowError(null);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(employee.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{employee.name}</p>
            <p className="text-xs text-gray-400">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{employee.employee_id}</td>
      <td className="px-6 py-4 text-gray-600">{employee.job_title}</td>
      <td className="px-6 py-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">₹</span>
            <input
              id={`salary-input-${employee.id}`}
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <span className="font-semibold text-gray-800">{formatCurrency(employee.salary)}</span>
        )}
        {rowError && <p className="text-xs text-red-500 mt-1">{rowError}</p>}
      </td>
      <td className="px-6 py-4">
        {editing ? (
          <div className="flex gap-2">
            <button
              id={`save-salary-${employee.id}`}
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            id={`edit-salary-${employee.id}`}
            onClick={() => setEditing(true)}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-lg transition-colors border border-indigo-100"
          >
            ✏️ Edit
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── PayrollPage ──────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { user, session } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}` }),
    [session]
  );

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/users`, { headers: authHeader() });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch employees.');
        // Support both { users: [] } and plain array responses
        setEmployees(Array.isArray(json) ? json : json.users || []);
      } catch (err) {
        showToast('error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAdmin, authHeader]);

  const handleSalaryUpdated = (id, newSalary) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, salary: newSalary } : emp))
    );
    showToast('success', 'Salary updated successfully! ✅');
  };

  // ── Employee View ──────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Payroll</h1>
            <p className="text-gray-500 mt-1 text-sm">Your compensation details.</p>
          </div>
          <EmployeePayrollCard user={user} />
        </div>
      </div>
    );
  }

  // ── Admin View ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Toast toast={toast} />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-1 text-sm">View and update employee salaries.</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Employees</h2>
            <span className="text-sm text-gray-400">{employees.length} employee{employees.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading employees…
            </div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold">Employee</th>
                    <th className="px-6 py-3 text-left font-semibold">Employee ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Job Title</th>
                    <th className="px-6 py-3 text-left font-semibold">Salary (INR)</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <SalaryRow
                      key={emp.id}
                      employee={emp}
                      authHeader={authHeader}
                      onUpdated={handleSalaryUpdated}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
