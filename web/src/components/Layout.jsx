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
  dataMode,
  onLogout,
  onConnectGitHub,
  toasts,
  onDismissToast,
  children
}) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} auth={auth} />
      <main className={`main-panel page-${activePage}`}>
        <Topbar
          meta={meta}
          onPrimaryAction={onPrimaryAction}
          syncing={syncing}
          auth={auth}
          syncHistory={syncHistory}
          dataMode={dataMode}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onConnectGitHub={onConnectGitHub}
        />
        {children}
      </main>
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}

export default Layout;
