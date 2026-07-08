import { Bell, ChevronDown, Github, Plus, RefreshCcw } from 'lucide-react';
import { API_BASE_URL } from '../api.js';
import { getUserDisplayName, getUserInitials } from '../utils/userDisplay.js';

function Topbar({ meta, onPrimaryAction, syncing, auth }) {
  const showAction = Boolean(meta.actionLabel);
  const ActionIcon = meta.actionLabel === 'New Chat' ? Plus : RefreshCcw;
  const user = auth?.user;
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const actionLabel = syncing && meta.actionLabel !== 'New Chat' ? 'Syncing...' : meta.actionLabel;

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="topbar-actions">
        {auth?.authenticated ? (
          <button className="connected-button" type="button">
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
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Bell size={20} aria-hidden="true" />
          <span />
        </button>
        <button className="profile-button" type="button" aria-label="Open profile menu">
          <span className="avatar">{initials}</span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
