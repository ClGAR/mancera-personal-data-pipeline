import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function Layout({ activePage, meta, onNavigate, onPrimaryAction, syncing, children }) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="main-panel">
        <Topbar meta={meta} onPrimaryAction={onPrimaryAction} syncing={syncing} />
        {children}
      </main>
    </div>
  );
}

export default Layout;
