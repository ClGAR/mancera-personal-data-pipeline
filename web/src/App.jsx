import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Integrations from './pages/Integrations.jsx';
import Overview from './pages/Overview.jsx';
import Settings from './pages/Settings.jsx';
import SyncHistory from './pages/SyncHistory.jsx';
import TopRepos from './pages/TopRepos.jsx';
import WeeklyStats from './pages/WeeklyStats.jsx';
import { getCurrentUser, getHealth, getSyncHistory, getTopRepos, getWeeklyStats, loginWithGitHub, logout, runManualSync } from './api.js';
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
  const [settingsSection, setSettingsSection] = useState('profile');
  const [syncing, setSyncing] = useState(false);
  const [chatResetNonce, setChatResetNonce] = useState(0);
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
  const [toasts, setToasts] = useState([]);
  const ActivePage = pages[activePage] || Overview;
  const meta = useMemo(() => pageMeta[activePage] || pageMeta.overview, [activePage]);
  const dataMode = useMemo(
    () => getDataMode({ loading: dataState.loading, authenticated: auth.authenticated, dashboardData }),
    [auth.authenticated, dashboardData, dataState.loading]
  );

  const notify = useCallback((message, type = 'info', title = '') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, type, message, title }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const loadDashboardData = useCallback(
    async (authPayload) => {
      setDataState((current) => ({ ...current, loading: true }));
      const dashboardResult = await fetchDashboardData(authPayload);
      setDashboardData(dashboardResult.data);
      setDataState({
        loading: false,
        message: dashboardResult.message
      });

      if (dashboardResult.offline) {
        notify('Backend offline. Start the API server to load live dashboard data.', 'warning', 'Backend offline');
      }

      return dashboardResult;
    },
    [notify]
  );

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

      if (authResult.error?.status === 0) {
        notify('Backend offline. Start the API server before connecting GitHub or syncing data.', 'warning', 'Backend offline');
      }

      const authPayload = normalizeAuth(authResult.payload);
      setAuth({
        ...authPayload,
        loading: false,
        error: authResult.error?.message || ''
      });

      await loadDashboardData(authPayload);
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [loadDashboardData, notify]);

  function handleNavigate(page, options = {}) {
    if (!pages[page]) return;
    if (page === 'settings' && options.section) setSettingsSection(options.section);
    setActivePage(page);
    window.location.hash = `/${page}`;
  }

  async function handleRunSync() {
    if (syncing) return null;
    if (!auth.authenticated) {
      notify('Connect GitHub before running a sync.', 'warning', 'GitHub required');
      return null;
    }

    setSyncing(true);
    notify('Sync started. This can take a moment while GitHub data is imported.', 'info', 'Sync started');

    try {
      const syncResult = await runManualSync();
      const dashboardResult = await loadDashboardData(auth);
      notify(buildSyncSuccessMessage(syncResult), 'success', 'Sync completed');
      return { syncResult, dashboardResult };
    } catch (error) {
      notify(`Sync failed: ${error.message || 'Please check your backend connection.'}`, 'error', 'Sync failed');
      return null;
    } finally {
      setSyncing(false);
    }
  }

  async function handlePrimaryAction() {
    if (meta.actionLabel === 'New Chat') {
      setChatResetNonce((current) => current + 1);
      handleNavigate('chatbot');
      notify('Chat cleared locally for this session.', 'info', 'New chat');
      return;
    }

    if (!auth.authenticated) {
      loginWithGitHub();
      return;
    }

    await handleRunSync();
  }

  function handleConnectGitHub() {
    loginWithGitHub();
  }

  async function handleLogout() {
    try {
      await logout();
      setAuth({
        authenticated: false,
        user: null,
        loading: false,
        error: ''
      });
      setDashboardData(getInitialDashboardData());
      handleNavigate('overview');
      notify('Logged out of this browser session.', 'success', 'Logged out');
    } catch (error) {
      notify(error.message || 'Logout failed. Please try again.', 'error', 'Logout failed');
    }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: auth.user,
      weeklyStats: dashboardData.weekly,
      topRepositories: dashboardData.topRepos?.repositories || [],
      syncHistory: dashboardData.sync?.history || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal-data-pipeline-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Export complete. A JSON snapshot was downloaded.', 'success', 'Export complete');
  }

  function handleClearLocalCache() {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('pdp:'))
      .forEach((key) => window.localStorage.removeItem(key));
    window.sessionStorage.clear();
    notify('Local dashboard preferences and session-only UI state were cleared.', 'success', 'Local cache cleared');
  }

  return (
    <Layout
      activePage={activePage}
      meta={meta}
      onNavigate={handleNavigate}
      onPrimaryAction={handlePrimaryAction}
      syncing={syncing}
      auth={auth}
      syncHistory={dashboardData.sync?.history || []}
      dataMode={dataMode}
      onLogout={handleLogout}
      onConnectGitHub={handleConnectGitHub}
      toasts={toasts}
      onDismissToast={dismissToast}
    >
      <ActivePage
        onNavigate={handleNavigate}
        dashboardData={dashboardData}
        isLoading={dataState.loading}
        dataMessage={dataState.message}
        auth={auth}
        syncing={syncing}
        onRunSync={handleRunSync}
        onConnectGitHub={handleConnectGitHub}
        onExportData={handleExportData}
        onClearLocalCache={handleClearLocalCache}
        notify={notify}
        settingsSection={settingsSection}
        setSettingsSection={setSettingsSection}
        chatResetNonce={chatResetNonce}
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
    message: buildDataMessage({ rejected, usingMockData: data.usingMockData, authenticated: auth.authenticated }),
    offline: [weeklyResult, topReposResult, syncHistoryResult, healthResult].some(
      (result) => result.status === 'rejected' && result.reason?.status === 0
    )
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
      ? 'Some live dashboard data could not load. Demo data shown until live data loads.'
      : 'Connect GitHub to load live dashboard data. Demo data is showing for now.';
  }

  if (usingMockData) {
    return 'Demo data shown until live data loads. It will be replaced after your first successful sync.';
  }

  return '';
}

function getDataMode({ loading, authenticated, dashboardData }) {
  if (loading) {
    return {
      label: 'Loading live data...',
      tone: 'loading',
      title: 'The dashboard is fetching the latest backend data.'
    };
  }

  if (authenticated && !dashboardData?.usingMockData) {
    return {
      label: 'Live GitHub data',
      tone: 'live',
      title: 'This dashboard is using synced GitHub data from the backend.'
    };
  }

  return {
    label: 'Demo data',
    tone: 'demo',
    title: authenticated
      ? 'Some sections are using demo fallback data until live rows are available.'
      : 'Connect GitHub to replace demo data with live synced activity.'
  };
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
