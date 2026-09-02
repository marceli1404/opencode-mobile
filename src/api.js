/**
 * OpenCode API Client
 * Handles communication with OpenCode web server
 */

class OpenCodeAPI {
  constructor(baseUrl, username = 'opencode', password = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
    this.eventSource = null;
    this.listeners = new Map();
  }

  /**
   * Generate Basic Auth header
   */
  getAuthHeader() {
    if (!this.password) return {};
    const credentials = btoa(`${this.username}:${this.password}`);
    return { 'Authorization': `Basic ${credentials}` };
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Session Management

  /**
   * List all sessions
   */
  async listSessions() {
    return this.get('/session');
  }

  /**
   * Create a new session
   */
  async createSession(options = {}) {
    return this.post('/session', options);
  }

  /**
   * Get session details
   */
  async getSession(sessionId) {
    return this.get(`/session/${sessionId}`);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    return this.delete(`/session/${sessionId}`);
  }

  /**
   * Get session status (all sessions)
   */
  async getSessionStatus() {
    return this.get('/session/status');
  }

  // Messaging

  /**
   * Send a message to a session
   */
  async sendMessage(sessionId, message, options = {}) {
    const payload = {
      text: message,
      ...options
    };
    return this.post(`/session/${sessionId}/message`, payload);
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId) {
    return this.get(`/session/${sessionId}/message`);
  }

  // Todos

  /**
   * Get todos for a session
   */
  async getTodos(sessionId) {
    return this.get(`/session/${sessionId}/todo`);
  }

  // Questions

  /**
   * Answer a question
   */
  async answerQuestion(requestId, answers) {
    return this.post(`/question/${requestId}`, { answers });
  }

  // Permissions

  /**
   * Grant permission
   */
  async grantPermission(requestId, granted) {
    return this.post(`/permission/${requestId}`, { granted });
  }

  // SSE Event Streaming

  /**
   * Connect to event stream
   */
  connectEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${this.baseUrl}/event`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (e) {
        console.error('Failed to parse event:', e);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.emit('error', error);
    };

    return this.eventSource;
  }

  /**
   * Disconnect from event stream
   */
  disconnectEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Event Emitter

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in ${event} listener:`, e);
      }
    });
  }

  /**
   * Get OpenAPI documentation
   */
  async getDocs() {
    return this.get('/doc');
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      await this.get('/session/status');
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Export for ES modules
export default OpenCodeAPI;