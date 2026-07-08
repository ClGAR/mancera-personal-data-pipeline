import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ToastContainer from './ToastContainer.jsx';

function Layout({
  activePage,
  meta,
  onNavigate,
  onPrimaryAction,
  syncing,
  auth,
  syncHistory,
  onLogout,
  toasts,
  onDismissToast,
  children
}) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} auth={auth} />
      <main className="main-panel">
        <Topbar
          meta={meta}
          onPrimaryAction={onPrimaryAction}
          syncing={syncing}
          auth={auth}
          syncHistory={syncHistory}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        {children}
      </main>
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}

export default Layout;
