import { Database, FileText, Monitor, PencilLine, TerminalSquare, Zap } from 'lucide-react';

const repoIcons = {
  site: Monitor,
  database: Database,
  terminal: TerminalSquare,
  notes: PencilLine,
  supabase: Zap,
  docs: FileText,
  app: Monitor
};

function RepoIcon({ type = 'site' }) {
  const Icon = repoIcons[type] || Monitor;

  return (
    <span className={`repo-icon ${type}`}>
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}

export default RepoIcon;
