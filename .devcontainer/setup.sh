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

# Configure OpenCode server credentials
if [ -z "$OPENCODE_SERVER_PASSWORD" ]; then
  echo "⚠️  OPENCODE_SERVER_PASSWORD not set. Setting a default for development."
  export OPENCODE_SERVER_PASSWORD="dev-password-123"
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