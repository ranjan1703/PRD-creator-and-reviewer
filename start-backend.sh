#!/bin/bash

echo "🔧 Killing any existing backend processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "🚀 Starting PRD System Backend..."
cd "$(dirname "$0")/backend"

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Start the backend
npm run dev
