import { ArrowRight, Bot, Github, Mail, ShieldCheck, Slack, Webhook, Zap } from 'lucide-react';
import Badge from '../components/Badge.jsx';
import { integrationCards } from '../data/mockData.js';

const integrationIcons = {
  github: Github,
  supabase: Zap,
  webhook: Webhook,
  ai: Bot,
  email: Mail,
  slack: Slack
};

function Integrations() {
  return (
    <section className="integrations-page">
      <div className="integration-grid">
        {integrationCards.map((integration) => {
          const Icon = integrationIcons[integration.type] || Zap;
          const connected = integration.status === 'Connected';

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

              <button className="outline-button configure-button" type="button">
                Configure
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
          <strong>Your data is secure</strong>
          <p>We use industry-standard encryption and OAuth to keep your data safe. You can revoke access to any service at any time.</p>
        </div>
        <button className="text-link" type="button">
          Learn more about security
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default Integrations;
