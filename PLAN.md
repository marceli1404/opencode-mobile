# OpenCode Phone Access via GitHub Codespaces

## Overview
Set up OpenCode on GitHub Codespaces with a custom web UI for phone access, using cloud-based authentication.

## Architecture
```
Phone Browser → GitHub Codespace (OpenCode Web Server) → Custom Web UI → OpenCode API
```

## Prerequisites
- GitHub account with Codespaces access
- Node.js 18+ (for custom web UI)
- OpenCode installed in Codespace

## Step-by-Step Plan

### Phase 1: GitHub Codespace Setup

1. **Create a new Codespace**
   - Go to GitHub → New repository or existing one
   - Click "Code" → "Codespaces" → "Create codespace"
   - Select machine type (recommend 4-core for better performance)

2. **Install OpenCode in Codespace**
   ```bash
   # Install OpenCode
   curl -fsSL https://opencode.ai/install | bash
   
   # Verify installation
   opencode --version
   ```

3. **Configure OpenCode for web access**
   ```bash
   # Set up environment variables
   export OPENCODE_SERVER_PASSWORD="your-secure-password"
   export OPENCODE_SERVER_USERNAME="opencode"
   
   # Start OpenCode web server
   opencode web --port 4096 --hostname 0.0.0.0
   ```

4. **Configure Codespace port forwarding**
   - In VS Code (web or desktop), go to Ports tab
   - Port 4096 should be auto-detected
   - Set visibility to "Public" for phone access
   - Copy the forwarded URL (e.g., `https://xxxx-4096.app.github.dev`)

### Phase 2: Custom Web UI Development

5. **Create project structure**
   ```
   opencode-mobile-ui/
   ├── package.json
   ├── index.html
   ├── src/
   │   ├── main.js
   │   ├── api.js
   │   ├── ui.js
   │   └── styles.css
   └── README.md
   ```

6. **Implement API client (src/api.js)**
   - Connect to OpenCode REST API
   - Handle SSE for real-time updates
   - Manage authentication (basic auth)
   - Key endpoints:
     - `POST /session/:sessionID/message` - Send messages
     - `GET /session/status` - Check status
     - `GET /session/:sessionID/todo` - Get todos
     - Event stream for real-time updates

7. **Build mobile-friendly UI (src/ui.js)**
   - Chat interface for sending messages
   - Session management (create, list, continue)
   - Real-time message updates via SSE
   - File attachment support
   - Responsive design for mobile screens

8. **Style for mobile (src/styles.css)**
   - Mobile-first responsive design
   - Touch-friendly controls
   - Dark/light theme support
   - Optimized for phone screens

### Phase 3: Authentication & Security

9. **Implement cloud authentication**
   - Option A: Use OpenCode's built-in basic auth
   - Option B: Add GitHub OAuth proxy
   - Store credentials securely in Codespace secrets

10. **Configure CORS for phone access**
    ```bash
    # In Codespace terminal
    opencode web --port 4096 --hostname 0.0.0.0 --cors https://your-phone-domain.com
    ```

### Phase 4: Deployment & Testing

11. **Deploy custom web UI**
    - Serve from Codespace or static hosting
    - Update API endpoint to Codespace forwarded URL
    - Test authentication flow

12. **Test from phone**
    - Open phone browser
    - Navigate to Codespace URL
    - Login with credentials
    - Test sending messages to OpenCode
    - Verify real-time updates work

### Phase 5: Optional Enhancements

13. **Add features**
    - Session persistence
    - File upload/download
    - Voice input support
    - Push notifications for responses
    - Offline mode with sync

## Key OpenCode API Endpoints

### Session Management
- `POST /session` - Create new session
- `GET /session` - List sessions
- `GET /session/:sessionID` - Get session details
- `DELETE /session/:sessionID` - Delete session

### Messaging
- `POST /session/:sessionID/message` - Send message
- `GET /session/:sessionID/message` - Get messages
- `GET /session/:sessionID/todo` - Get todos

### Server
- `GET /session/status` - Check all session statuses
- `GET /doc` - OpenAPI documentation

### Events (SSE)
- `message.part.updated` - Real-time message updates
- `todo.updated` - Todo list changes
- `question.asked` - AI questions
- `permission.requested` - Permission requests

## Authentication Flow

```
Phone → Codespace URL → OpenCode Web Server
         ↓
    Basic Auth Check
         ↓
    Valid Credentials?
         ↓ (Yes)
    Access Granted → Custom UI loads
         ↓
    UI connects to API
         ↓
    SSE connection established
         ↓
    Real-time updates begin
```

## Security Considerations

1. **Use strong password** for OpenCode server
2. **Enable HTTPS** via Codespace's automatic SSL
3. **Limit CORS** to your phone's browser
4. **Rotate credentials** periodically
5. **Monitor access logs** in Codespace

## Mobile-Specific Features

1. **Responsive chat bubbles** for messages
2. **Swipe gestures** for session navigation
3. **Voice-to-text** input option
4. **Offline queue** for messages
5. **Battery optimization** for SSE connections

## Testing Checklist

- [ ] Codespace starts successfully
- [ ] OpenCode web server runs on port 4096
- [ ] Port forwarding works (public URL accessible)
- [ ] Custom web UI loads on phone
- [ ] Authentication works
- [ ] Can send messages to OpenCode
- [ ] Real-time updates received
- [ ] Session management works
- [ ] File attachments work
- [ ] Performance is acceptable on mobile

## Cost Considerations

- **GitHub Codespaces**: Free tier includes 120 core-hours/month
- **Machine type**: 4-core recommended (~$0.18/hour)
- **Storage**: 15GB included free
- **Usage**: OpenCode web server uses minimal resources

## Next Steps

1. Start with Phase 1 (Codespace setup)
2. Test basic OpenCode web access
3. Build custom UI incrementally
4. Add features based on needs
5. Optimize for mobile experience

## Resources

- OpenCode Web Docs: https://opencode.ai/docs/web
- OpenCode Server API: https://opencode.ai/docs/server
- GitHub Codespaces: https://docs.github.com/en/codespaces
- OpenCode GitHub: https://github.com/anomalyco/opencode