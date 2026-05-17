import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import api from './api';
import './index.css';

/* ─────────────────────────────────────────────
   Theme Context
───────────────────────────────────────────── */
const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tf-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tf-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // Add transition class briefly for smooth swap
    document.documentElement.classList.add('theme-transition');
    setTheme(t => t === 'light' ? 'dark' : 'light');
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 350);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   Dark Mode Toggle Button
───────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="theme-toggle-thumb">
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Global Search Bar
───────────────────────────────────────────── */
function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults(null); setOpen(false); return; }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`)
      .then(r => { setResults(r.data); setOpen(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="tf-input"
          placeholder="Search workspaces & projects..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          style={{
            paddingLeft: '36px',
            paddingRight: loading ? '36px' : '12px',
            fontSize: '0.875rem',
            height: '38px',
          }}
        />
        {loading && (
          <div className="tf-spinner" style={{ width: 16, height: 16, borderWidth: 2, position: 'absolute', right: 12 }} />
        )}
      </div>

      {open && results && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--surface-1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
          {results.workspaces.length === 0 && results.projects.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No results found.</div>
          ) : (
            <>
              {results.workspaces.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspaces</div>
                  {results.workspaces.map(w => (
                    <div key={w.id} onClick={() => { navigate(`/workspaces/${w.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                        {w.description && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{w.description.slice(0,60)}{w.description.length > 60 ? '…' : ''}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects</div>
                  {results.projects.map(p => (
                    <div key={p.id} onClick={() => { navigate(`/projects/${p.id}`); setQuery(''); setOpen(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.status} · {p.priority}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Left Sidebar
───────────────────────────────────────────── */
function Sidebar({ isOpen, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const roleColor = user.role === 'admin' ? 'var(--accent)' : 'var(--done)';

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.875rem',
    textDecoration: 'none',
    padding: '9px 12px',
    borderRadius: '10px',
    background: isActive ? 'var(--accent-subtle)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    transition: 'all 0.18s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  });

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      <aside className={`tf-sidebar ${isOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '1.1rem 1rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.4px', fontFamily: 'Outfit, Inter, sans-serif' }}>
              Task<span className="gradient-text">Flow</span>
            </span>
          </div>
          <button className="mobile-only close-sidebar" onClick={toggleSidebar}>×</button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="section-title">Navigation</div>
          <NavLink to="/dashboard" style={navLinkStyle} onClick={toggleSidebar}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background = 'transparent'; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/workspaces" style={navLinkStyle} onClick={toggleSidebar}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Workspaces
          </NavLink>
          <NavLink to="/projects" style={navLinkStyle} onClick={toggleSidebar}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            Projects
          </NavLink>
        </div>

        {/* User info */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--sidebar-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px', marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(var(--accent-rgb),0.3)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user.role}
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="tf-btn tf-btn-ghost"
            style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }}
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────
   Desktop Top Bar
───────────────────────────────────────────── */
function TopBar({ toggleSidebar }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="tf-topbar desktop-search-bar">
      {/* Mobile menu toggle */}
      <button
        className="mobile-only"
        onClick={toggleSidebar}
        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
      >
        ☰
      </button>

      {/* Search — center */}
      <div style={{ flex: 1 }}>
        <GlobalSearch />
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

        {/* Notification bell (decorative) */}
        <button style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>

        {/* Dark mode toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(var(--accent-rgb),0.35)',
          cursor: 'default',
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mobile Top Bar
───────────────────────────────────────────── */
function MobileTopBar({ toggleSidebar }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mobile-topbar" style={{
      display: 'none', flexDirection: 'column', gap: '8px',
      padding: '0.75rem 1rem',
      background: 'var(--topbar-bg)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--topbar-border)', position: 'sticky', top: 0, zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>
          ☰
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
          Task<span style={{ color: 'var(--accent)' }}>Flow</span>
        </div>
        <ThemeToggle />
      </div>
      <GlobalSearch />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Auth Guard
───────────────────────────────────────────── */
function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="tf-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading workspace...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/* ─────────────────────────────────────────────
   App Layout
───────────────────────────────────────────── */
function AppLayout({ children }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen(p => !p);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDark ? 'var(--bg)' : 'transparent', transition: 'background 0.3s ease' }}>
      {user && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggle} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden', background: 'transparent' }}>
        {user && <MobileTopBar toggleSidebar={toggle} />}
        {user && <TopBar toggleSidebar={toggle} />}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Root App
───────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/dashboard"   element={<Guard><Dashboard /></Guard>} />
              <Route path="/workspaces"  element={<Guard><Workspaces /></Guard>} />
              <Route path="/workspaces/:id" element={<Guard><WorkspaceDetail /></Guard>} />
              <Route path="/projects"    element={<Guard><Projects /></Guard>} />
              <Route path="/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
              <Route path="/workspaces/:workspaceId/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
              <Route path="*"            element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
