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

# courses.json is no longer tracked in git, so it persists across deploys.
# Guard against a fresh checkout where it doesn't exist yet: the build
# (getStaticPaths) requires the file to be present. An empty list is a safe
# placeholder until a --with-courses run populates it.
if [ ! -f courses.json ]; then
    echo "⚠️  courses.json missing — creating empty placeholder (run with --with-courses to populate)"
    echo "[]" > courses.json
fi
cp courses.json public/courses.json

echo "🔨 Building the project..."
npx next build
echo "✅ Build complete — handing off to myharness for quality gates."
