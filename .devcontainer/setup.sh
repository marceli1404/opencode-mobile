#!/bin/bash
set -e

echo "🚀 Setting up OpenCode Mobile environment..."

# Install OpenCode
echo "Installing OpenCode..."
curl -fsSL https://opencode.ai/install | bash

# Add OpenCode to PATH
if [ -d "$HOME/.opencode/bin" ]; then
  echo 'export PATH="$HOME/.opencode/bin:$PATH"' >> ~/.bashrc
  echo 'export PATH="$HOME/.opencode/bin:$PATH"' >> ~/.profile
fi

# Install Node dependencies
echo "Installing Node dependencies..."
npm install

# Configure OpenCode server credentials.
# A forwarded Codespace port can be reachable beyond your machine, so never
# fall back to a shared, well-known default password. If none is provided,
# generate a strong random one and print it once.
if [ -z "$OPENCODE_SERVER_PASSWORD" ]; then
  if command -v openssl >/dev/null 2>&1; then
    OPENCODE_SERVER_PASSWORD="$(openssl rand -hex 24)"
  else
    OPENCODE_SERVER_PASSWORD="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
  fi
  export OPENCODE_SERVER_PASSWORD
  echo "🔐 OPENCODE_SERVER_PASSWORD was not set — generated a random one:"
  echo "    $OPENCODE_SERVER_PASSWORD"
  echo "   (saved to ~/.bashrc; store it in your password manager)"
  echo "# OpenCode Server Configuration" >> ~/.bashrc
  echo "export OPENCODE_SERVER_PASSWORD=\"$OPENCODE_SERVER_PASSWORD\"" >> ~/.bashrc
  echo "export OPENCODE_SERVER_USERNAME=\"opencode\"" >> ~/.bashrc
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start OpenCode server:"
echo "  npm run server"
echo ""
echo "To start the mobile UI:"
echo "  npm start"
echo ""
echo "Access the UI at:"
echo "  http://localhost:3000"
echo ""