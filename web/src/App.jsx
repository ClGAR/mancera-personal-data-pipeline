import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Integrations from './pages/Integrations.jsx';
import Overview from './pages/Overview.jsx';
import Settings from './pages/Settings.jsx';
import SyncHistory from './pages/SyncHistory.jsx';
import TopRepos from './pages/TopRepos.jsx';
import WeeklyStats from './pages/WeeklyStats.jsx';
import { getCurrentUser, getHealth, getSyncHistory, getTopRepos, getWeeklyStats, runManualSync } from './api.js';
import { buildDashboardData, getInitialDashboardData } from './data/dashboardData.js';
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
  const [auth, setAuth] = useState({
    authenticated: false,
    user: null,
    loading: true,
    error: ''
  });
  const [dashboardData, setDashboardData] = useState(getInitialDashboardData);
  const [dataState, setDataState] = useState({
    loading: true,
    message: ''
  });
  const [notice, setNotice] = useState(null);
  const ActivePage = pages[activePage] || Overview;
  const meta = useMemo(() => pageMeta[activePage] || pageMeta.overview, [activePage]);

  useEffect(() => {
    function handleHashChange() {
      setActivePage(getPageFromHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setAuth((current) => ({ ...current, loading: true, error: '' }));
      setDataState({ loading: true, message: '' });

      const authResult = await getCurrentUser()
        .then((payload) => ({ payload, error: null }))
        .catch((error) => ({ payload: null, error }));

      if (!active) return;

      const authPayload = normalizeAuth(authResult.payload);
      setAuth({
        ...authPayload,
        loading: false,
        error: authResult.error?.message || ''
      });

      const dashboardResult = await fetchDashboardData(authPayload);
      if (!active) return;

      setDashboardData(dashboardResult.data);
      setDataState({
        loading: false,
        message: dashboardResult.message
      });
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function handleNavigate(page) {
    if (!pages[page]) return;
    setActivePage(page);
    window.location.hash = `/${page}`;
  }

  async function handlePrimaryAction() {
    if (meta.actionLabel === 'New Chat') {
      setActivePage('chatbot');
      window.location.hash = '/chatbot';
      return;
    }

    setSyncing(true);
    setNotice(null);
    try {
      const syncResult = await runManualSync();
      const dashboardResult = await fetchDashboardData(auth);

      setDashboardData(dashboardResult.data);
      setDataState({
        loading: false,
        message: dashboardResult.message
      });
      setNotice({
        type: 'success',
        message: buildSyncSuccessMessage(syncResult)
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: `Sync failed: ${error.message || 'Please check your backend connection.'}`
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Layout
      activePage={activePage}
      meta={meta}
      onNavigate={handleNavigate}
      onPrimaryAction={handlePrimaryAction}
      syncing={syncing}
      auth={auth}
      notice={notice}
    >
      <ActivePage
        onNavigate={handleNavigate}
        dashboardData={dashboardData}
        isLoading={dataState.loading}
        dataMessage={dataState.message}
        auth={auth}
      />
    </Layout>
  );
}

async function fetchDashboardData(auth) {
  const [weeklyResult, topReposResult, syncHistoryResult, healthResult] = await Promise.allSettled([
    getWeeklyStats(),
    getTopRepos(),
    getSyncHistory(),
    getHealth()
  ]);

  const data = buildDashboardData({
    weekly: getSettledValue(weeklyResult),
    topRepos: getSettledValue(topReposResult),
    syncHistory: getSettledValue(syncHistoryResult),
    syncError: getSettledErrorMessage(syncHistoryResult),
    health: getSettledValue(healthResult),
    auth
  });
  const rejected = [weeklyResult, topReposResult, syncHistoryResult].filter((result) => result.status === 'rejected');

  return {
    data,
    message: buildDataMessage({ rejected, usingMockData: data.usingMockData, authenticated: auth.authenticated })
  };
}

function getSettledValue(result) {
  return result.status === 'fulfilled' ? result.value : null;
}

function getSettledErrorMessage(result) {
  return result.status === 'rejected' ? result.reason?.message || 'Request failed' : '';
}

function normalizeAuth(payload) {
  return {
    authenticated: Boolean(payload?.authenticated),
    user: payload?.user || null
  };
}

function buildDataMessage({ rejected, usingMockData, authenticated }) {
  if (rejected.length > 0) {
    return authenticated
      ? 'Some live dashboard data could not load, so polished sample data is filling the gaps.'
      : 'Connect GitHub to load live dashboard data. Sample data is showing for now.';
  }

  if (usingMockData) {
    return 'No live dashboard rows yet. Sample data will be replaced after your first successful sync.';
  }

  return '';
}

function buildSyncSuccessMessage(result) {
  const repoCount = Number(result?.reposSynced ?? 0);
  const commitCount = Number(result?.commitsSynced ?? 0);
  if (repoCount || commitCount) {
    return `Sync complete: ${repoCount} repositories and ${commitCount} commits processed.`;
  }

  return 'Sync request completed. Dashboard data has been refreshed.';
}

export default App;
