import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROLE_BADGE = {
  admin: 'bg-violet-100 text-violet-700',
  employee: 'bg-slate-100 text-slate-600',
};

// All fields admin can edit (excludes immutable id, employee_id, created_at)
const ADMIN_EDITABLE_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text' },
  { name: 'email', label: 'Email Address', type: 'email' },
  { name: 'phone', label: 'Phone Number', type: 'tel' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'job_title', label: 'Job Title', type: 'text' },
  { name: 'salary', label: 'Salary (₹)', type: 'number' },
  { name: 'role', label: 'Role', type: 'select', options: ['employee', 'admin'] },
  { name: 'profile_picture_url', label: 'Profile Picture URL', type: 'url' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Badge({ role }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {role}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Detail / Edit Panel
// ---------------------------------------------------------------------------
function EmployeeDetailPanel({ employee, onBack, onSaved }) {
  const [form, setForm] = useState({ ...employee });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      // Build payload — only send ADMIN_EDITABLE_FIELDS to avoid sending immutables
      const payload = ADMIN_EDITABLE_FIELDS.reduce((acc, field) => {
        if (form[field.name] !== undefined) {
          acc[field.name] =
            field.type === 'number' ? Number(form[field.name]) : form[field.name];
        }
        return acc;
      }, {});

      const { data } = await api.patch(`/users/${employee.id}`, payload);
      setSuccessMsg('Employee profile saved.');
      onSaved(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel header */}
      <div className="flex items-center gap-3">
        <button
          id="admin-back-to-list-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to employees
        </button>
      </div>

      {/* Avatar hero */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg shadow-violet-200">
        {form.profile_picture_url ? (
          <img
            src={form.profile_picture_url}
            alt={form.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white/40 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/40 shrink-0">
            <UserCircleIcon className="w-12 h-12 text-white/70" />
          </div>
        )}
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-white">{employee.name}</h2>
          <p className="text-violet-200 text-sm mt-1">{employee.employee_id}</p>
          <Badge role={employee.role} />
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button
            id="admin-save-employee-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-violet-700 text-sm font-semibold hover:bg-violet-50 transition disabled:opacity-60"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-medium">
          ✗ {errorMsg}
        </div>
      )}

      {/* Editable form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 border-b border-slate-100 pb-3 mb-5">
          Edit Employee Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ADMIN_EDITABLE_FIELDS.map(({ name, label, type, options }) => (
            <div key={name} className="flex flex-col gap-1">
              <label
                htmlFor={`admin-field-${name}`}
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                {label}
              </label>
              {type === 'select' ? (
                <select
                  id={`admin-field-${name}`}
                  name={name}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800
                             focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`admin-field-${name}`}
                  name={name}
                  type={type}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800
                             focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                />
              )}
            </div>
          ))}

          {/* Read-only info */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Employee ID
            </span>
            <span className="text-slate-500 text-sm italic">{employee.employee_id} (read-only)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Member Since
            </span>
            <span className="text-slate-500 text-sm italic">
              {new Date(employee.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminDashboard — main component
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch all employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get('/users');
      setEmployees(data.users);
    } catch (err) {
      setFetchError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Patch updated employee back into list
  const handleSaved = (updatedUser) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updatedUser.id ? updatedUser : emp))
    );
    setSelectedEmployee(updatedUser);
  };

  // Filtered list
  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employee_id?.toLowerCase().includes(q) ||
      emp.job_title?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Dayflow
            </span>
            <span className="text-slate-400 text-sm hidden sm:inline">/ Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:inline">
              {user?.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {selectedEmployee ? (
          // ── Employee detail / edit panel ──────────────────────────────
          <EmployeeDetailPanel
            employee={selectedEmployee}
            onBack={() => setSelectedEmployee(null)}
            onSaved={handleSaved}
          />
        ) : (
          // ── Employee list ─────────────────────────────────────────────
          <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Employee Directory</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {employees.length} total employee{employees.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-search-input"
                  type="text"
                  placeholder="Search employees…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Error state */}
            {fetchError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
                ✗ {fetchError}
                <button
                  onClick={fetchEmployees}
                  className="ml-3 underline hover:text-rose-900 transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  {search ? 'No employees match your search.' : 'No employees found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Role
                        </th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((emp) => (
                        <tr
                          key={emp.id}
                          id={`admin-employee-row-${emp.id}`}
                          onClick={() => setSelectedEmployee(emp)}
                          className="hover:bg-violet-50/50 cursor-pointer transition-colors group"
                        >
                          {/* Name + avatar */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {emp.profile_picture_url ? (
                                <img
                                  src={emp.profile_picture_url}
                                  alt={emp.name}
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                  {emp.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-slate-800 group-hover:text-violet-700 transition-colors">
                                {emp.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                            {emp.employee_id}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{emp.job_title}</td>
                          <td className="px-6 py-4">
                            <Badge role={emp.role} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
