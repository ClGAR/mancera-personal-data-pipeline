import {
  BarChart3,
  ChevronUp,
  Code2,
  Database,
  GitBranch,
  History,
  Home,
  MessageCircle,
  Plug,
  Settings
} from 'lucide-react';
import { navItems } from '../data/mockData.js';

const icons = {
  overview: Home,
  weeklyStats: BarChart3,
  topRepos: Code2,
  syncHistory: History,
  chatbot: MessageCircle,
  integrations: Plug,
  settings: Settings
};

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-lockup">
        <div className="brand-mark">
          <GitBranch size={27} aria-hidden="true" />
        </div>
        <div>
          <strong>Personal Data Pipeline</strong>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = icons[item.id] || Home;

          return (
            <button
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
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
            <strong>Alex Johnson</strong>
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
