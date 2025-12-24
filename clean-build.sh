#!/bin/bash

# Clean build script for Mydemy Tauri app
echo "🧹 Cleaning previous build artifacts..."

# Remove out directory (may need sudo if there are permission issues)
if [ -d "out" ]; then
    echo "Removing out directory..."
    rm -rf out 2>/dev/null || {
        echo "⚠️  Permission denied. Trying with sudo..."
        sudo rm -rf out
    }
fi

# Remove .next cache
if [ -d ".next" ]; then
    echo "Removing .next directory..."
    rm -rf .next 2>/dev/null || {
        echo "⚠️  Permission denied on .next. Trying with sudo..."
        sudo rm -rf .next
    }
fi

# Clean Tauri target
if [ -d "src-tauri/target" ]; then
    echo "Cleaning Tauri build artifacts..."
    sudo rm -rf src-tauri/target 2>/dev/null || {
        echo "⚠️  Permission denied on Tauri target. Skipping..."
    }
fi

echo "✅ Clean complete! Ready to build."
echo ""
echo "Run: npm run tauri:build:mac"
