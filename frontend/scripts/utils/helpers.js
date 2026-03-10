/**
 * Writavo Shared Helpers
 * Utilities for all frontend pages
 */
import { Auth, API, timeAgo, avatar, toast } from '../api.js';

export const isLoggedIn = () => Auth.isLoggedIn();
export const getUser = () => Auth.getUser();
export const getAvatarHtml = (user, size = 'sm') => {
  const sizes = { xs: 24, sm: 36, md: 44, lg: 64, xl: 96 };
  const px = typeof size === 'string' ? sizes[size] || 36 : size;
  return avatar(user, px);
};
export { timeAgo, toast };

export const formatCount = (n) => {
  if (!n || n === 0) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};
export const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const formatDateTime = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const setUser = (user) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

export const requireAuth = () => {
  if (!Auth.isLoggedIn()) {
    const page = window.location.pathname.split('/').pop() || '';
    window.location.href = 'login.html' + (page ? `?next=${encodeURIComponent(page)}` : '');
    return false;
  }
  return true;
};

// ─── Theme ─────────────────────────────────────────────────────────────────────
export const initTheme = () => {
  const theme = localStorage.getItem('theme') || 'light';
  applyThemeToDOM(theme);
};

export const getTheme = () => localStorage.getItem('theme') || 'light';

export const setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  applyThemeToDOM(theme);
};

function applyThemeToDOM(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.style.setProperty('--ink', '#e8e6df');
    root.style.setProperty('--ink-soft', '#b8b8b0');
    root.style.setProperty('--ink-muted', '#7a7a74');
    root.style.setProperty('--ink-faint', '#4a4a44');
    root.style.setProperty('--paper', '#141412');
    root.style.setProperty('--paper-warm', '#1c1c1a');
    root.style.setProperty('--paper-hover', '#222220');
    root.style.setProperty('--border', '#2e2e2a');
    root.style.setProperty('--border-soft', '#252523');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyThemeToDOM(prefersDark ? 'dark' : 'light');
    return;
  } else {
    // Reset to light defaults
    root.style.removeProperty('--ink');
    root.style.removeProperty('--ink-soft');
    root.style.removeProperty('--ink-muted');
    root.style.removeProperty('--ink-faint');
    root.style.removeProperty('--paper');
    root.style.removeProperty('--paper-warm');
    root.style.removeProperty('--paper-hover');
    root.style.removeProperty('--border');
    root.style.removeProperty('--border-soft');
  }
}

// ─── Sidebar builder ──────────────────────────────────────────────────────────
export const buildSidebar = (activePage = '') => {
  const user = getUser();
  const nav = [
    { href: 'discover.html', icon: '🏠', label: 'Home', id: 'discover' },
    { href: 'notifications.html', icon: '🔔', label: 'Notifications', id: 'notifications' },
    { href: 'messages.html', icon: '✉️', label: 'Messages', id: 'messages' },
    { href: 'bookmarks.html', icon: '🔖', label: 'Bookmarks', id: 'bookmarks' },
    { href: 'communities.html', icon: '👥', label: 'Communities', id: 'communities' },
    { href: user ? `profile.html?u=${user.username}` : 'login.html', icon: '👤', label: 'Profile', id: 'profile' },
    { href: 'write.html', icon: '✏️', label: 'Write', id: 'write' },
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <a href="discover.html" class="sidebar-logo">Writav<span>o</span></a>
    <nav class="sidebar-nav">
      ${nav.map(item => `
        <a href="${item.href}" class="sidebar-nav-item ${activePage === item.id ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>${item.label}
        </a>
      `).join('')}
    </nav>
    ${user ? `
    <div class="sidebar-user" onclick="window.location.href='settings.html'">
      ${getAvatarHtml(user, 'sm')}
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${user.displayName || user.firstName || user.username}</div>
        <div class="sidebar-user-handle">@${user.username}</div>
      </div>
    </div>
    ` : `
    <div style="padding:16px">
      <a href="login.html" class="btn btn-primary btn-full btn-sm">Sign in</a>
    </div>
    `}
  `;
};

// ─── Debounce ────────────────────────────────────────────────────────────────
export const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// ─── Truncate ────────────────────────────────────────────────────────────────
export const truncate = (str, maxLen = 120) => {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen).trim() + '…';
};

// ─── Reading time ────────────────────────────────────────────────────────────
export const readingTime = (text) => {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
};
