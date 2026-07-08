import { ArrowRight, Bot, Github, Mail, ShieldCheck, Slack, Webhook, Zap } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '../api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const integrationIcons = {
  github: Github,
  supabase: Zap,
  webhook: Webhook,
  ai: Bot,
  email: Mail,
  slack: Slack
};

const configurableIntegrationTypes = new Set(['github', 'supabase', 'webhook', 'ai']);

function Integrations({ dashboardData, auth }) {
  const integrationCards = dashboardData?.integrations?.cards || [];
  const [activeIntegration, setActiveIntegration] = useState(null);
  const [securityOpen, setSecurityOpen] = useState(false);

  return (
    <section className="integrations-page">
      <div className="integration-grid">
        {integrationCards.map((integration) => {
          const Icon = integrationIcons[integration.type] || Zap;
          const connected = integration.status === 'Connected';
          const configurable = configurableIntegrationTypes.has(integration.type);

          return (
            <article className="card integration-service-card" key={integration.title}>
              <div className="integration-service-header">
                <span className={`service-icon ${integration.type}`}>
                  <Icon size={36} aria-hidden="true" />
                </span>
                <div>
                  <h2>{integration.title}</h2>
                  <p>{integration.description}</p>
                </div>
              </div>

              <Badge variant={connected ? 'success' : 'neutral'} dot>
                {integration.status}
              </Badge>

              <dl className="detail-list">
                {integration.details.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <button className="outline-button configure-button" type="button" onClick={() => setActiveIntegration(integration)}>
                {configurable ? 'Configure' : 'View setup notes'}
              </button>
            </article>
          );
        })}
      </div>

      <div className="security-banner">
        <span className="security-icon">
          <ShieldCheck size={25} aria-hidden="true" />
        </span>
        <div>
          <strong>Your data is secure by design</strong>
          <p>Secrets stay in the backend environment, and production token encryption is listed before public deployment.</p>
        </div>
        <button className="text-link" type="button" onClick={() => setSecurityOpen(true)}>
          Learn more about security
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {activeIntegration ? (
        <Modal title={`${activeIntegration.title} configuration`} onClose={() => setActiveIntegration(null)}>
          <IntegrationContent integration={activeIntegration} auth={auth} dashboardData={dashboardData} />
        </Modal>
      ) : null}

      {securityOpen ? (
        <Modal title="Security notes" onClose={() => setSecurityOpen(false)}>
          <ul className="modal-list">
            <li>`server/.env` must not be committed.</li>
            <li>The Supabase service role key is backend-only and should never appear in React.</li>
            <li>Stored OAuth tokens should be encrypted before production use.</li>
            <li>Webhook URLs should be treated as sensitive credentials.</li>
            <li>This portfolio app is security-aware, but it does not claim production-ready hardening yet.</li>
          </ul>
        </Modal>
      ) : null}
    </section>
  );
}

function IntegrationContent({ integration, auth, dashboardData }) {
  if (integration.type === 'github') {
    return (
      <div className="modal-copy">
        <p>
          {auth?.authenticated
            ? `Connected as ${auth.user?.displayName || auth.user?.username || 'your GitHub account'}.`
            : 'GitHub is not connected yet.'}
        </p>
        <a className="primary-button modal-inline-action" href={`${API_BASE_URL}/auth/github`}>
          <Github size={16} aria-hidden="true" />
          {auth?.authenticated ? 'Reconnect GitHub' : 'Connect GitHub'}
        </a>
      </div>
    );
  }

  if (integration.type === 'supabase') {
    return (
      <div className="modal-copy">
        <p>Supabase status is reported by `/health`. Keys are never shown in the frontend.</p>
        <pre>{`SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}</pre>
      </div>
    );
  }

  if (integration.type === 'webhook') {
    return (
      <div className="modal-copy">
        <p>The n8n webhook is optional and non-blocking. If it is not configured, GitHub sync still completes.</p>
        <pre>{`N8N_WEBHOOK_URL=https://your-n8n-webhook-url`}</pre>
        <p>Add or update this value in `server/.env`, then restart the backend.</p>
      </div>
    );
  }

  if (integration.type === 'ai') {
    const provider = dashboardData?.integrations?.aiProvider || 'ollama';
    const model = dashboardData?.integrations?.aiModel || 'llama3.2';

    return (
      <div className="modal-copy">
        <p>
          Current provider: <strong>{provider}</strong>
        </p>
        <p>
          Current local model: <strong>{model}</strong>
        </p>
        <pre>{`ollama pull llama3.2
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2`}</pre>
      </div>
    );
  }

  return (
    <div className="modal-copy">
      <p>{integration.title} is coming soon. No backend persistence or delivery endpoint exists yet.</p>
      <p>This card is intentionally marked as not configured until a backend integration is added.</p>
    </div>
  );
}

export default Integrations;
