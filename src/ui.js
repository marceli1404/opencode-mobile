/**
 * OpenCode Mobile UI Components
 * Mobile-friendly interface for OpenCode
 */

class OpenCodeUI {
  constructor(api) {
    this.api = api;
    this.currentSession = null;
    this.sessions = [];
    this.messages = [];
    this.isProcessing = false;
    this.init();
  }

  /**
   * Initialize UI
   */
  init() {
    this.render();
    this.attachEventListeners();
    this.loadSessions();
  }

  /**
   * Render main UI structure
   */
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <div class="header-content">
            <h1 class="app-title">OpenCode</h1>
            <div class="header-actions">
              <button id="btn-new-session" class="btn btn-primary btn-sm">
                <span class="icon">+</span> New
              </button>
              <button id="btn-settings" class="btn btn-secondary btn-sm">
                <span class="icon">⚙</span>
              </button>
            </div>
          </div>
        </header>

        <main class="app-main">
          <div id="sessions-panel" class="sessions-panel">
            <div class="panel-header">
              <h2>Sessions</h2>
              <button id="btn-refresh-sessions" class="btn btn-icon">↻</button>
            </div>
            <div id="sessions-list" class="sessions-list">
              <div class="loading">Loading sessions...</div>
            </div>
          </div>

          <div id="chat-panel" class="chat-panel">
            <div class="chat-header">
              <button id="btn-back-sessions" class="btn btn-icon mobile-only">←</button>
              <div class="session-info">
                <h3 id="session-title">Select a session</h3>
                <span id="session-status" class="status-badge">idle</span>
              </div>
              <div class="chat-actions">
                <button id="btn-session-menu" class="btn btn-icon">⋮</button>
              </div>
            </div>

            <div id="messages-container" class="messages-container">
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>Select a session or create a new one to start chatting</p>
              </div>
            </div>

            <div id="input-area" class="input-area">
              <div class="input-container">
                <textarea 
                  id="message-input" 
                  class="message-input" 
                  placeholder="Type your message..." 
                  rows="1"
                  disabled
                ></textarea>
                <button id="btn-send" class="btn btn-primary btn-send" disabled>
                  <span class="icon">↑</span>
                </button>
              </div>
              <div class="input-hints">
                <span class="hint">Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </main>

        <div id="toast-container" class="toast-container"></div>

        <div id="modal-overlay" class="modal-overlay hidden">
          <div id="modal-content" class="modal-content"></div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // New session button
    document.getElementById('btn-new-session').addEventListener('click', () => {
      this.showNewSessionModal();
    });

    // Refresh sessions
    document.getElementById('btn-refresh-sessions').addEventListener('click', () => {
      this.loadSessions();
    });

    // Back to sessions (mobile)
    document.getElementById('btn-back-sessions').addEventListener('click', () => {
      this.showSessionsPanel();
    });

    // Send message
    document.getElementById('btn-send').addEventListener('click', () => {
      this.sendMessage();
    });

