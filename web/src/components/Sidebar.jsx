import {
  BarChart3,
  ChevronUp,
  Code2,
  Database,
  GitFork,
  History,
  Home,
  MessageCircle,
  Plug,
  Settings
} from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: Home, active: true },
  { label: 'Weekly Stats', icon: BarChart3 },
  { label: 'Top Repos', icon: Code2 },
  { label: 'Sync History', icon: History },
  { label: 'Chatbot', icon: MessageCircle },
  { label: 'Integrations', icon: Plug },
  { label: 'Settings', icon: Settings }
];

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-lockup">
        <div className="brand-mark">
          <GitFork size={25} aria-hidden="true" />
        </div>
        <div>
          <strong>Personal Data Pipeline</strong>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button className={`nav-item ${item.active ? 'active' : ''}`} key={item.label} type="button">
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-stack">
        <div className="data-control-card">
          <div className="data-icon">
            <Database size={22} aria-hidden="true" />
          </div>
          <div>
            <strong>Your data, your control.</strong>
            <p>All GitHub data is stored in your Supabase project.</p>
            <a href="#integrations">Learn more</a>
          </div>
        </div>

        <div className="profile-card">
          <span className="avatar avatar-large">AM</span>
          <div>
            <strong>Alex Mancera</strong>
            <p>alex.dev</p>
            <span>Pro Plan</span>
          </div>
          <ChevronUp size={17} aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
