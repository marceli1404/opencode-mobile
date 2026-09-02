# OpenCode Mobile

Mobile-optimized web interface for accessing the [OpenCode](https://opencode.ai) AI coding agent from your phone, deployed via GitHub Codespaces.

## Features

- 📱 **Mobile-first design** - Optimized for phone screens
- 💬 **Real-time chat** - SSE-powered message streaming
- 📝 **Session management** - Create, switch, and delete sessions
- 🔐 **Secure auth** - Password-protected server access
- 🌙 **Dark/light themes** - Auto-detects system preference
- 📤 **Session export** - Download session transcript as JSON
- ✅ **Todo tracking** - View AI task lists
- 🔄 **Live updates** - Real-time responses as OpenCode works

## Quick Start (GitHub Codespaces)

1. **Create a Codespace**
   - Click **Code → Codespaces → Create codespace**

2. **Set server password (REQUIRED)**
   - Add a Codespace secret named `OPENCODE_SERVER_PASSWORD` with a strong password
   - Or set it in your terminal: `export OPENCODE_SERVER_PASSWORD="your-password"`

3. **Start the OpenCode server**
   ```bash
   npm run server
   ```

4. **Start the mobile UI** (in a separate terminal)
   ```bash
   npm start
   ```

5. **Access from your phone**
   - In VS Code, open the **Ports** tab
   - Find port `3000` (the Mobile UI)
   - Click the globe icon to make it **public**
   - Open the forwarded URL on your phone
   - If prompted, make port `4096` public as well

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env and set a strong password

# Start OpenCode server
npm run server

# Start the UI (separate terminal)
npm start

# Access at http://localhost:3000
```

## Project Structure

```
├── .devcontainer/
│   ├── devcontainer.json     # Codespace configuration
│   └── setup.sh              # Auto-install script
├── .github/
│   └── workflows/            # CI/CD automation
├── src/
│   ├── api.js               # OpenCode REST API client
│   ├── auth.js              # Authentication helpers
│   ├── main.js              # App entry point
│   ├── server.js            # OpenCode server manager
│   ├── server-manager.js    # Server CLI launcher
│   ├── styles.css           # Mobile-responsive styles
│   └── ui.js                # UI components
├── index.html               # Main HTML shell
├── vite.config.js           # Vite configuration
├── package.json
└── PLAN.md                  # Detailed setup plan
```

## Features Implemented

### API Client (`src/api.js`)
- Session CRUD operations
- Message sending and retrieval
- Todo management
- SSE event streaming for real-time updates
- Basic auth support
- Question & permission handling

### UI Components (`src/ui.js`)
- Session list with search and delete
- Chat interface with markdown rendering
- Real-time message updates
- Modal dialogs for questions/permissions/todos
- Settings for server config and theme
- Toast notifications

### Server Management (`src/server.js`)
- Automatic OpenCode installation
- Configurable port and hostname
- CORS support
- Health check
- Graceful shutdown

### Mobile Features
- Safe area support for notched phones
- Touch-friendly controls
- Auto-resizing textarea
- PWA manifest for install capability
- Dark/light theme auto-detection

## Configuration

### Environment Variables (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_PORT` | OpenCode server port | `4096` |
| `OPENCODE_HOSTNAME` | Server bind address | `0.0.0.0` |
| `OPENCODE_SERVER_USERNAME` | Auth username | `opencode` |
| `OPENCODE_SERVER_PASSWORD` | Auth password (**required**) | - |
| `OPENCODE_CORS` | Allowed CORS origins (comma-separated) | - |

### Codespace Secrets

Add these in **Settings → Secrets and variables → Codespaces**:

- `OPENCODE_SERVER_PASSWORD` - Strong password (required)

## Security Notes

- Always set a strong `OPENCODE_SERVER_PASSWORD`
- Use HTTPS (automatically provided by Codespaces)
- Keep CORS origins restricted
- Clear credentials when not in use

## Testing

```bash
# Build check
npm run build

# Run dev server
npm start
```

## Troubleshooting

### Can't connect to OpenCode server
1. Verify OpenCode is installed: `opencode --version`
2. Check the server started: `node src/server-manager.js status`
3. Verify the password is set correctly

### Port not accessible from phone
1. Check the Ports tab in VS Code
2. Click the globe icon to make ports public
3. Use the forwarded URL, not localhost

### Real-time updates not working
1. Ensure SSE connection is established
2. Check browser console for errors
3. Verify CORS settings

## License

MIT
