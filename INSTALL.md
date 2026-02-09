# Quick Installation Guide

## Install Node.js (Choose One Method)

### Method 1: Using Homebrew (Recommended)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

### Method 2: Download from Official Website
1. Visit https://nodejs.org/
2. Download Node.js v20 LTS (Long Term Support)
3. Run the installer
4. Verify: Open Terminal and run `node --version`

### Method 3: Using NVM (Node Version Manager)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.zshrc  # or source ~/.bash_profile

# Install Node.js
nvm install 20
nvm use 20

# Verify
node --version
```

## After Installing Node.js

Run this command to set up everything:

```bash
cd /Users/ranjansingh/Documents/prd-system
./setup-and-run.sh
```

This will:
1. ✅ Install all dependencies
2. ✅ Create .env files
3. ✅ Run type checking
4. ✅ Guide you through adding your API key

## Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. Paste it in `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

## Start the Application

```bash
# Start both servers
./run-both.sh

# Or start separately:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Then open: http://localhost:5173

## Troubleshooting

### "node: command not found"
- Close and reopen your Terminal
- Run: `source ~/.zshrc` or `source ~/.bash_profile`
- Check PATH: `echo $PATH`

### "Permission denied"
```bash
chmod +x setup-and-run.sh run-both.sh
```

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```
