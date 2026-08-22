import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  UserCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Dashboard card definition
// ---------------------------------------------------------------------------
const CARDS = [
  {
    id: 'profile',
    label: 'My Profile',
    description: 'View and update your personal details',
    icon: UserCircleIcon,
    to: '/profile',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-200',
    hoverRing: 'hover:ring-violet-300',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Clock in / out and review history',
    icon: ClockIcon,
    to: '/attendance',
    gradient: 'from-sky-500 to-cyan-600',
    shadow: 'shadow-sky-200',
    hoverRing: 'hover:ring-sky-300',
  },
  {
    id: 'leave',
    label: 'Leave Requests',
    description: 'Apply for leave and track your requests',
    icon: CalendarDaysIcon,
    to: '/leave',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-200',
    hoverRing: 'hover:ring-emerald-300',
  },
  {
    id: 'payroll',
    label: 'My Payroll',
    description: 'View your salary and compensation details',
    icon: BanknotesIcon,
    to: '/payroll',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-200',
    hoverRing: 'hover:ring-amber-300',
  },
];

// ---------------------------------------------------------------------------
// EmployeeDashboard
// ---------------------------------------------------------------------------
export default function EmployeeDashboard() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // AuthContext / router guard will redirect to /signin
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Dayflow
            </span>
            <span className="text-slate-400 text-sm hidden sm:inline">/ Dashboard</span>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            {user?.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-300"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="text-sm text-slate-700 font-medium hidden sm:inline">
              {user?.name}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome banner */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-slate-500 text-base">
            {user?.job_title} · {user?.employee_id}
          </p>
        </div>

        {/* Quick-access cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map(({ id, label, description, icon: Icon, to, gradient, shadow, hoverRing }) => (
            <Link
              key={id}
              to={to}
              id={`dashboard-card-${id}`}
              className={`group relative rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4
                          shadow-md ${shadow} hover:shadow-xl transition-all duration-300
                          hover:-translate-y-1 ring-2 ring-transparent ${hoverRing}`}
            >
              {/* Icon blob */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center
                             shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Text */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                  {label}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              </div>

              {/* Arrow hint */}
              <div className="mt-auto text-xs text-slate-400 group-hover:text-violet-500 transition-colors font-medium flex items-center gap-1">
                Open <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}

          {/* Logout card (not a Link — triggers action) */}
          <button
            id="dashboard-card-logout"
            onClick={handleLogout}
            className="group relative rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4
                       shadow-md shadow-rose-100 hover:shadow-xl hover:shadow-rose-200 transition-all duration-300
                       hover:-translate-y-1 ring-2 ring-transparent hover:ring-rose-300 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center
                            shadow-md group-hover:scale-110 transition-transform duration-300">
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                Logout
              </h2>
              <p className="text-sm text-slate-500 mt-1">Sign out of your account</p>
            </div>
            <div className="mt-auto text-xs text-slate-400 group-hover:text-rose-500 transition-colors font-medium flex items-center gap-1">
              Sign out <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
