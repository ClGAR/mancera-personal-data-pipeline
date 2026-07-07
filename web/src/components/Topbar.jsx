import { Bell, ChevronDown, Github, RefreshCcw } from 'lucide-react';
import { api } from '../api.js';

function Topbar({ onSyncNow, syncing }) {
  return (
    <header className="topbar">
      <div className="page-title">
        <h1>Overview</h1>
        <p>Your GitHub activity pipeline at a glance.</p>
      </div>

      <div className="topbar-actions">
        <button className="connected-button" type="button" onClick={api.loginWithGitHub}>
          <Github size={18} aria-hidden="true" />
          <span>GitHub</span>
          <strong>Connected</strong>
          <span className="status-dot" />
        </button>
        <button className="primary-button" type="button" onClick={onSyncNow} disabled={syncing}>
          <RefreshCcw className={syncing ? 'spin' : ''} size={17} aria-hidden="true" />
          Sync Now
        </button>
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Bell size={20} aria-hidden="true" />
          <span />
        </button>
        <button className="profile-button" type="button" aria-label="Open profile menu">
          <span className="avatar">AM</span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
