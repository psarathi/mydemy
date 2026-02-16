#!/bin/bash

# Deployment script for mydemy
# This script pulls latest changes, builds the project, and restarts PM2
#
# Usage: ./deploy.sh [--with-courses]
#   --with-courses  Re-scan and process all courses before building

set -e  # Exit immediately if a command exits with a non-zero status

# Parse arguments
PROCESS_COURSES=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-courses)
            PROCESS_COURSES=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

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

# Process courses if requested
if [ "$PROCESS_COURSES" = true ]; then
    echo "📚 Processing courses..."
    node fetchCoursesScript.js
    cp courses.json public/courses.json
    echo "✅ Courses processed and copied"
    echo ""
fi

# Build the project
echo "🔨 Building the project..."
npx next build
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
