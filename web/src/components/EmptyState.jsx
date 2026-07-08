import { Inbox } from 'lucide-react';

function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Inbox size={24} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
