import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function Layout({ activePage, meta, onNavigate, onPrimaryAction, syncing, auth, notice, children }) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} auth={auth} />
      <main className="main-panel">
        <Topbar meta={meta} onPrimaryAction={onPrimaryAction} syncing={syncing} auth={auth} />
        {notice ? <div className={`app-banner ${notice.type}`}>{notice.message}</div> : null}
        {children}
      </main>
    </div>
  );
}

export default Layout;
