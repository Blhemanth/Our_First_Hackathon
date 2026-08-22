import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';

// ─── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== 'admin') return <Navigate to="/leave" replace />;
  return children;
}

// ─── Placeholder pages ─────────────────────────────────────────────────────────
function PlaceholderSignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const nav = require('react-router-dom').useNavigate();

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await signIn(email, password);
      nav('/leave');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper flex items-center justify-center min-h-screen">
      <div className="glass-card p-8 w-full max-w-sm space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dayflow</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} className="field" required />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} className="field" required />
          {err && <p className="text-rose-400 text-xs">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="page-wrapper flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <svg className="w-10 h-10 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-slate-400 text-sm">Loading Dayflow…</p>
      </div>
    </div>
  );
}

// ─── Simple Nav ────────────────────────────────────────────────────────────────
function Nav() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border"
      style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/leave" className="text-lg font-bold gradient-text">Dayflow</Link>
        <div className="flex items-center gap-4">
          <Link to="/leave" className="text-sm text-slate-400 hover:text-white transition-colors">
            My Leave
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin/leave" className="text-sm text-slate-400 hover:text-white transition-colors">
              Approvals
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500
                            flex items-center justify-center text-white text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{user.name}</span>
          </div>
          <button onClick={signOut}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function AppContent() {
  return (
    <>
      <Nav />
      <div className="pt-14">
        <Routes>
          <Route path="/signin" element={<PlaceholderSignIn />} />
          <Route path="/leave" element={
            <ProtectedRoute><LeaveRequestPage /></ProtectedRoute>
          } />
          <Route path="/admin/leave" element={
            <AdminRoute><LeaveApprovalPage /></AdminRoute>
          } />
          <Route path="/" element={<Navigate to="/leave" replace />} />
          <Route path="*" element={<Navigate to="/leave" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#191d2b',
              color: '#e2e8f0',
              border: '1px solid #252a3a',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#191d2b' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#191d2b' } },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
