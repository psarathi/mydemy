#!/bin/bash

# Deployment script for mydemy
# This script pulls latest changes, builds the project, and restarts PM2

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting deployment..."
echo ""

# Pull latest changes from origin/main
echo "📥 Pulling latest changes from origin/main..."
git pull origin main
echo "✅ Git pull completed"
echo ""

# Install dependencies (in case package.json changed)
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build the project
echo "🔨 Building the project..."
npm run build
echo "✅ Build completed"
echo ""

# Restart PM2 process
echo "🔄 Restarting PM2 process 'mydemy'..."
pm2 restart mydemy
echo "✅ PM2 process restarted"
echo ""

# Show PM2 status
echo "📊 Current PM2 status:"
pm2 list
echo ""

echo "✨ Deployment completed successfully!"
