#!/bin/bash

# Deployment script for mydemy
# This script pulls latest changes, builds the project, and restarts PM2

set -e  # Exit immediately if a command exits with a non-zero status

# Default to main if no argument provided
BRANCH=${1:-main}

echo "🚀 Starting deployment for branch: $BRANCH..."
echo ""

# Pull latest changes from origin/$BRANCH
echo "📥 Pulling latest changes from origin/$BRANCH..."
git fetch origin $BRANCH
git checkout $BRANCH
git pull origin $BRANCH
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
