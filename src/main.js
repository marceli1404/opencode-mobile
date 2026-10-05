import OpenCodeAPI from './api.js';
import OpenCodeUI from './ui.js';

// Application entry point
class App {
  constructor() {
    this.api = null;
    this.ui = null;
    this.init();
  }

  async init() {
    try {
      // Restore non-sensitive settings only. Passwords are deliberately kept
      // in memory and must be re-entered after a reload.
      localStorage.removeItem('opencode-password'); // purge legacy plaintext storage
      const savedConfig = {
        url: localStorage.getItem('opencode-url'),
        username: localStorage.getItem('opencode-username') || 'opencode',
        password: ''
      };

      // Restore theme
      const savedTheme = localStorage.getItem('opencode-theme');
      if (savedTheme) {
        document.documentElement.dataset.theme = savedTheme;
      } else {
        // Detect system preference
        document.documentElement.dataset.theme = 
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // Create API client with saved config or defaults
      const baseUrl = savedConfig.url || this.getDefaultBaseUrl();
      this.api = new OpenCodeAPI(baseUrl, savedConfig.username, savedConfig.password);

      // Create UI
      this.ui = new OpenCodeUI(this.api);

      // Test connection
      const isConnected = await this.api.testConnection();
      if (isConnected) {
        this.ui.showToast('Connected to OpenCode server', 'success');
      } else {
        this.ui.showToast('Unable to connect to OpenCode server', 'error');
        this.ui.showSettingsModal();
      }

      // Expose for debugging
      window.app = this;

    } catch (error) {
      console.error('Application initialization failed:', error);
      document.getElementById('app').innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;padding:2rem;text-align:center;">
          <div>
            <h1 style="margin-bottom:1rem;color:var(--danger);">⚠️ Initialization Error</h1>
            <p style="color:var(--text-secondary);">${error.message}</p>
            <button class="btn btn-primary" style="margin-top:1rem;" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Get default base URL
   * Works in Codespaces and local development
   */
  getDefaultBaseUrl() {
    // Check if running in Codespaces
    if (window.location.hostname.includes('github.dev')) {
      // In Codespaces, OpenCode server runs on port 4096
      const hostname = window.location.hostname;
      return `https://${hostname}`;
    }

    // Local development
    return 'http://localhost:4096';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}