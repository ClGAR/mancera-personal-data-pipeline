import { CheckCircle2, Circle, XCircle } from 'lucide-react';

function Badge({ children, variant = 'success', dot = false, icon = false, className = '' }) {
  const Icon = variant === 'danger' ? XCircle : variant === 'success' ? CheckCircle2 : Circle;

  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {icon ? <Icon size={13} aria-hidden="true" /> : null}
      {dot ? <span className="badge-dot" /> : null}
      {children}
    </span>
  );
}

export default Badge;
