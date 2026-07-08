import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts?.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;

        return (
          <article
            className={`toast toast-${toast.type || 'info'}`}
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          >
            <Icon size={18} aria-hidden="true" />
            <div>
              <strong>{toast.title || getDefaultTitle(toast.type)}</strong>
              <p>{toast.message}</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function getDefaultTitle(type) {
  if (type === 'success') return 'Success';
  if (type === 'error') return 'Something went wrong';
  if (type === 'warning') return 'Heads up';
  return 'Update';
}

export default ToastContainer;
