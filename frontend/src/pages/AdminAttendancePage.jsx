import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700 border border-green-200',
  absent: 'bg-red-100 text-red-700 border border-red-200',
  'half-day': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  leave: 'bg-blue-100 text-blue-700 border border-blue-200',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status ?? 'N/A'}
    </span>
  );
}

// ─── AdminAttendancePage ──────────────────────────────────────────────────────

export default function AdminAttendancePage() {
  const { session } = useAuth();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}` }),
    [session]
  );

  const fetchAll = useCallback(
    async (date) => {
      if (!date) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/attendance/all?date=${date}`, {
          headers: authHeader(),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch attendance.');
        setRecords(json.attendance || []);
      } catch (err) {
        setError(err.message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [authHeader]
  );

  useEffect(() => {
    fetchAll(selectedDate);
  }, [selectedDate, fetchAll]);

  // Summary counts
  const summary = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, 'half-day': 0, leave: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Overview</h1>
            <p className="text-gray-500 mt-1 text-sm">View all employee attendance for any date.</p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <label htmlFor="attendance-date-picker" className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Select Date:
            </label>
            <input
              id="attendance-date-picker"
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Present', key: 'present', color: 'green' },
            { label: 'Absent', key: 'absent', color: 'red' },
            { label: 'Half-Day', key: 'half-day', color: 'yellow' },
            { label: 'On Leave', key: 'leave', color: 'blue' },
          ].map(({ label, key, color }) => (
            <div
              key={key}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-1`}
            >
              <span className={`text-3xl font-bold text-${color}-600`}>{summary[key] ?? 0}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Attendance for{' '}
              <span className="text-blue-600">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </h2>
            <span className="text-sm text-gray-400">{records.length} record{records.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading…
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">{error}</div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No attendance records found for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold">Employee</th>
                    <th className="px-6 py-3 text-left font-semibold">Employee ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Job Title</th>
                    <th className="px-6 py-3 text-left font-semibold">Check-In</th>
                    <th className="px-6 py-3 text-left font-semibold">Check-Out</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar placeholder */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(row.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{row.name}</p>
                            <p className="text-xs text-gray-400">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{row.employee_id}</td>
                      <td className="px-6 py-4 text-gray-600">{row.job_title}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatTime(row.check_in)}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatTime(row.check_out)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
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
