import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: 'Pending', badgeClass: 'badge badge-pending animate-pulse-badge', dot: 'bg-amber-400' },
  approved: { label: 'Approved', badgeClass: 'badge badge-approved', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', badgeClass: 'badge badge-rejected', dot: 'bg-rose-400' },
};

const LEAVE_TYPE_LABELS = {
  paid: 'Paid',
  sick: 'Sick',
  unpaid: 'Unpaid',
};

const LEAVE_TYPE_COLORS = {
  paid:   'bg-sky-500/15 text-sky-400 border border-sky-500/25',
  sick:   'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  unpaid: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={cfg.badgeClass}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LeaveTypePill({ type }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${LEAVE_TYPE_COLORS[type] ?? ''}`}>
      {LEAVE_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcDays(start, end) {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
}

// ─── Action Row (inline approve/reject) ───────────────────────────────────────
function ActionRow({ leave, onUpdated }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(null); // 'approved' | 'rejected' | null

  async function handleAction(status) {
    setLoading(status);
    try {
      await api.patch(`/leave/${leave.id}`, {
        status,
        admin_comment: comment.trim() || undefined,
      });
      toast.success(
        `Leave ${status === 'approved' ? '✅ approved' : '❌ rejected'} for ${leave.employee_name}.`
      );
      onUpdated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  if (leave.status !== 'pending') return null;

  return (
    <div className="mt-3 pt-3 border-t border-surface-border space-y-2 animate-fade-in">
      <input
        type="text"
        placeholder="Admin comment (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="field text-xs py-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleAction('approved')}
          disabled={!!loading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                     bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 text-xs font-semibold
                     hover:bg-emerald-600/35 active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          {loading === 'approved' ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Approve
        </button>
        <button
          onClick={() => handleAction('rejected')}
          disabled={!!loading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                     bg-rose-600/20 border border-rose-600/40 text-rose-400 text-xs font-semibold
                     hover:bg-rose-600/35 active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          {loading === 'rejected' ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Reject
        </button>
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="glass-card px-5 py-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaveApprovalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Auth guard — admin only
  useEffect(() => {
    if (user !== null && user !== undefined) {
      if (user.role !== 'admin') {
        toast.error('Admin access required.');
        navigate('/leave');
      }
    }
  }, [user, navigate]);

  const fetchLeaves = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/leave/all');
      setLeaves(data.leaves ?? []);
    } catch (err) {
      toast.error('Failed to load leave requests.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Filtering + search
  const displayed = leaves
    .filter((l) => filter === 'all' || l.status === filter)
    .filter((l) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        l.employee_name?.toLowerCase().includes(q) ||
        l.employee_id?.toLowerCase().includes(q) ||
        l.leave_type?.toLowerCase().includes(q)
      );
    });

  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-1">Admin Panel</p>
          <h1 className="text-3xl font-bold gradient-text">Leave Approvals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage all employee leave requests across the organization.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <StatCard label="Total Requests" value={counts.all} color="text-slate-400" />
          <StatCard label="Pending" value={counts.pending} color="text-amber-400" />
          <StatCard label="Approved" value={counts.approved} color="text-emerald-400" />
          <StatCard label="Rejected" value={counts.rejected} color="text-rose-400" />
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-wrap gap-3 items-center animate-fade-in" style={{ animationDelay: '90ms' }}>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID or leave type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-9 text-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  filter === tab
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === tab ? 'bg-brand-400/30 text-brand-200' : 'bg-surface-muted text-slate-600'
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Table (desktop) / Cards (mobile) ── */}
        {fetching ? (
          <div className="glass-card p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center py-2">
                <div className="w-8 h-8 rounded-full bg-surface-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-muted rounded w-1/4" />
                  <div className="h-2.5 bg-surface-muted rounded w-1/3" />
                </div>
                <div className="h-6 bg-surface-muted rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400 text-sm">
              {search ? 'No results match your search.' : `No ${filter === 'all' ? '' : filter + ' '}leave requests found.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="glass-card hidden md:block overflow-x-auto animate-fade-in" style={{ animationDelay: '120ms' }}>
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Dates</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th>Admin Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((leave, idx) => (
                    <TableRow key={leave.id} leave={leave} idx={idx} onUpdated={fetchLeaves} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {displayed.map((leave, idx) => (
                <MobileCard key={leave.id} leave={leave} idx={idx} onUpdated={fetchLeaves} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Desktop Table Row ─────────────────────────────────────────────────────────
function TableRow({ leave, idx, onUpdated }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(null);

  async function handleAction(status) {
    setLoading(status);
    try {
      await api.patch(`/leave/${leave.id}`, {
        status,
        admin_comment: comment.trim() || undefined,
      });
      toast.success(`Leave ${status} for ${leave.employee_name}.`);
      onUpdated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  const days = calcDays(leave.start_date, leave.end_date);

  return (
    <tr className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
      {/* Employee */}
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {leave.employee_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{leave.employee_name}</p>
            <p className="text-slate-600 text-xs">{leave.employee_id} · {leave.job_title}</p>
          </div>
        </div>
      </td>
      {/* Leave Type */}
      <td><LeaveTypePill type={leave.leave_type} /></td>
      {/* Duration */}
      <td className="text-white font-semibold text-sm">{days}d</td>
      {/* Dates */}
      <td>
        <p className="text-xs">{formatDate(leave.start_date)}</p>
        <p className="text-xs text-slate-500">→ {formatDate(leave.end_date)}</p>
      </td>
      {/* Remarks */}
      <td>
        <span className="text-xs italic text-slate-500 max-w-[140px] block truncate" title={leave.remarks}>
          {leave.remarks || '—'}
        </span>
      </td>
      {/* Status */}
      <td><StatusBadge status={leave.status} /></td>
      {/* Admin comment */}
      <td>
        <span className="text-xs text-slate-500 max-w-[120px] block truncate" title={leave.admin_comment}>
          {leave.admin_comment || '—'}
        </span>
      </td>
      {/* Actions */}
      <td>
        {leave.status === 'pending' ? (
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <input
              type="text"
              placeholder="Comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="field text-xs py-1.5"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => handleAction('approved')}
                disabled={!!loading}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold
                           bg-emerald-600/20 border border-emerald-600/40 text-emerald-400
                           hover:bg-emerald-600/35 active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                {loading === 'approved' ? '…' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={!!loading}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold
                           bg-rose-600/20 border border-rose-600/40 text-rose-400
                           hover:bg-rose-600/35 active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                {loading === 'rejected' ? '…' : '✕ Reject'}
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-600 italic">Resolved</span>
        )}
      </td>
    </tr>
  );
}

// ─── Mobile Card ───────────────────────────────────────────────────────────────
function MobileCard({ leave, idx, onUpdated }) {
  const days = calcDays(leave.start_date, leave.end_date);
  return (
    <div
      className="glass-card p-5 animate-fade-in"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500
                          flex items-center justify-center text-white text-sm font-bold">
            {leave.employee_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{leave.employee_name}</p>
            <p className="text-slate-500 text-xs">{leave.employee_id}</p>
          </div>
        </div>
        <StatusBadge status={leave.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <p className="text-slate-500 mb-0.5">Type</p>
          <LeaveTypePill type={leave.leave_type} />
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Duration</p>
          <p className="text-white font-semibold">{days} {days === 1 ? 'day' : 'days'}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">From</p>
          <p className="text-slate-300">{formatDate(leave.start_date)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">To</p>
          <p className="text-slate-300">{formatDate(leave.end_date)}</p>
        </div>
      </div>

      {leave.remarks && (
        <p className="text-xs italic text-slate-500 mb-3">"{leave.remarks}"</p>
      )}

      {leave.admin_comment && (
        <p className={`text-xs mb-3 ${leave.status === 'rejected' ? 'text-rose-300' : 'text-emerald-300'}`}>
          Admin: {leave.admin_comment}
        </p>
      )}

      <ActionRow leave={leave} onUpdated={onUpdated} />
    </div>
  );
}
