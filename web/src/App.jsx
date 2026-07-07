import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Integrations from './pages/Integrations.jsx';
import Overview from './pages/Overview.jsx';
import Settings from './pages/Settings.jsx';
import SyncHistory from './pages/SyncHistory.jsx';
import TopRepos from './pages/TopRepos.jsx';
import WeeklyStats from './pages/WeeklyStats.jsx';
import { api } from './api.js';
import { pageMeta } from './data/mockData.js';

const pages = {
  overview: Overview,
  weeklyStats: WeeklyStats,
  topRepos: TopRepos,
  syncHistory: SyncHistory,
  chatbot: Chatbot,
  integrations: Integrations,
  settings: Settings
};

function getPageFromHash() {
  const page = window.location.hash.replace(/^#\/?/, '');
  return pages[page] ? page : 'overview';
}

function App() {
  const [activePage, setActivePage] = useState(getPageFromHash);
  const [syncing, setSyncing] = useState(false);
  const ActivePage = pages[activePage] || Overview;
  const meta = useMemo(() => pageMeta[activePage] || pageMeta.overview, [activePage]);

  useEffect(() => {
    function handleHashChange() {
      setActivePage(getPageFromHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function handleNavigate(page) {
    if (!pages[page]) return;
    setActivePage(page);
    window.location.hash = `/${page}`;
  }

  async function handlePrimaryAction() {
    if (meta.actionLabel === 'New Chat') {
      setActivePage('chatbot');
      window.location.hash = '/chatbot';
      console.info('Started a new mock chat');
      return;
    }

    setSyncing(true);
    try {
      await api.syncNow();
      console.info('Manual sync requested');
    } catch (error) {
      console.info('Mock sync action used while backend is unavailable');
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  }

  return (
    <Layout
      activePage={activePage}
      meta={meta}
      onNavigate={handleNavigate}
      onPrimaryAction={handlePrimaryAction}
      syncing={syncing}
    >
      <ActivePage onNavigate={handleNavigate} />
    </Layout>
  );
}

export default App;
