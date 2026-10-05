/**
 * Authentication helpers for OpenCode Mobile UI
 * Handles secure credential storage and server verification
 */

class Auth {
  constructor() {
    this.credentials = null;
    // Remove credentials persisted by older versions of the app.
    localStorage.removeItem('opencode-auth');
  }

  /**
   * Store credentials
   */
  saveCredentials(username, password) {
    this.credentials = {
      username,
      password,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get stored credentials
   */
  getCredentials() {
    if (!this.credentials) return null;
    return { ...this.credentials };
  }

  /**
   * Clear credentials
   */
  clearCredentials() {
    this.credentials = null;
    localStorage.removeItem('opencode-auth');
    localStorage.removeItem('opencode-password');
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.getCredentials() !== null;
  }

  /**
   * Verify server connection with credentials
   */
  async verifyConnection(baseUrl, username, password) {
    try {
      const response = await fetch(`${baseUrl}/session/status`, {
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate authorization header value
   */
  getAuthHeader(username, password) {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}

export default Auth;