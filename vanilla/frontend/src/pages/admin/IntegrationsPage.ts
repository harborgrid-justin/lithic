/**
 * IntegrationsPage
 * Manage external integrations and API keys
 */
export class IntegrationsPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="integrations-page">
        <header class="page-header">
          <h1>Integrations</h1>
          <p>Manage external integrations and API access</p>
        </header>

        <div class="integrations-content">
          <!-- EHR Integrations -->
          <div class="integration-section">
            <h3>EHR Systems</h3>
            <div class="integrations-grid">
              ${this.renderIntegrationCard("Epic", "epic", false)}
              ${this.renderIntegrationCard("Cerner", "cerner", false)}
              ${this.renderIntegrationCard("Allscripts", "allscripts", false)}
              ${this.renderIntegrationCard("Athenahealth", "athenahealth", false)}
            </div>
          </div>

          <!-- Payment Integrations -->
          <div class="integration-section">
            <h3>Payment Processors</h3>
            <div class="integrations-grid">
              ${this.renderIntegrationCard("Stripe", "stripe", false)}
              ${this.renderIntegrationCard("Square", "square", false)}
            </div>
          </div>

          <!-- SIEM Integrations -->
          <div class="integration-section">
            <h3>Security & Monitoring</h3>
            <div class="integrations-grid">
              ${this.renderIntegrationCard("Splunk", "splunk", false)}
              ${this.renderIntegrationCard("Datadog", "datadog", false)}
              ${this.renderIntegrationCard("PagerDuty", "pagerduty", false)}
            </div>
          </div>

          <!-- API Keys -->
          <div class="integration-section">
            <h3>API Keys</h3>
            <button id="generate-api-key-btn" class="btn btn--primary">
              Generate New API Key
            </button>
            <div id="api-keys-list" class="api-keys-list">
              <p class="text-muted">No API keys generated yet</p>
            </div>
          </div>

          <!-- Webhooks -->
          <div class="integration-section">
            <h3>Webhooks</h3>
            <button id="add-webhook-btn" class="btn btn--primary">
              Add Webhook
            </button>
            <div id="webhooks-list" class="webhooks-list">
              <p class="text-muted">No webhooks configured</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderIntegrationCard(
    name: string,
    id: string,
    enabled: boolean,
  ): string {
    return `
      <div class="integration-card">
        <div class="integration-card__header">
          <h4>${name}</h4>
          <span class="badge badge--${enabled ? "success" : "secondary"}">
            ${enabled ? "Connected" : "Not Connected"}
          </span>
        </div>
        <div class="integration-card__body">
          <p>Connect ${name} to sync patient data and streamline workflows</p>
        </div>
        <div class="integration-card__actions">
          ${
            enabled
              ? `<button class="btn btn--sm btn--danger" data-integration="${id}">Disconnect</button>`
              : `<button class="btn btn--sm btn--primary" data-integration="${id}">Connect</button>`
          }
          <button class="btn btn--sm btn--secondary">Configure</button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const generateApiKeyBtn = document.getElementById("generate-api-key-btn");
    const addWebhookBtn = document.getElementById("add-webhook-btn");

    generateApiKeyBtn?.addEventListener("click", () => this.generateApiKey());
    addWebhookBtn?.addEventListener("click", () => this.addWebhook());

    // Integration connect/disconnect buttons
    const integrationButtons = document.querySelectorAll(
      ".integration-card button",
    );
    integrationButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const integration = (e.target as HTMLElement).dataset.integration;
        if (integration) {
          alert(`${integration} integration - Coming soon`);
        }
      });
    });
  }

  private generateApiKey(): void {
    const keyName = prompt("Enter a name for this API key:");
    if (!keyName) return;

    // In production, this would call the backend API
    const apiKey =
      "sk_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const keysList = document.getElementById("api-keys-list");
    if (keysList) {
      if (keysList.querySelector(".text-muted")) {
        keysList.innerHTML = "";
      }

      const keyHTML = `
        <div class="api-key-item">
          <div class="api-key-info">
            <strong>${keyName}</strong>
            <code>${apiKey}</code>
            <small>Created: ${new Date().toLocaleString()}</small>
          </div>
          <button class="btn btn--sm btn--danger">Revoke</button>
        </div>
      `;

      keysList.insertAdjacentHTML("beforeend", keyHTML);
    }

    alert(
      `API Key generated successfully!\n\nKey: ${apiKey}\n\nSave this key securely. It will not be shown again.`,
    );
  }

  private addWebhook(): void {
    const webhookUrl = prompt("Enter webhook URL:");
    if (!webhookUrl) return;

    const webhooksList = document.getElementById("webhooks-list");
    if (webhooksList) {
      if (webhooksList.querySelector(".text-muted")) {
        webhooksList.innerHTML = "";
      }

      const webhookHTML = `
        <div class="webhook-item">
          <div class="webhook-info">
            <code>${webhookUrl}</code>
            <small>Created: ${new Date().toLocaleString()}</small>
          </div>
          <div class="webhook-actions">
            <button class="btn btn--sm btn--secondary">Test</button>
            <button class="btn btn--sm btn--danger">Delete</button>
          </div>
        </div>
      `;

      webhooksList.insertAdjacentHTML("beforeend", webhookHTML);
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
