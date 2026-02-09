#!/bin/bash

# PRD System - Setup and Run Script
# This script will install dependencies and start both backend and frontend

set -e  # Exit on error

echo "🚀 PRD System Setup & Run Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js v18+ first:"
    echo "  brew install node"
    echo ""
    echo "Or download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found"
    echo "📝 Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your ANTHROPIC_API_KEY!"
    echo "   Example: ANTHROPIC_API_KEY=sk-ant-your-key-here"
    echo ""
    read -p "Press Enter after you've added your API key to backend/.env..."
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Frontend .env created"
    echo ""
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Run type checking
echo "🔍 Running backend type check..."
npm run typecheck
echo "✅ Backend types are valid"
echo ""

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Run type checking
echo "🔍 Running frontend type check..."
npm run typecheck
echo "✅ Frontend types are valid"
echo ""

cd ..

# Success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "Or run both in one terminal:"
echo "  ./run-both.sh"
echo ""
