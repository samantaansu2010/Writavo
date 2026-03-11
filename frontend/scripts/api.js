/**
 * Writavo API Client v2
 * Single source of truth for all backend communication.
 * Usage: import { API, Auth, Posts, Users, Feed, Communities, Notifications, Messages, Media } from './api.js';
 */

const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5000/api`
    : '/api';

const BASE = API_URL;

// Core fetch wrapper ───────────────────────────────────────────────────────
async function request(method, path, body = null, isFormData = false) {
  const token   = localStorage.getItem('accessToken');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${BASE}${path}`, opts);

  // Auto-refresh on 401
  if (res.status === 401 && localStorage.getItem('refreshToken')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      res = await fetch(`${BASE}${path}`, { ...opts, headers });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

async function tryRefresh() {
  try {
    const rt  = localStorage.getItem('refreshToken');
    if (!rt) return false;
    const res  = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { Auth.clear(); return false; }
    const data = await res.json();
    localStorage.setItem('accessToken',  data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return true;
  } catch { return false; }
}

// Low-level helpers
export const API = {
  get:    (path)             => request('GET',    path),
  post:   (path, body)       => request('POST',   path, body),
  put:    (path, body)       => request('PUT',    path, body),
  patch:  (path, body)       => request('PATCH',  path, body),
  delete: (path)             => request('DELETE', path),
  upload: (path, formData)   => request('POST',   path, formData, true),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const Auth = {
  isLoggedIn() { return !!localStorage.getItem('accessToken'); },

  getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  },

  store(data) {
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  },

  clear() {
    ['accessToken','refreshToken','user','pendingEmail'].forEach(k => localStorage.removeItem(k));
  },

  async signup(payload) {
    const res = await API.post('/auth/signup', payload);
    if (res.data?.accessToken) this.store(res.data);
    return res;
  },

  async login(email, password) {
    const res = await API.post('/auth/login', { email, password });
    if (res.data?.accessToken) this.store(res.data);
    return res;
  },

  async logout() {
    try { await API.post('/auth/logout', {}); } catch {}
    this.clear();
    window.location.href = 'index.html';
  },

  async getMe() {
    const res = await API.get('/auth/me');
    if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  },

  redirectIfLoggedIn(to = 'discover.html') {
    if (this.isLoggedIn()) window.location.href = to;
  },

  requireLogin(returnTo) {
    if (!this.isLoggedIn()) {
      const back = returnTo || window.location.pathname.split('/').pop();
      window.location.href = `login.html?next=${encodeURIComponent(back)}`;
      return false;
    }
    return true;
  },
};

// ─── Posts ────────────────────────────────────────────────────────────────────
export const Posts = {
  list:       (q = {})  => API.get(`/posts?${qs(q)}`),
  feed:       (q = {})  => API.get(`/posts/feed?${qs(q)}`),
  get:        (slug)    => API.get(`/posts/${slug}`),
  create:     (body)    => API.post('/posts', body),
  update:     (id, body)=> API.put(`/posts/${id}`, body),
  delete:     (id)      => API.delete(`/posts/${id}`),
  like:       (id)      => API.post(`/posts/${id}/like`, {}),
  restack:    (id)      => API.post(`/posts/${id}/restack`, {}),
  bookmark:   (id)      => API.post(`/posts/${id}/bookmark`, {}),
  comments:   (id, q={})=> API.get(`/posts/${id}/comments?${qs(q)}`),
  addComment: (id, body)=> API.post(`/posts/${id}/comments`, body),
  editComment:(id,cid,b)=> API.put(`/posts/${id}/comments/${cid}`, b),
  delComment: (id, cid) => API.delete(`/posts/${id}/comments/${cid}`),
  likeComment:(id, cid) => API.post(`/posts/${id}/comments/${cid}/like`, {}),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const Users = {
  profile:   (username)  => API.get(`/users/${username}`),
  posts:     (username, q={}) => API.get(`/users/${username}/posts?${qs(q)}`),
  followers: (idOrUsername)  => API.get(`/users/${idOrUsername}/followers`),
  following: (idOrUsername)  => API.get(`/users/${idOrUsername}/following`),
  follow:    (idOrUsername)  => API.post(`/users/${idOrUsername}/follow`, {}),
  update:    (body)      => API.put('/users/profile', body),
  settings:  (body)      => API.put('/users/settings', body),
  bookmarks: (q={})      => API.get(`/users/me/bookmarks?${qs(q)}`),
  search:    (q)         => API.get(`/users/search?q=${encodeURIComponent(q)}`),
};

// ─── Feed ─────────────────────────────────────────────────────────────────────
export const Feed = {
  personalized: (q={}) => API.get(`/feed?${qs(q)}`),
  trending:     (q={}) => API.get(`/feed/trending?${qs(q)}`),
  explore:      (q={}) => API.get(`/feed/explore?${qs(q)}`),
  similar:      (postId, q={}) => API.get(`/feed/similar/${postId}?${qs(q)}`),
};

// ─── Communities ──────────────────────────────────────────────────────────────
export const Communities = {
  list:         (q={})       => API.get(`/communities?${qs(q)}`),
  mine:         ()           => API.get('/communities/mine'),
  get:          (slug)       => API.get(`/communities/${slug}`),
  create:       (body)       => API.post('/communities', body),
  update:       (id, body)   => API.put(`/communities/${id}`, body),
  delete:       (id)         => API.delete(`/communities/${id}`),
  join:         (id)         => API.post(`/communities/${id}/join`, {}),
  members:      (id)         => API.get(`/communities/${id}/members`),
  channels:     (id)         => API.get(`/communities/${id}/channels`),
  createChannel:(id, body)   => API.post(`/communities/${id}/channels`, body),
  messages:     (id, ch, q={}) => API.get(`/communities/${id}/channels/${ch}/messages?${qs(q)}`),
  sendMessage:  (id, ch, body) => API.post(`/communities/${id}/channels/${ch}/messages`, body),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const Notifications = {
  list:       (q={}) => API.get(`/notifications?${qs(q)}`),
  markRead:   (id)   => API.put(`/notifications/${id}/read`, {}),
  markAll:    ()     => API.put('/notifications/read-all', {}),
  delete:     (id)   => API.delete(`/notifications/${id}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const Messages = {
  conversations: ()          => API.get('/messages/conversations'),
  list:          (userId, q={}) => API.get(`/messages/${userId}?${qs(q)}`),
  send:          (userId, body) => API.post(`/messages/${userId}`, body),
  delete:        (id)        => API.delete(`/messages/${id}`),
};

// ─── Media ────────────────────────────────────────────────────────────────────
export const Media = {
  upload(file, mediaType = 'image', altText = '') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mediaType', mediaType);
    fd.append('altText', altText);
    return API.upload('/media/upload', fd);
  },
  list:   (q={}) => API.get(`/media?${qs(q)}`),
  delete: (id)   => API.delete(`/media/${id}`),
};

// ─── Search ───────────────────────────────────────────────────────────────────
export const Search = {
  all:      (q, t) => API.get(`/search?q=${encodeURIComponent(q)}${t?`&type=${t}`:''}`),
  trending: ()     => API.get('/search/trending'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function qs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function timeAgo(dateStr) {
  const sec = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  if (sec < 604800)return `${Math.floor(sec/86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

export function avatar(user, size = 36) {
  if (user?.avatar) return `<img src="${user.avatar}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" alt="${user.displayName||user.username}">`;
  const initials = ((user?.firstName?.[0]||'') + (user?.lastName?.[0]||'')).toUpperCase() || (user?.username?.[0]||'?').toUpperCase();
  const colors   = ['#2c3e6b','#4a7c59','#7b3f3f','#6b3d7a','#8b6914','#2c7873'];
  const bg       = colors[initials.charCodeAt(0) % colors.length];
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${size*0.38}px;flex-shrink:0">${initials}</div>`;
}

export function toast(msg, type = 'default', duration = 3000) {
  let el = document.getElementById('__toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:#222;color:white;padding:11px 22px;border-radius:6px;font-size:0.86rem;font-weight:500;transition:transform 0.3s;z-index:9999;pointer-events:none;white-space:nowrap;max-width:90vw;text-align:center';
    document.body.appendChild(el);
  }
  if (type === 'error')   el.style.background = '#dc2626';
  else if (type === 'success') el.style.background = '#166534';
  else el.style.background = '#222';
  el.textContent = msg;
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el.__t);
  el.__t = setTimeout(() => { el.style.transform = 'translateX(-50%) translateY(80px)'; }, duration);
}

export function spinner(text = 'Loading…') {
  return `<div style="text-align:center;padding:40px;color:#aaa;font-size:0.9rem">${text}</div>`;
}

export function errorBlock(msg) {
  return `<div style="text-align:center;padding:40px;color:#dc2626;font-size:0.9rem">⚠️ ${msg}</div>`;
}

// ─── Default export: unified API for pages that use `import api from './api.js'` ───
const api = {
  get: API.get,
  post: API.post,
  put: API.put,
  patch: API.patch,
  delete: API.delete,




  getProfile: (username) => Users.profile(username),
  getUserPosts: (username, q) => Users.posts(username, q),
  followUser: (idOrUsername) => Users.follow(idOrUsername),
  updateProfile: (body) => Users.update(body),
  updateSettings: (body) => Users.settings(body),
  logout: () => Auth.logout(),
  getNotifications: (q) => Notifications.list(q || {}),
  getConversations: () => Messages.conversations(),
  getMessages: (userId, q) => Messages.list(userId, q || {}),
  sendMessage: (userId, body) => Messages.send(userId, body),
  searchUsers: (q) => Users.search(q),
  getPost: (slug) => Posts.get(slug),
  likePost: (id) => Posts.like(id),
  deletePost: (id) => Posts.delete(id),
  getComments: (id, q) => Posts.comments(id, q || {}),
  addComment: (id, body) => Posts.addComment(id, body),
  getSimilarPosts: (postId, limit) => Feed.similar(postId, limit ? { limit } : {}),
  track: (event, meta) => API.post('/admin/track', { event, ...meta }),
  uploadMedia: (fd) => {
    const file = fd instanceof FormData ? fd.get('file') : fd?.file;
    const mediaType = fd instanceof FormData ? fd.get('mediaType') || 'image' : fd?.mediaType || 'image';
    const altText = fd instanceof FormData ? fd.get('altText') || '' : fd?.altText || '';
    return Media.upload(file, mediaType, altText);
  },
};
export default api;
