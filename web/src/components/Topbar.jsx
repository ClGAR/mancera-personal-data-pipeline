import { Bell, ChevronDown, Github, Plus, RefreshCcw } from 'lucide-react';
import { api } from '../api.js';

function Topbar({ meta, onPrimaryAction, syncing }) {
  const showAction = Boolean(meta.actionLabel);
  const ActionIcon = meta.actionLabel === 'New Chat' ? Plus : RefreshCcw;

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <button className="connected-button" type="button" onClick={api.loginWithGitHub}>
          <Github size={18} aria-hidden="true" />
          <span>GitHub</span>
          <strong>Connected</strong>
          <span className="status-dot" />
        </button>
        {showAction ? (
          <button className="primary-button" type="button" onClick={onPrimaryAction} disabled={syncing}>
            <ActionIcon className={syncing && ActionIcon === RefreshCcw ? 'spin' : ''} size={17} aria-hidden="true" />
            {meta.actionLabel}
          </button>
        ) : null}
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
