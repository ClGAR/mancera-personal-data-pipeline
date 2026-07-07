import { ArrowRight, Bot, ChevronRight, Github, Plug, Webhook, Zap } from 'lucide-react';

const integrationIcons = {
  supabase: Zap,
  github: Github,
  webhook: Webhook,
  ai: Bot
};

function IntegrationsCard({ integrations }) {
  return (
    <article className="card integrations-card" id="integrations">
      <div className="card-header">
        <div>
          <h2>
            <Plug size={20} aria-hidden="true" />
            Integrations
          </h2>
        </div>
      </div>

      <div className="integration-list">
        {integrations.map((integration) => {
          const Icon = integrationIcons[integration.type] || Plug;

          return (
            <button className="integration-row" key={integration.name} type="button">
              <span className={`integration-icon ${integration.type}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{integration.name}</strong>
                <span>
                  <i />
                  {integration.status}
                </span>
              </div>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <a className="card-link" href="#integrations">
        Manage integrations
        <ArrowRight size={15} aria-hidden="true" />
      </a>
    </article>
  );
}

export default IntegrationsCard;
