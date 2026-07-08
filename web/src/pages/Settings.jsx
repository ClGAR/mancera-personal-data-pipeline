import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  Database,
  Download,
  Github,
  KeyRound,
  Monitor,
  Moon,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { getUserDisplayName, getUserEmail, getUserInitials, getUserUsername } from '../utils/userDisplay.js';

const settingsNav = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'github', label: 'GitHub Account', icon: Github },
  { id: 'sync', label: 'Sync Preferences', icon: RefreshCcw },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'privacy', label: 'Data Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger Zone', icon: Zap, danger: true }
];

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

const quickActions = [
  { title: 'Sync Now', detail: 'Trigger an immediate data sync', icon: RefreshCcw, tone: 'primary', action: 'sync' },
  { title: 'Export My Data', detail: 'Download your data snapshot', icon: Download, tone: 'primary', action: 'export' },
  { title: 'Clear Local Cache', detail: 'Clear local preferences and cached UI state.', icon: Trash2, tone: 'danger', action: 'clear' }
];

const summaryIcons = [Calendar, Zap, Database, RefreshCcw];

const defaultSyncPrefs = {
  autoSyncHourly: true,
  notifyN8n: false,
  includePrivateRepos: true
};

const defaultNotificationPrefs = {
  syncSuccess: true,
  syncFailure: true,
  aiFallback: true
};

