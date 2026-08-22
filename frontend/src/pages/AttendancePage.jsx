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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
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

// ─── AttendancePage ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user, session } = useAuth();

  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}` }),
    [session]
  );

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/attendance/mine`, { headers: authHeader() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch attendance.');
      const all = json.attendance || [];
      setRecords(all);
      const today = all.find((r) => r.date === todayISO()) || null;
      setTodayRecord(today);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCheckIn = async () => {
    setActionLoading('checkin');
    try {
      const res = await fetch(`${API}/attendance/checkin`, {
        method: 'POST',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Check-in failed.');
      showToast('success', 'Checked in successfully! ✅');
      await fetchRecords();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleCheckOut = async () => {
    setActionLoading('checkout');
    try {
      const res = await fetch(`${API}/attendance/checkout`, {
        method: 'POST',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Check-out failed.');
      showToast('success', 'Checked out successfully! 👋');
      await fetchRecords();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading('');
    }
  };

  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = !!todayRecord?.check_in && !todayRecord?.check_out;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>
          </p>
        </div>

        {/* Today's Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Today</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>
                  <span className="font-medium text-gray-700">Check-in: </span>
                  {formatTime(todayRecord?.check_in)}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Check-out: </span>
                  {formatTime(todayRecord?.check_out)}
                </span>
                {todayRecord?.status && (
                  <StatusBadge status={todayRecord.status} />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                id="btn-checkin"
                onClick={handleCheckIn}
                disabled={!canCheckIn || actionLoading === 'checkin'}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  canCheckIn
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {actionLoading === 'checkin' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Checking In…
                  </span>
                ) : (
                  '✅ Check In'
                )}
              </button>

              <button
                id="btn-checkout"
                onClick={handleCheckOut}
                disabled={!canCheckOut || actionLoading === 'checkout'}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  canCheckOut
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {actionLoading === 'checkout' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Checking Out…
                  </span>
                ) : (
                  '🚪 Check Out'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-900">Last 7 Days</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading records…
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No attendance records found for the last 7 days.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Check-In</th>
                    <th className="px-6 py-3 text-left font-semibold">Check-Out</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${row.date === todayISO() ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
                        {formatDate(row.date)}
                        {row.date === todayISO() && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-semibold">Today</span>
                        )}
                      </td>
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
