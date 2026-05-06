#!/usr/bin/env bash
set -euo pipefail

# Optional: --with-courses re-scans courses before building.
# Pass this manually when invoking deploy script directly.
# myharness's pipeline calls this without args (regular deploy).
PROCESS_COURSES=false
[[ "${1:-}" == "--with-courses" ]] && PROCESS_COURSES=true

# myharness already did git fetch + checkout + pull; no need to repeat.
cd /opt/mydemy

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

if [ "$PROCESS_COURSES" = true ]; then
    echo "📚 Processing courses..."
    node fetchCoursesScript.js
    cp courses.json public/courses.json
    echo "✅ Courses processed and copied"
fi

echo "🔨 Building the project..."
npx next build
echo "✅ Build complete — handing off to myharness for quality gates."