function Settings({
  auth,
  dashboardData,
  settingsSection,
  setSettingsSection,
  onRunSync,
  onExportData,
  onClearLocalCache,
  notify,
  syncing
}) {
  const user = auth?.user;
  const displayName = auth?.authenticated ? getUserDisplayName(user) : 'GitHub user';
  const username = auth?.authenticated ? getUserUsername(user) : 'Not connected';
  const email = auth?.authenticated ? getUserEmail(user) : 'Not provided by GitHub';
  const initials = auth?.authenticated ? getUserInitials(user) : 'GH';
  const [profileForm, setProfileForm] = useState({ displayName, email, username });
  const [syncPrefs, setSyncPrefs] = useState(() => readStoredObject('pdp:sync-preferences', defaultSyncPrefs));
  const [notificationPrefs, setNotificationPrefs] = useState(() =>
    readStoredObject('pdp:notification-preferences', defaultNotificationPrefs)
  );
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [cacheConfirmOpen, setCacheConfirmOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const activeSection = settingsSection || 'profile';
  const topRepository = dashboardData?.topRepos?.source === 'api' ? dashboardData?.topRepos?.repositories?.[0]?.name : null;
  const latestSync = dashboardData?.sync?.source === 'api' ? dashboardData?.sync?.overviewJobs?.[0]?.time : null;
  const accountSummary = [
    ['GitHub username', username],
    ['Email', email],
    ['Top repository', topRepository || 'Sync data pending'],
    ['Last sync', latestSync || 'Not synced yet']
  ];

  useEffect(() => {
    setProfileForm({ displayName, email, username });
  }, [displayName, email, username]);

  function saveProfile(event) {
    event.preventDefault();
    notify?.('Saved locally for this session.', 'success', 'Profile saved');
  }

  function saveSyncPreferences() {
    window.localStorage.setItem('pdp:sync-preferences', JSON.stringify(syncPrefs));
    notify?.('Sync preferences saved in localStorage.', 'success', 'Saved locally');
  }

  function saveNotificationPreferences() {
    window.localStorage.setItem('pdp:notification-preferences', JSON.stringify(notificationPrefs));
    notify?.('Notification preferences saved in localStorage.', 'success', 'Saved locally');
  }

  function handleQuickAction(action) {
    if (action === 'sync') onRunSync?.();
    if (action === 'export') onExportData?.();
    if (action === 'clear') setCacheConfirmOpen(true);
  }

  function confirmClearLocalCache() {
    setCacheConfirmOpen(false);
    onClearLocalCache?.();
  }

  return (
    <section className="settings-layout">
      <aside className="card settings-nav-card">
        {settingsNav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={`settings-nav-item ${activeSection === item.id ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
              type="button"
              key={item.id}
              onClick={() => setSettingsSection(item.id)}
            >
              <Icon size={20} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </aside>

      <article className="card profile-form-card">
        <SettingsSection
          section={activeSection}
          auth={auth}
          initials={initials}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          saveProfile={saveProfile}
          syncPrefs={syncPrefs}
          setSyncPrefs={setSyncPrefs}
          saveSyncPreferences={saveSyncPreferences}
          notificationPrefs={notificationPrefs}
          setNotificationPrefs={setNotificationPrefs}
          saveNotificationPreferences={saveNotificationPreferences}
          themePreference={themePreference}
          resolvedTheme={resolvedTheme}
          setThemePreference={setThemePreference}
          notify={notify}
          onExportData={onExportData}
          onRequestClearLocalCache={() => setCacheConfirmOpen(true)}
          onDisconnect={() => setDisconnectOpen(true)}
          syncing={syncing}
        />
      </article>

      <aside className="settings-side">
        <article className="card account-summary-card">
          <h2>Account Summary</h2>
          <div className="account-user-row">
            <span className="account-avatar">
              <UserRound size={28} aria-hidden="true" />
            </span>
            <div>
              <strong>{displayName}</strong>
              <Badge variant={auth?.authenticated ? 'success' : 'neutral'}>{auth?.authenticated ? 'GitHub Connected' : 'Not Connected'}</Badge>
            </div>
          </div>
          <dl className="summary-list">
            {accountSummary.map(([label, value], index) => {
              const Icon = summaryIcons[index] || KeyRound;

              return (
                <div key={label}>
                  <dt>
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              );
            })}
          </dl>
          <button className="text-link" type="button" onClick={() => setSettingsSection('privacy')}>
            View account activity
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </article>

        <article className="card quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="quick-action-list">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  className="quick-action-row"
                  type="button"
                  key={action.title}
                  onClick={() => handleQuickAction(action.action)}
                  disabled={action.action === 'sync' && syncing}
                >
                  <span className={`quick-action-icon ${action.tone}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{action.title}</strong>
                    <em>{action.action === 'sync' && syncing ? 'Sync in progress' : action.detail}</em>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </article>
      </aside>

      <div className="security-banner settings-banner">
        <span className="security-icon">
          <ShieldCheck size={25} aria-hidden="true" />
        </span>
        <div>
          <strong>Security notes</strong>
          <p>Secrets stay in `server/.env`; production OAuth token encryption is still on the roadmap.</p>
        </div>
        <button className="text-link" type="button" onClick={() => setSecurityOpen(true)}>
          Learn more about security
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {disconnectOpen ? (
        <Modal
          title="Disconnect GitHub"
          onClose={() => setDisconnectOpen(false)}
          footer={<button className="primary-button" type="button" onClick={() => setDisconnectOpen(false)}>I understand</button>}
        >
          <p className="modal-note">Backend disconnect endpoint is not implemented yet.</p>
          <p>This action is intentionally not faked. Add a backend disconnect route before removing stored GitHub account access.</p>
        </Modal>
      ) : null}

      {cacheConfirmOpen ? (
        <Modal
          title="Clear local cache"
          onClose={() => setCacheConfirmOpen(false)}
          footer={
            <>
              <button className="outline-button neutral" type="button" onClick={() => setCacheConfirmOpen(false)}>
                Cancel
              </button>
              <button className="primary-button danger-primary" type="button" onClick={confirmClearLocalCache}>
                Clear local cache
              </button>
            </>
          }
        >
          <p className="modal-note">
            This clears local UI preferences, saved settings, and cached dashboard state in this browser. It does not delete your Supabase data or
            GitHub account.
          </p>
        </Modal>
      ) : null}

      {securityOpen ? (
        <Modal title="Security notes" onClose={() => setSecurityOpen(false)}>
          <ul className="modal-list">
            <li>`server/.env` must not be committed.</li>
            <li>Supabase service role key is backend-only.</li>
            <li>OAuth tokens should be encrypted before production.</li>
            <li>Webhook URLs should be treated as sensitive.</li>
          </ul>
        </Modal>
      ) : null}
    </section>
  );
}

function SettingsSection({
  section,
  auth,
  initials,
  profileForm,
  setProfileForm,
  saveProfile,
  syncPrefs,
  setSyncPrefs,
  saveSyncPreferences,
  notificationPrefs,
  setNotificationPrefs,
  saveNotificationPreferences,
  themePreference,
  resolvedTheme,
  setThemePreference,
  notify,
  onExportData,
  onRequestClearLocalCache,
  onDisconnect
}) {
  if (section === 'github') {
    return (
      <>
        <div className="section-title">
          <h2>GitHub Account</h2>
          <p>Reconnect GitHub when you need to refresh OAuth access.</p>
        </div>
        <dl className="modal-detail-list settings-detail-block">
          <div>
            <dt>Status</dt>
            <dd>{auth?.authenticated ? 'Connected' : 'Not connected'}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{auth?.user?.username || 'Not connected'}</dd>
          </div>
        </dl>
        <a className="primary-button save-button" href={`${API_BASE_URL}/auth/github`}>
          <Github size={16} aria-hidden="true" />
          Reconnect GitHub
        </a>
      </>
    );
  }

  if (section === 'sync') {
    return (
      <>
        <div className="section-title">
          <h2>Sync Preferences</h2>
          <p>These preferences are stored locally until backend persistence is added.</p>
        </div>
        <LocalOnlyNote />
        <div className="settings-form">
          <ToggleRow label="Auto-sync hourly" checked={syncPrefs.autoSyncHourly} onChange={(value) => setSyncPrefs({ ...syncPrefs, autoSyncHourly: value })} />
          <ToggleRow label="Notify n8n after sync" checked={syncPrefs.notifyN8n} onChange={(value) => setSyncPrefs({ ...syncPrefs, notifyN8n: value })} />
          <ToggleRow
            label="Include private repositories"
            checked={syncPrefs.includePrivateRepos}
            onChange={(value) => setSyncPrefs({ ...syncPrefs, includePrivateRepos: value })}
          />
          <button className="primary-button save-button" type="button" onClick={saveSyncPreferences}>
            Save locally
          </button>
        </div>
      </>
    );
  }

  if (section === 'privacy') {
    return (
      <>
        <div className="section-title">
          <h2>Data Privacy</h2>
          <p>Your synced repository, commit, and sync-run metadata is stored in Supabase for dashboard analytics.</p>
        </div>
        <ul className="modal-list">
          <li>GitHub profile metadata from OAuth.</li>
          <li>Repository names, visibility, URLs, and pushed dates.</li>
          <li>Commit SHAs, messages, authors, and commit timestamps.</li>
          <li>Sync run status, counts, timestamps, and error messages.</li>
        </ul>
        <button className="primary-button save-button" type="button" onClick={onExportData}>
          <Download size={16} aria-hidden="true" />
          Export My Data
        </button>
      </>
    );
  }

  if (section === 'appearance') {
    return (
      <>
        <div className="section-title">
          <h2>Appearance</h2>
          <p>Choose how the dashboard theme should behave on this browser.</p>
        </div>
        <LocalOnlyNote text="Saved in this browser and applied immediately." />
        <div className="settings-form">
          <label>
            <span>Theme Preference</span>
            <select
              className="settings-select"
              value={themePreference}
              onChange={(event) => setThemePreference(event.target.value)}
              aria-label="Theme preference"
            >
              {themeOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <em>Currently using {resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)} mode.</em>
          </label>
          <div className="theme-option-grid">
            {themeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  className={`theme-option-card ${themePreference === option.value ? 'active' : ''}`}
                  type="button"
                  key={option.value}
                  onClick={() => setThemePreference(option.value)}
                >
                  <Icon size={20} aria-hidden="true" />
                  <strong>{option.label}</strong>
                  <span>{option.value === 'system' ? 'Follow OS/browser' : `Use ${option.label.toLowerCase()} mode`}</span>
                </button>
              );
            })}
          </div>
          <button className="primary-button save-button" type="button" onClick={() => notify?.('Theme preference saved.', 'success', 'Saved locally')}>
            Save locally
          </button>
        </div>
      </>
    );
  }

  if (section === 'notifications') {
    return (
      <>
        <div className="section-title">
          <h2>Notifications</h2>
          <p>Notification preferences are local to this browser for now.</p>
        </div>
        <LocalOnlyNote />
        <div className="settings-form">
          <ToggleRow
            label="Sync success"
            checked={notificationPrefs.syncSuccess}
            onChange={(value) => setNotificationPrefs({ ...notificationPrefs, syncSuccess: value })}
          />
          <ToggleRow
            label="Sync failure"
            checked={notificationPrefs.syncFailure}
            onChange={(value) => setNotificationPrefs({ ...notificationPrefs, syncFailure: value })}
          />
          <ToggleRow
            label="AI fallback used"
            checked={notificationPrefs.aiFallback}
            onChange={(value) => setNotificationPrefs({ ...notificationPrefs, aiFallback: value })}
          />
          <button className="primary-button save-button" type="button" onClick={saveNotificationPreferences}>
            Save locally
          </button>
        </div>
      </>
    );
  }

  if (section === 'danger') {
    return (
      <>
        <div className="section-title">
          <h2>Danger Zone</h2>
          <p>These actions affect only frontend state unless a backend endpoint exists.</p>
        </div>
        <div className="danger-action-list">
          <button className="outline-button neutral" type="button" onClick={onRequestClearLocalCache}>
            <Trash2 size={16} aria-hidden="true" />
            Clear Local Cache
          </button>
          <button className="outline-button danger-button" type="button" onClick={onDisconnect}>
            <Github size={16} aria-hidden="true" />
            Disconnect GitHub
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-title">
        <h2>Profile</h2>
        <p>Manage local profile display settings. GitHub data remains the source of truth.</p>
      </div>
      <LocalOnlyNote text="Profile edits are saved locally for this browser session. Backend persistence not implemented yet." />

      <div className="profile-photo-row">
        <span className="photo-avatar">{initials}</span>
        <div>
          <span className="field-label">Profile Photo</span>
          <p>GitHub profile images stay managed by GitHub.</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={saveProfile}>
        <label>
          <span>Full Name</span>
          <input value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} />
        </label>
        <label>
          <span>Email Address</span>
          <input value={profileForm.email || 'Not provided by GitHub'} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
        </label>
        <label>
          <span>Username</span>
          <input value={profileForm.username} onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })} />
          <em>Saved locally for this session only unless backend profile endpoints are added.</em>
        </label>
        <button className="primary-button save-button" type="submit">
          Save locally
        </button>
      </form>
    </>
  );
}

function LocalOnlyNote({ text = 'Local only. Saved in this browser. Backend persistence not implemented yet.' }) {
  return (
    <div className="local-only-note">
      <span>Local only</span>
      <p>{text}</p>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function readStoredObject(key, fallback) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '');
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export default Settings;