    // Message input
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('input', () => {
      this.autoResizeTextarea(messageInput);
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Session menu
    document.getElementById('btn-session-menu').addEventListener('click', () => {
      this.showSessionMenu();
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showSettingsModal();
    });

    // Modal overlay
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') {
        this.hideModal();
      }
    });
  }

  /**
   * Load sessions from API
   */
  async loadSessions() {
    try {
      this.sessions = await this.api.listSessions();
      this.renderSessionsList();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.showToast('Failed to load sessions', 'error');
    }
  }

  /**
   * Render sessions list
   */
  renderSessionsList() {
    const container = document.getElementById('sessions-list');
    
    if (this.sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>No sessions yet</p>
          <button class="btn btn-primary" onclick="app.showNewSessionModal()">
            Create your first session
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.sessions.map(session => `
      <div class="session-item ${session.id === this.currentSession?.id ? 'active' : ''}" 
           data-session-id="${session.id}">
        <div class="session-info">
          <div class="session-title">${this.escapeHtml(session.title || 'Untitled Session')}</div>
          <div class="session-meta">
            <span class="session-date">${this.formatDate(session.createdAt)}</span>
            <span class="session-status status-${session.status || 'idle'}">${session.status || 'idle'}</span>
          </div>
        </div>
        <div class="session-actions">
          <button class="btn btn-icon btn-delete-session" data-session-id="${session.id}">🗑</button>
        </div>
      </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.session-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-delete-session')) {
          this.selectSession(item.dataset.sessionId);
        }
      });
    });

    // Delete buttons
    container.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSession(btn.dataset.sessionId);
      });
    });
  }

  /**
   * Select a session
   */
  async selectSession(sessionId) {
    try {
      this.currentSession = await this.api.getSession(sessionId);
      this.showChatPanel();
      await this.loadMessages();
      this.connectToEvents();
    } catch (error) {
      console.error('Failed to select session:', error);
      this.showToast('Failed to load session', 'error');
    }
  }

  /**
   * Load messages for current session
   */
  async loadMessages() {
    if (!this.currentSession) return;

    try {
      this.messages = await this.api.getMessages(this.currentSession.id);
      this.renderMessages();
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.showToast('Failed to load messages', 'error');
    }
  }

  /**
   * Render messages
   */
  renderMessages() {
    const container = document.getElementById('messages-container');
    
    if (this.messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <p>Start a conversation with OpenCode</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.messages.map(message => `
      <div class="message message-${message.role}">
        <div class="message-avatar">
          ${message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">${message.role === 'user' ? 'You' : 'OpenCode'}</span>
            <span class="message-time">${this.formatTime(message.timestamp)}</span>
          </div>
          <div class="message-body">${this.formatMessageContent(message.content)}</div>
        </div>
      </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Send message
   */
  async sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message || !this.currentSession || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.updateSendButton();

    try {
      // Add user message to UI immediately
      this.addMessage({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Clear input
      input.value = '';
      this.autoResizeTextarea(input);

      // Send to API
      await this.api.sendMessage(this.currentSession.id, message);

      // Messages will update via SSE
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showToast('Failed to send message', 'error');
    } finally {
      this.isProcessing = false;
      this.updateSendButton();
    }
  }

  /**
   * Add message to UI
   */
  addMessage(message) {
    this.messages.push(message);
    this.renderMessages();
  }

  /**
   * Connect to SSE events
   */
  connectToEvents() {
    this.api.disconnectEventStream();

    this.api.on('message', (event) => {
      this.handleEvent(event);
    });

    this.api.connectEventStream();
  }

  /**
   * Handle SSE event
   */
  handleEvent(event) {
    switch (event.type) {
      case 'message.part.updated':
        this.handleMessagePartUpdated(event.properties);
        break;
      case 'todo.updated':
        this.handleTodoUpdated(event.properties);
        break;
      case 'question.asked':
        this.handleQuestionAsked(event.properties);
        break;
      case 'permission.requested':
        this.handlePermissionRequested(event.properties);
        break;
    }
  }

  /**
   * Handle message part update
   */
  handleMessagePartUpdated(properties) {
    if (properties.sessionID !== this.currentSession?.id) return;

    // Find existing message and update it
    const messageIndex = this.messages.findIndex(m => m.id === properties.messageID);
    if (messageIndex > -1) {
      this.messages[messageIndex].content += properties.delta;
      this.renderMessages();
    } else {
      // New message
      this.addMessage({
        id: properties.messageID,
        role: 'assistant',
        content: properties.delta,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle todo update
   */
  handleTodoUpdated(properties) {
    if (properties.sessionID !== this.currentSession?.id) return;
    // Could render todos in UI
    console.log('Todos updated:', properties.todos);
  }

  /**
   * Handle question asked
   */
  handleQuestionAsked(properties) {
    if (properties.sessionID !== this.currentSession?.id) return;
    this.showQuestionModal(properties);
  }

  /**
   * Handle permission requested
   */
  handlePermissionRequested(properties) {
    if (properties.sessionID !== this.currentSession?.id) return;
    this.showPermissionModal(properties);
  }

  /**
   * Show new session modal
   */
  showNewSessionModal() {
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Create New Session</h3>
          <button class="btn btn-icon modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="session-title-input">Session Title (optional)</label>
            <input type="text" id="session-title-input" class="form-input" placeholder="My coding session">
          </div>
          <div class="form-group">
            <label for="session-prompt-input">Initial Prompt (optional)</label>
            <textarea id="session-prompt-input" class="form-textarea" rows="3" placeholder="What would you like to work on?"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-create-session">Create Session</button>
        </div>
      </div>
    `;

    this.showModal();

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-cancel').addEventListener('click', () => this.hideModal());
    modal.querySelector('#btn-create-session').addEventListener('click', () => this.createNewSession());
  }

  /**
   * Create new session
   */
  async createNewSession() {
    const title = document.getElementById('session-title-input').value.trim();
    const prompt = document.getElementById('session-prompt-input').value.trim();

    try {
      const session = await this.api.createSession({ title });
      this.hideModal();
      this.showToast('Session created', 'success');
      await this.loadSessions();
      this.selectSession(session.id);

      if (prompt) {
        document.getElementById('message-input').value = prompt;
        this.sendMessage();
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      this.showToast('Failed to create session', 'error');
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await this.api.deleteSession(sessionId);
      this.showToast('Session deleted', 'success');
      
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
        this.showSessionsPanel();
      }
      
      await this.loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      this.showToast('Failed to delete session', 'error');
    }
  }

  /**
   * Show session menu
   */
  showSessionMenu() {
    if (!this.currentSession) return;

    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal modal-menu">
        <div class="modal-header">
          <h3>Session Options</h3>
          <button class="btn btn-icon modal-close">×</button>
        </div>
        <div class="modal-body">
          <button class="menu-item" id="menu-export">Export Session</button>
          <button class="menu-item" id="menu-todos">View Todos</button>
          <button class="menu-item menu-danger" id="menu-delete">Delete Session</button>
        </div>
      </div>
    `;

    this.showModal();

    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('#menu-export').addEventListener('click', () => {
      this.hideModal();
      this.exportSession();
    });
    modal.querySelector('#menu-todos').addEventListener('click', () => {
      this.hideModal();
      this.showTodos();
    });
    modal.querySelector('#menu-delete').addEventListener('click', () => {
      this.hideModal();
      this.deleteSession(this.currentSession.id);
    });
  }

  /**
   * Export session
   */
  async exportSession() {
    if (!this.currentSession) return;

    try {
      const data = {
        session: this.currentSession,
        messages: this.messages
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opencode-session-${this.currentSession.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showToast('Session exported', 'success');
    } catch (error) {
      console.error('Failed to export session:', error);
      this.showToast('Failed to export session', 'error');
    }
  }

  /**
   * Show todos
   */
  async showTodos() {
    if (!this.currentSession) return;

    try {
      const todos = await this.api.getTodos(this.currentSession.id);
      
      const modal = document.getElementById('modal-content');
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>Todos</h3>
            <button class="btn btn-icon modal-close">×</button>
          </div>
          <div class="modal-body">
            ${todos.length === 0 ? '<p class="empty-text">No todos yet</p>' : `
              <ul class="todo-list">
                ${todos.map(todo => `
                  <li class="todo-item ${todo.completed ? 'completed' : ''}">
                    <span class="todo-checkbox">${todo.completed ? '✓' : '○'}</span>
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                  </li>
                `).join('')}
              </ul>
            `}
          </div>
        </div>
      `;

      this.showModal();
      modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.showToast('Failed to load todos', 'error');
    }
  }

  /**
   * Show question modal
   */
  showQuestionModal(properties) {
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Question</h3>
        </div>
        <div class="modal-body">
          ${properties.questions.map(q => `
            <div class="question">
              <p>${this.escapeHtml(q.question)}</p>
              ${q.type === 'choice' ? `
                <div class="question-options">
                  ${q.options.map(opt => `
                    <button class="btn btn-secondary question-option" data-value="${opt.value}">
                      ${this.escapeHtml(opt.label)}
                    </button>
                  `).join('')}
                </div>
              ` : `
                <input type="text" class="form-input question-input" placeholder="Your answer">
              `}
            </div>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-answer-question">Submit</button>
        </div>
      </div>
    `;

    this.showModal();

    modal.querySelector('#btn-answer-question').addEventListener('click', async () => {
      const answers = properties.questions.map((q, i) => {
        if (q.type === 'choice') {
          const selected = modal.querySelector('.question-option.selected');
          return selected ? selected.dataset.value : null;
        } else {
          return modal.querySelector('.question-input').value;
        }
      });

      try {
        await this.api.answerQuestion(properties.requestID, answers);
        this.hideModal();
      } catch (error) {
        console.error('Failed to answer question:', error);
        this.showToast('Failed to submit answer', 'error');
      }
    });

    // Option selection
    modal.querySelectorAll('.question-option').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.question-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  /**
   * Show permission modal
   */
  showPermissionModal(properties) {
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Permission Required</h3>
        </div>
        <div class="modal-body">
          <p>OpenCode wants to: <strong>${this.escapeHtml(properties.description)}</strong></p>
          ${properties.risk ? `<p class="text-warning">Risk: ${properties.risk}</p>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-deny-permission">Deny</button>
          <button class="btn btn-primary" id="btn-grant-permission">Allow</button>
        </div>
      </div>
    `;

    this.showModal();

    modal.querySelector('#btn-deny-permission').addEventListener('click', async () => {
      try {
        await this.api.grantPermission(properties.requestID, false);
        this.hideModal();
      } catch (error) {
        console.error('Failed to deny permission:', error);
      }
    });

    modal.querySelector('#btn-grant-permission').addEventListener('click', async () => {
      try {
        await this.api.grantPermission(properties.requestID, true);
        this.hideModal();
      } catch (error) {
        console.error('Failed to grant permission:', error);
      }
    });
  }

  /**
   * Show settings modal
   */
  showSettingsModal() {
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Settings</h3>
          <button class="btn btn-icon modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="settings-url">Server URL</label>
            <input type="url" id="settings-url" class="form-input" value="${this.api.baseUrl}">
          </div>
          <div class="form-group">
            <label for="settings-username">Username</label>
            <input type="text" id="settings-username" class="form-input" value="${this.api.username}">
          </div>
          <div class="form-group">
            <label for="settings-password">Password</label>
            <input type="password" id="settings-password" class="form-input" placeholder="••••••••">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="settings-theme" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}>
              Dark Mode
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save-settings">Save</button>
        </div>
      </div>
    `;

    this.showModal();

    modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    modal.querySelector('.modal-cancel').addEventListener('click', () => this.hideModal());
    modal.querySelector('#btn-save-settings').addEventListener('click', () => this.saveSettings());
  }

  /**
   * Save settings
   */
  saveSettings() {
    const url = document.getElementById('settings-url').value;
    const username = document.getElementById('settings-username').value;
    const password = document.getElementById('settings-password').value;
    const darkMode = document.getElementById('settings-theme').checked;

    // Update API config
    this.api.baseUrl = url;
    this.api.username = username;
    this.api.password = password;

    // Persist only non-sensitive settings. The password remains in memory
    // for this page lifetime and is removed from legacy localStorage.
    localStorage.setItem('opencode-url', url);
    localStorage.setItem('opencode-username', username);
    localStorage.removeItem('opencode-password');

    // Apply theme
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('opencode-theme', darkMode ? 'dark' : 'light');

    this.hideModal();
    this.showToast('Settings saved. Password will be forgotten when this page reloads.', 'success');

    // Reconnect
    this.loadSessions();
  }

  /**
   * Show chat panel (mobile)
   */
  showChatPanel() {
    document.getElementById('sessions-panel').classList.add('hidden');
    document.getElementById('chat-panel').classList.add('active');
    
    if (this.currentSession) {
      document.getElementById('session-title').textContent = this.currentSession.title || 'Untitled Session';
      document.getElementById('message-input').disabled = false;
      document.getElementById('btn-send').disabled = false;
    }
  }

  /**
   * Show sessions panel (mobile)
   */
  showSessionsPanel() {
    document.getElementById('sessions-panel').classList.remove('hidden');
    document.getElementById('chat-panel').classList.remove('active');
  }

  /**
   * Show modal
   */
  showModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  /**
   * Hide modal
   */
  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Auto resize textarea
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  /**
   * Update send button state
   */
  updateSendButton() {
    const btn = document.getElementById('btn-send');
    const input = document.getElementById('message-input');
    
    if (this.isProcessing) {
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;
    } else {
      btn.innerHTML = '<span class="icon">↑</span>';
      btn.disabled = !input.value.trim() || !this.currentSession;
    }
  }

  /**
   * Format message content (basic markdown)
   */
  formatMessageContent(content) {
    if (!content) return '';
    
    // Escape HTML first
    let formatted = this.escapeHtml(content);
    
    // Code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Format time
   */
  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  }
}

// Export for ES modules
export default OpenCodeUI;