import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Helper — read-only field display
// ---------------------------------------------------------------------------
function ReadOnlyField({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-slate-800 font-medium text-sm">
        {value || <span className="text-slate-400 italic">Not set</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper — editable input field
// ---------------------------------------------------------------------------
function EditableField({ label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`profile-field-${name}`}
        className="text-xs font-semibold uppercase tracking-wider text-slate-400"
      >
        {label}
      </label>
      <input
        id={`profile-field-${name}`}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800
                   focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                   transition placeholder:text-slate-300"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-slate-700 border-b border-slate-100 pb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { user, session } = useAuth();

  // Editable fields (employee scope)
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    profile_picture_url: user?.profile_picture_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep local display state for the fields that can change
  const [localUser, setLocalUser] = useState(user);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCancel = () => {
    setForm({
      phone: localUser?.phone ?? '',
      address: localUser?.address ?? '',
      profile_picture_url: localUser?.profile_picture_url ?? '',
    });
    setEditMode(false);
    setErrorMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.patch(`/users/${user.id}`, form);
      setLocalUser(data.user);
      setEditMode(false);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = editMode ? form.profile_picture_url : localUser?.profile_picture_url;
  const displayName = localUser?.name ?? user?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link
            to="/dashboard"
            id="profile-back-btn"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium text-sm">My Profile</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* ── Profile hero ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg shadow-violet-200">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/40"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/40">
                <UserCircleIcon className="w-16 h-16 text-white/70" />
              </div>
            )}
          </div>

          {/* Name & role */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <p className="text-violet-200 mt-1">{localUser?.job_title}</p>
            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white capitalize">
                {localUser?.role}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                {localUser?.employee_id}
              </span>
            </div>
          </div>

          {/* Edit / Save / Cancel buttons */}
          <div className="sm:ml-auto flex gap-2">
            {!editMode ? (
              <button
                id="profile-edit-btn"
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  id="profile-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-violet-700 text-sm font-semibold hover:bg-violet-50 transition disabled:opacity-60"
                >
                  <CheckIcon className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  id="profile-cancel-btn"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Status messages ─────────────────────────────────────────── */}
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

        {/* ── Personal Details ────────────────────────────────────────── */}
        <SectionCard title="Personal Details">
          {/* Read-only always */}
          <ReadOnlyField label="Full Name" value={localUser?.name} />
          <ReadOnlyField label="Email Address" value={localUser?.email} />

          {/* Editable by employee */}
          {editMode ? (
            <>
              <EditableField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+91 98765 43210"
              />
              <EditableField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St, City"
              />
            </>
          ) : (
            <>
              <ReadOnlyField label="Phone Number" value={localUser?.phone} />
              <ReadOnlyField label="Address" value={localUser?.address} />
            </>
          )}
        </SectionCard>

        {/* ── Job Details ─────────────────────────────────────────────── */}
        <SectionCard title="Job Details">
          <ReadOnlyField label="Job Title" value={localUser?.job_title} />
          <ReadOnlyField label="Employee ID" value={localUser?.employee_id} />
          <ReadOnlyField label="Role" value={localUser?.role} />
        </SectionCard>

        {/* ── Salary ──────────────────────────────────────────────────── */}
        <SectionCard title="Salary Structure">
          <ReadOnlyField
            label="Monthly Salary"
            value={
              localUser?.salary != null
                ? new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(localUser.salary)
                : null
            }
          />
        </SectionCard>

        {/* ── Profile Picture URL ─────────────────────────────────────── */}
        {editMode && (
          <SectionCard title="Profile Picture">
            <div className="sm:col-span-2">
              <EditableField
                label="Profile Picture URL"
                name="profile_picture_url"
                value={form.profile_picture_url}
                onChange={handleChange}
                type="url"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-slate-400 mt-2">
                Paste a publicly accessible image URL. The preview will update after saving.
              </p>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}
