/**
 * Authentication helpers for OpenCode Mobile UI
 * Handles secure credential storage and server verification
 */

class Auth {
  constructor() {
    this.storageKey = 'opencode-auth';
  }

  /**
   * Store credentials
   */
  saveCredentials(username, password) {
    const credentials = {
      username,
      password: this.encode(password),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(credentials));
  }

  /**
   * Get stored credentials
   */
  getCredentials() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      if (!data) return null;
      return {
        username: data.username,
        password: this.decode(data.password),
        timestamp: data.timestamp
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear credentials
   */
  clearCredentials() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.getCredentials() !== null;
  }

  /**
   * Encode password (obfuscation, not encryption)
   */
  encode(text) {
    return btoa(encodeURIComponent(text));
  }

  /**
   * Decode password
   */
  decode(encoded) {
    return decodeURIComponent(atob(encoded));
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