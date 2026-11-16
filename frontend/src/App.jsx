import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Search, Inbox, Settings, LogOut,
  Building, ShieldCheck, FileText, Bell, Sparkles
} from 'lucide-react';
import api from './api';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import AccessRequestsPage from './pages/AccessRequestsPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('triad_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('triad_user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'search' | 'requests' | 'settings' | 'detail'
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Toast Notification helper
  function notify(msg) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // Handle successful login/registration
  function handleAuthSuccess(authedUser, authToken) {
    setUser(authedUser);
    setToken(authToken);
    setActiveTab('documents');
  }

  // Handle signout
  function handleSignOut() {
    localStorage.removeItem('triad_token');
    localStorage.removeItem('triad_user');
    setToken(null);
    setUser(null);
    setSelectedDocId(null);
    notify('Signed out successfully.');
  }

  // Check pending requests for division
  useEffect(() => {
    if (token) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [token, activeTab]);

  async function fetchPendingCount() {
    try {
      const res = await api.get('/access/requests', { params: { scope: 'incoming', status: 'pending' } });
      setPendingRequestsCount(res.data.count || 0);
    } catch {
      // ignore in background
    }
  }

  // Select document to view details
  function handleSelectDoc(docId) {
    setSelectedDocId(docId);
    setActiveTab('detail');
  }

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} notify={notify} />;
  }

  const navItems = [
    { id: 'documents', label: 'Document Hub', icon: LayoutDashboard },
    { id: 'search', label: 'Advanced Search', icon: Search },
    { id: 'requests', label: 'Access Requests', icon: Inbox, badge: pendingRequestsCount },
    { id: 'settings', label: 'Dynamic Metadata & Admin', icon: Settings },
  ];

  return (
    <div className="app-layout">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Sparkles size={16} color="#818CF8" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <div className="brand-title">triad.ai</div>
            <span className="brand-sub">DOCUMENT SYSTEM</span>
          </div>
        </div>

        {/* Division Indicator */}
        <div className="division-badge-box">
          <span>Your Assigned Division</span>
          <strong>{user.division}</strong>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !selectedDocId;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDocId(null);
                  setActiveTab(item.id);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-row">
            <div className="user-avatar">
              {(user.name || 'User')[0].toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role === 'admin' ? 'Administrator' : 'Staff Member'}</span>
            </div>
          </div>

          <button className="btn-signout" onClick={handleSignOut}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="main-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2>
              {activeTab === 'detail'
                ? 'Document Details & Permissions'
                : activeTab === 'documents'
                ? 'Document Hub'
                : activeTab === 'search'
                ? 'Advanced Search Engine'
                : activeTab === 'requests'
                ? 'Access Requests Inbox'
                : 'Dynamic Metadata & System Settings'}
            </h2>
          </div>

          <div className="topbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
              <span className="badge badge-division">{user.division}</span>
              <span className="badge badge-success">{user.role === 'admin' ? 'ADMIN' : 'USER'}</span>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <main className="content-body">
          {activeTab === 'detail' && selectedDocId ? (
            <DocumentDetailPage
              docId={selectedDocId}
              user={user}
              onBack={() => {
                setSelectedDocId(null);
                setActiveTab('documents');
              }}
              notify={notify}
            />
          ) : activeTab === 'search' ? (
            <AdvancedSearchPage
              user={user}
              onSelectDoc={handleSelectDoc}
              notify={notify}
            />
          ) : activeTab === 'requests' ? (
            <AccessRequestsPage
              user={user}
              onSelectDoc={handleSelectDoc}
              notify={notify}
            />
          ) : activeTab === 'settings' ? (
            <AdminSettingsPage
              user={user}
              notify={notify}
            />
          ) : (
            <DashboardPage
              user={user}
              onSelectDoc={handleSelectDoc}
              notify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}
