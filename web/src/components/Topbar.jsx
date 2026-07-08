import { Bell, ChevronDown, Github, LogOut, Monitor, Moon, Plus, RefreshCcw, Settings, Sun, UserRound } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { getUserDisplayName, getUserInitials } from '../utils/userDisplay.js';
import Badge from './Badge.jsx';
import Dropdown from './Dropdown.jsx';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

function Topbar({ meta, onPrimaryAction, syncing, auth, syncHistory = [], onNavigate, onLogout }) {
  const [openMenu, setOpenMenu] = useState('');
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const showAction = Boolean(meta.actionLabel);
  const ActionIcon = meta.actionLabel === 'New Chat' ? Plus : RefreshCcw;
  const user = auth?.user;
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const actionLabel = syncing && meta.actionLabel !== 'New Chat' ? 'Syncing...' : meta.actionLabel;
  const recentEvents = syncHistory.slice(0, 4);
  const selectedTheme = themeOptions.find((option) => option.value === themePreference) || themeOptions[2];
  const ThemeIcon = selectedTheme.icon;

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="topbar-actions">
        {auth?.authenticated ? (
          <button className="connected-button" type="button" onClick={() => onNavigate('integrations')} title="View GitHub integration">
            <Github size={18} aria-hidden="true" />
            <span>{displayName}</span>
            <strong>Connected</strong>
            <span className="status-dot" />
          </button>
        ) : (
          <a className="connected-button" href={`${API_BASE_URL}/auth/github`}>
            <Github size={18} aria-hidden="true" />
            <span>{auth?.loading ? 'Checking GitHub' : 'GitHub'}</span>
            <strong>{auth?.loading ? 'Checking' : 'Connect'}</strong>
            <span className="status-dot neutral" />
          </a>
        )}
        {showAction ? (
          <button className="primary-button" type="button" onClick={onPrimaryAction} disabled={syncing}>
            <ActionIcon className={syncing && ActionIcon === RefreshCcw ? 'spin' : ''} size={17} aria-hidden="true" />
            {actionLabel}
          </button>
        ) : null}

        <div className="dropdown-anchor">
          <button
            className="icon-button theme-button"
            type="button"
            aria-label={`Theme preference: ${selectedTheme.label}`}
            aria-expanded={openMenu === 'theme'}
            title={`Theme: ${selectedTheme.label}`}
            onClick={() => setOpenMenu((current) => (current === 'theme' ? '' : 'theme'))}
          >
            <ThemeIcon size={20} aria-hidden="true" />
          </button>
          {openMenu === 'theme' ? (
            <Dropdown onClose={() => setOpenMenu('')}>
              <div className="dropdown-header">
                <strong>Theme</strong>
                <span>Currently using {resolvedTheme} mode</span>
              </div>
              <div className="dropdown-list">
                {themeOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      className={`dropdown-row ${themePreference === option.value ? 'selected-row' : ''}`}
                      type="button"
                      key={option.value}
                      onClick={() => {
                        setThemePreference(option.value);
                        setOpenMenu('');
                      }}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>
                        <strong>{option.label}</strong>
                        <em>{option.value === 'system' ? 'Follow browser or OS' : `Always use ${option.label.toLowerCase()} mode`}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Dropdown>
          ) : null}
        </div>

        <div className="dropdown-anchor">
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="Notifications"
            aria-expanded={openMenu === 'notifications'}
            onClick={() => setOpenMenu((current) => (current === 'notifications' ? '' : 'notifications'))}
          >
            <Bell size={20} aria-hidden="true" />
            {recentEvents.length ? <span /> : null}
          </button>
          {openMenu === 'notifications' ? (
            <Dropdown onClose={() => setOpenMenu('')}>
              <div className="dropdown-header">
                <strong>Notifications</strong>
                <span>{recentEvents.length ? 'Recent sync events' : 'All clear'}</span>
              </div>
              <div className="dropdown-list">
                {recentEvents.length ? (
                  recentEvents.map((event) => (
                    <button className="dropdown-row" type="button" key={event.id} onClick={() => onNavigate('syncHistory')}>
                      <span>
                        <strong>{event.status === 'success' ? 'Sync completed' : 'Sync failed'}</strong>
                        <em>{event.relative || event.time}</em>
                      </span>
                      <Badge variant={event.status === 'failed' ? 'danger' : 'success'}>{event.status}</Badge>
                    </button>
                  ))
                ) : (
                  <p className="dropdown-empty">No new notifications.</p>
                )}
              </div>
            </Dropdown>
          ) : null}
        </div>

        <div className="dropdown-anchor">
          <button
            className="profile-button"
            type="button"
            aria-label="Open profile menu"
            aria-expanded={openMenu === 'profile'}
            onClick={() => setOpenMenu((current) => (current === 'profile' ? '' : 'profile'))}
          >
            <span className="avatar">{initials}</span>
            <ChevronDown size={17} aria-hidden="true" />
          </button>
          {openMenu === 'profile' ? (
            <Dropdown onClose={() => setOpenMenu('')}>
              <div className="dropdown-header">
                <strong>{auth?.authenticated ? displayName : 'Not connected'}</strong>
                <span>{auth?.authenticated ? 'GitHub session active' : 'Connect GitHub to sync data'}</span>
              </div>
              <div className="dropdown-list">
                <button
                  className="dropdown-row"
                  type="button"
                  onClick={() => {
                    setOpenMenu('');
                    onNavigate('settings', { section: 'profile' });
                  }}
                >
                  <UserRound size={17} aria-hidden="true" />
                  <span>
                    <strong>View profile</strong>
                    <em>Open Settings profile</em>
                  </span>
                </button>
                <button
                  className="dropdown-row"
                  type="button"
                  onClick={() => {
                    setOpenMenu('');
                    onNavigate('settings');
                  }}
                >
                  <Settings size={17} aria-hidden="true" />
                  <span>
                    <strong>Settings</strong>
                    <em>Local preferences and account tools</em>
                  </span>
                </button>
                <button className="dropdown-row danger" type="button" onClick={onLogout} disabled={!auth?.authenticated}>
                  <LogOut size={17} aria-hidden="true" />
                  <span>
                    <strong>Logout</strong>
                    <em>{auth?.authenticated ? 'End this session' : 'No active session'}</em>
                  </span>
                </button>
              </div>
            </Dropdown>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
