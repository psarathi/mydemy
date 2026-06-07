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

# True only if the file exists and holds a non-empty JSON array (not "[]").
is_populated() {
    [ -s "$1" ] || return 1
    [ "$(tr -d '[:space:]' < "$1")" != "[]" ]
}

# Re-scan the video library and write courses.json. Force SKIP_COURSE_FETCH off
# so the scan actually runs (a stray skip flag would otherwise no-op the heal).
rescan_courses() {
    echo "📚 Scanning video library to (re)build courses.json..."
    if ! SKIP_COURSE_FETCH=false node fetchCoursesScript.js; then
        echo "❌ Course re-scan failed — is the video library mounted at \$COURSES_FOLDER?"
        exit 1
    fi
}

# Neither courses.json (the live catalog the Kafka handler appends to) nor
# public/courses.json (the copy Next serves) is tracked in git, so both must
# survive a deploy. The cardinal rule here: NEVER let an empty placeholder
# overwrite a populated catalog. We only ever sync in the data-preserving
# direction, and an empty catalog self-heals by re-scanning the library.

if [ "$PROCESS_COURSES" = true ]; then
    rescan_courses
fi

# A git pull can remove the root courses.json; rehydrate it from the populated
# served copy so no data is lost and the build has its getStaticPaths input.
if ! is_populated courses.json && is_populated public/courses.json; then
    echo "↩️  Restoring courses.json from populated public/courses.json"
    cp public/courses.json courses.json
fi

# Self-heal: if the catalog is still empty/missing after the restore attempt,
# rebuild it from the source of truth (the video library) rather than shipping
# an empty list. This recovers from a deploy that wiped the catalog.
if ! is_populated courses.json; then
    echo "⚠️  courses.json is empty/missing — auto-triggering a re-scan to repopulate"
    rescan_courses
fi

# Belt-and-suspenders: guarantee the file exists so the build never hard-fails.
if [ ! -f courses.json ]; then
    echo "[]" > courses.json
fi

# Sync the served copy from root, but guard the populated catalog: never clobber
# a populated public/courses.json with an empty root.
if is_populated courses.json || ! is_populated public/courses.json; then
    cp courses.json public/courses.json
else
    echo "🛡️  Root courses.json is empty — keeping populated public/courses.json"
fi

echo "🔨 Building the project..."
npx next build
echo "✅ Build complete — handing off to myharness for quality gates."
