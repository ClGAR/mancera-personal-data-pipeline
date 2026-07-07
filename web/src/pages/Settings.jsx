import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  Database,
  Download,
  Github,
  KeyRound,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Zap
} from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { accountSummary } from '../data/mockData.js';

const settingsNav = [
  { label: 'Profile', icon: UserRound, active: true },
  { label: 'GitHub Account', icon: Github },
  { label: 'Sync Preferences', icon: RefreshCcw },
  { label: 'Data Privacy', icon: Shield },
  { label: 'Notifications', icon: Bell },
  { label: 'Danger Zone', icon: Zap, danger: true }
];

const quickActions = [
  { title: 'Sync Now', detail: 'Trigger an immediate data sync', icon: RefreshCcw, tone: 'primary' },
  { title: 'Export My Data', detail: 'Download your data snapshot', icon: Download, tone: 'primary' },
  { title: 'Clear Local Cache', detail: 'Free up space and reset cache', icon: Trash2, tone: 'danger' }
];

const summaryIcons = [Calendar, Zap, Database, RefreshCcw];

function Settings() {
  return (
    <section className="settings-layout">
      <aside className="card settings-nav-card">
        {settingsNav.map((item) => {
          const Icon = item.icon;

          return (
            <button className={`settings-nav-item ${item.active ? 'active' : ''} ${item.danger ? 'danger' : ''}`} type="button" key={item.label}>
              <Icon size={20} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </aside>

      <article className="card profile-form-card">
        <div className="section-title">
          <h2>Profile</h2>
          <p>Manage your personal information and profile settings.</p>
        </div>

        <div className="profile-photo-row">
          <span className="photo-avatar">AJ</span>
          <div>
            <span className="field-label">Profile Photo</span>
            <p>JPG, PNG or GIF. Max size 5MB.</p>
            <div className="photo-actions">
              <button className="outline-button" type="button">
                <Upload size={16} aria-hidden="true" />
                Change Photo
              </button>
              <button className="danger-link" type="button">
                <Trash2 size={15} aria-hidden="true" />
                Remove Photo
              </button>
            </div>
          </div>
        </div>

        <form className="settings-form">
          <label>
            <span>Full Name</span>
            <input defaultValue="Alex Johnson" />
          </label>
          <label>
            <span>Email Address</span>
            <input defaultValue="alex.johnson@example.com" />
          </label>
          <label>
            <span>Username</span>
            <input defaultValue="alex.dev" />
            <em>This is your public username. It appears in data insights and exports.</em>
          </label>
          <button className="primary-button save-button" type="button">
            Save Changes
          </button>
        </form>
      </article>

      <aside className="settings-side">
        <article className="card account-summary-card">
          <h2>Account Summary</h2>
          <div className="account-user-row">
            <span className="account-avatar">
              <UserRound size={28} aria-hidden="true" />
            </span>
            <div>
              <strong>Alex Johnson</strong>
              <Badge variant="primary">Pro Plan</Badge>
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
          <button className="text-link" type="button">
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
                <button className="quick-action-row" type="button" key={action.title}>
                  <span className={`quick-action-icon ${action.tone}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{action.title}</strong>
                    <em>{action.detail}</em>
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
          <strong>Your security is our priority</strong>
          <p>We use industry-standard encryption to keep your data safe. You can review or delete your data at any time.</p>
        </div>
        <button className="text-link" type="button">
          Learn more about security
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default Settings;
