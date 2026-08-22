import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'badge badge-pending animate-pulse-badge',
    dot: 'bg-amber-400',
  },
  approved: {
    label: 'Approved',
    badgeClass: 'badge badge-approved',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'badge badge-rejected',
    dot: 'bg-rose-400',
  },
};

const LEAVE_TYPE_LABELS = {
  paid: 'Paid Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cfg.badgeClass}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calcDays(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

// ─── Leave Request Form ────────────────────────────────────────────────────────
function LeaveForm({ onSubmitted }) {
  const [form, setForm] = useState({
    leave_type: 'paid',
    start_date: '',
    end_date: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.start_date || !form.end_date) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date cannot be before start date.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/leave', {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        remarks: form.remarks.trim(),
      });
      toast.success('Leave request submitted!');
      setForm({ leave_type: 'paid', start_date: '', end_date: '', remarks: '' });
      onSubmitted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const days = calcDays(form.start_date, form.end_date);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Leave Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          Leave Type
        </label>
        <select
          name="leave_type"
          value={form.leave_type}
          onChange={handleChange}
          className="field appearance-none cursor-pointer"
          required
        >
          <option value="paid">🏖️ Paid Leave</option>
          <option value="sick">🤒 Sick Leave</option>
          <option value="unpaid">📋 Unpaid Leave</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            End Date
          </label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            min={form.start_date}
            className="field"
            required
          />
        </div>
      </div>

      {/* Duration pill */}
      {form.start_date && form.end_date && (
        <div className="flex items-center gap-2 text-sm text-brand-400 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            <strong>{days}</strong> {days === 1 ? 'day' : 'days'} selected
          </span>
        </div>
      )}

      {/* Remarks */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          Remarks <span className="text-slate-600 normal-case font-normal">(optional)</span>
        </label>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          placeholder="Briefly describe the reason for your leave…"
          rows={3}
          className="field resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Submitting…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            Submit Request
          </>
        )}
      </button>
    </form>
  );
}

// ─── Leave History Card ────────────────────────────────────────────────────────
function LeaveCard({ leave, index }) {
  return (
    <div
      className="glass-card p-5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type}
            </span>
            <StatusBadge status={leave.status} />
          </div>
          <p className="text-xs text-slate-500">
            {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
            <span className="ml-2 text-slate-600">
              ({calcDays(leave.start_date, leave.end_date)} {calcDays(leave.start_date, leave.end_date) === 1 ? 'day' : 'days'})
            </span>
          </p>
          {leave.remarks && (
            <p className="text-xs text-slate-400 mt-1 italic">"{leave.remarks}"</p>
          )}
        </div>
        {/* Right — applied date */}
        <span className="text-xs text-slate-600">
          Applied {formatDate(leave.created_at)}
        </span>
      </div>

      {/* Admin comment */}
      {leave.admin_comment && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <p className="text-xs text-slate-500 font-medium mb-0.5 uppercase tracking-wide">Admin Comment</p>
          <p className={`text-sm ${leave.status === 'rejected' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {leave.admin_comment}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeaveRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get('/leave/mine');
      setLeaves(data.leaves ?? []);
    } catch (err) {
      toast.error('Could not load your leave history.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (user === null && !fetching) {
      navigate('/signin');
    }
  }, [user, fetching, navigate]);

  const filtered =
    filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-1">
            Employee Portal
          </p>
          <h1 className="text-3xl font-bold gradient-text">Request Time Off</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hello, <span className="text-slate-300 font-medium">{user?.name ?? '…'}</span> —
            fill in the form below to submit a leave request.
          </p>
        </div>

        {/* ── Form Card ── */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            New Leave Request
          </h2>
          <LeaveForm onSubmitted={fetchLeaves} />
        </div>

        {/* ── History ── */}
        <div className="animate-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white">My Leave History</h2>

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

          {fetching ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-4 bg-surface-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-surface-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3">🏝️</div>
              <p className="text-slate-400 text-sm">
                {filter === 'all'
                  ? "You haven't submitted any leave requests yet."
                  : `No ${filter} requests found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((leave, i) => (
                <LeaveCard key={leave.id} leave={leave} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
