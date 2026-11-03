import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Button, Drawer, IconButton, Tooltip } from '@mui/material';
import {
  ArrowUpRight,
  FolderOpen,
  NotebookPen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useApp } from './context';
import { storeAuth } from '../lib/api';
import { useProjects } from '../lib/workbench';
const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/journal', label: 'Decision journal', icon: NotebookPen },
  { to: '/companion', label: 'Twin studio', icon: Users },
];
export function Shell() {
  const { auth, mode, toggleMode } = useApp();
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const projects = useProjects();
  const sidebar = (
    <>
      <Link className="brand" to="/" onClick={() => setMobile(false)}>
        <span className="brand-symbol">
          <Sparkles size={22} />
        </span>
        twin<span className="brand-dot">.</span>
      </Link>
      <div className="workspace-label">
        PERSONAL WORKSPACE <span>01</span>
      </div>
      <nav className="main-nav">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobile(false)}
          >
            <Icon size={19} />
            <span>{label}</span>
            {to === '/twins' && <ChevronRight size={14} />}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-divider" />
      <div className="recent-label">
        RECENT PROJECTS
        <Link to="/projects" aria-label="Browse projects">
          <Plus size={16} />
        </Link>
      </div>
      <div className="recent-list">
        {projects.data
          ?.filter((p) => !p.archived)
          .slice(0, 5)
          .map((s) => (
            <NavLink
              onClick={() => setMobile(false)}
              key={s.id}
              to={`/projects/${s.id}`}
              className="recent-item"
            >
              <span className="tiny-dot" />
              {s.name}
            </NavLink>
          ))}
        {!projects.data?.length && (
          <p>
            Your next project will
            <br />
            find a home here.
          </p>
        )}
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="leaf">✳</span>
          <strong>Your context, carried forward.</strong>
          <p>
            Remember what matters.
            <br />
            Act with more perspective.
          </p>
          <Link to="/projects">
            Open a project <ArrowUpRight size={14} />
          </Link>
        </div>
        <NavLink className="nav-item" to="/settings" onClick={() => setMobile(false)}>
          <Settings size={18} />
          Settings
        </NavLink>
        <div className="account-row">
          <div className="user-avatar">{auth?.user.display_name?.slice(0, 1) || 'Y'}</div>
          <div>
            <strong>{auth?.user.display_name}</strong>
            <small>Personal account</small>
          </div>
          <Tooltip title="Sign out">
            <IconButton size="small" aria-label="Sign out" onClick={() => storeAuth(null)}>
              <LogOut size={16} />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </>
  );
  const label = location.pathname.startsWith('/chat')
    ? 'Conversations'
    : location.pathname.startsWith('/projects')
      ? 'Projects'
      : { '/twins': 'My twins', '/memory': 'Twin memories', '/settings': 'Settings' }[
          location.pathname
        ] ||
        nav.find((n) => n.to === location.pathname)?.label ||
        'Workspace';
  return (
    <div className="app-layout">
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        open={mobile}
        onClose={() => setMobile(false)}
        slotProps={{ paper: { sx: { width: 260 } } }}
      >
        <div className="mobile-sidebar">
          <IconButton
            className="drawer-close"
            aria-label="Close menu"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </IconButton>
          {sidebar}
        </div>
      </Drawer>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <IconButton
              className="mobile-menu"
              aria-label="Open menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </IconButton>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{label}</strong>
          </div>
          <div className="top-actions">
            <span className="private-badge">
              <span className="tiny-dot" />
              Your private space
            </span>
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton aria-label="Toggle color theme" onClick={toggleMode}>
                {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>
            </Tooltip>
            <Button
              component={Link}
              to="/projects"
              size="small"
              startIcon={<Plus size={16} />}
              variant="outlined"
            >
              Start a task
            </Button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
