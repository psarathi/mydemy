# Course Data Architecture

## Problem Statement

Previously, all course information was stored in a static `courses.json` file bundled with the desktop app. This meant:
- ❌ Every new course required rebuilding the desktop app
- ❌ Users had to download and install a new version to see new courses
- ❌ No way to update course listings without a full app update

## Solution: Hybrid Remote + Local Architecture

We now support **dynamic course updates** without rebuilding the desktop app, while maintaining offline functionality.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Web App (Browser)                        │
│                                                             │
│  1. Fetch from NEXT_PUBLIC_COURSES_ENDPOINT                │
│  2. Fallback to /api/courses                               │
│  3. SWR caching (60s dedup, 5min refresh)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Desktop App (Tauri)                        │
│                                                             │
│  Priority:                                                  │
│  1. Remote endpoint (NEXT_PUBLIC_COURSES_ENDPOINT)         │
│     └─> Cached to app data directory                       │
│  2. Cached courses (from previous fetch)                   │
│  3. Bundled courses.json (offline fallback)                │
│                                                             │
│  Features:                                                  │
│  ✅ Auto-update every 5 minutes                            │
│  ✅ Manual "Check for Updates" button                      │
│  ✅ Works offline (uses cache/bundled)                     │
│  ✅ Persistent cache in app data directory                 │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### For Web Users

The web app uses **SWR (stale-while-revalidate)** to fetch courses:

1. Tries `NEXT_PUBLIC_COURSES_ENDPOINT` (if configured)
2. Falls back to `/api/courses` (local API route)
3. Automatically refreshes every 5 minutes
4. Caches responses for 60 seconds

**File:** `hooks/useCourses.js`

### For Desktop Users

The desktop app uses **Tauri native commands** for smarter caching:

1. **On startup:**
   - Tries to load cached courses (instant display)
   - Fetches from remote endpoint in background
   - Updates cache if new data available

2. **Auto-refresh:**
   - Checks for updates every 5 minutes (if online)
   - Saves to app data directory for offline use

3. **Offline mode:**
   - Uses cached courses from last successful fetch
   - Falls back to bundled courses.json if no cache

**Files:**
- `hooks/useTauriCourses.js` - Desktop-specific hook
- `src-tauri/src/lib.rs` - Tauri commands (Rust)

---

## Setup Instructions

### 1. Configure Environment Variables

Add to your `.env.local` or `.env`:

```bash
# URL where courses.json is hosted (CDN, server, etc.)
NEXT_PUBLIC_COURSES_ENDPOINT=https://your-cdn.com/courses.json

# Or use same CDN as videos:
NEXT_PUBLIC_COURSES_ENDPOINT=http://192.168.1.141:5555/courses.json
```

### 2. Configure Upload Method

Choose how to upload courses.json to your server:

```bash
# Option A: SCP (SSH File Transfer)
COURSES_UPLOAD_METHOD=scp
COURSES_UPLOAD_ENDPOINT=user@server.com:/var/www/html/courses.json
# Optional:
COURSES_UPLOAD_KEY=/path/to/ssh/key

# Option B: HTTP PUT Request
COURSES_UPLOAD_METHOD=http
COURSES_UPLOAD_ENDPOINT=https://cdn.example.com/courses.json
COURSES_UPLOAD_AUTH=your_bearer_token

# Option C: Custom (edit uploadCoursesToCDN.js)
COURSES_UPLOAD_METHOD=custom
```

---

## Workflow: Adding New Courses

### Old Workflow (Before)

1. Add course videos to `COURSES_FOLDER`
2. Run `npm run build` (generates courses.json)
3. Run `npm run tauri:build` (rebuild desktop app)
4. Distribute new app to all users
5. Users download and install update

⏱️ **Time:** 30+ minutes | **Effort:** High | **User friction:** High

### New Workflow (After)

#### Just Adding Courses (No Code Changes)

1. Add course videos to `COURSES_FOLDER`
2. Run `npm run update:courses`
   - Generates fresh courses.json
   - Uploads to CDN/server automatically
3. Done! ✨

⏱️ **Time:** 2 minutes | **Effort:** Low | **User friction:** None

Desktop apps automatically fetch the new courses on next launch or within 5 minutes.

#### Building Desktop App (With Courses Upload)

1. Make code/UI changes
2. Run `npm run tauri:build`
   - Generates courses.json
   - Builds web app
   - **Uploads courses.json to CDN** (automatic!)
   - Builds desktop app

⏱️ **Time:** ~10 minutes | **Includes:** Latest courses + app updates

The upload step is now integrated into the build process, ensuring your CDN always has the latest courses when you build the desktop app.

---

## Available Scripts

### Generate Courses Only

```bash
npm run build:courses
```

Generates `courses.json` and copies to `public/courses.json` (no Next.js build).

### Upload to Remote Server

```bash
npm run upload:courses
```

Uploads `courses.json` to your configured endpoint (SCP, HTTP, or custom).

### Generate + Upload (Recommended)

```bash
npm run update:courses
```

Combines both commands: generates and uploads in one step.

### Full Desktop App Build

```bash
npm run tauri:build        # Builds web app + uploads courses + builds desktop app
npm run tauri:build:mac    # Same but for macOS (aarch64)
```

This automatically:
1. Generates courses.json from your COURSES_FOLDER
2. Builds the Next.js web app
3. **Uploads courses.json to your CDN** (automatically!)
4. Builds the Tauri desktop app

Only needed for:
- Code changes
- UI updates
- Major app updates
- First-time setup

**Not needed** for just adding/removing courses! Use `npm run update:courses` instead.

---

## File Structure

```
mydemy/
├── courses.json                    # Generated (gitignored)
├── public/courses.json             # Copy for static exports
├── uploadCoursesToCDN.js          # Upload script
│
├── hooks/
│   ├── useCourses.js              # Hybrid hook (detects web vs desktop)
│   └── useTauriCourses.js         # Desktop-specific logic
│
├── src-tauri/
│   ├── src/lib.rs                 # Tauri commands (Rust)
│   └── Cargo.toml                 # Dependencies (reqwest, tokio)
│
└── pages/
    └── api/courses.js             # Web API endpoint
```

---

## Tauri Commands (Desktop)

The desktop app exposes these Rust commands to JavaScript:

### `fetch_remote_courses(endpoint: string)`
Fetches courses from remote URL with 10-second timeout.

### `get_cached_courses()`
Loads courses from app data directory cache.

### `update_courses(endpoint: string)`
Fetches from remote AND saves to cache.

### `get_bundled_courses()`
Loads bundled courses.json from app resources (offline fallback).

**Usage in React:**

```javascript
import { invoke } from '@tauri-apps/api/core';

const courses = await invoke('update_courses', {
  endpoint: 'https://cdn.example.com/courses.json'
});
```

---

## Cache Locations

### Desktop App (Tauri)

**Linux:** `~/.local/share/mydemy/courses.json`
**macOS:** `~/Library/Application Support/mydemy/courses.json`
**Windows:** `C:\Users\<user>\AppData\Roaming\mydemy\courses.json`

To clear cache: Delete the `courses.json` file from your OS's app data directory.

### Web App (SWR)

In-memory cache (browser). Clears on page refresh.

---

## UI Features (Desktop)

The `useTauriCourses` hook provides these extra properties:

```javascript
const {
  courses,           // Array of course objects
  isLoading,         // Loading state
  isError,           // Error state
  errorMessage,      // Error details
  updateStatus,      // 'idle' | 'checking' | 'downloading' | 'success' | 'error'
  isUsingFallback,   // true if using bundled/cached instead of remote
  checkForUpdates,   // Manual update function
} = useCourses();
```

**Example: "Check for Updates" Button**

```jsx
<button onClick={checkForUpdates} disabled={updateStatus === 'downloading'}>
  {updateStatus === 'downloading' ? 'Checking...' : 'Check for Updates'}
</button>

{updateStatus === 'success' && (
  <p>✅ Courses updated!</p>
)}

{isUsingFallback && (
  <p>⚠️ Offline mode - using cached courses</p>
)}
```

---

## Testing

### Test Remote Fetch (Desktop)

1. Start desktop app: `npm run tauri:dev`
2. Open browser console (DevTools)
3. Check logs for "Fetching from remote..." messages

### Test Offline Mode (Desktop)

1. Disconnect from internet
2. Start desktop app
3. Should show cached or bundled courses
4. Check console for "Using cached courses" message

### Test Web App

1. Run `npm run dev`
2. Open http://localhost:3000
3. Check Network tab for courses fetch
4. Should use `/api/courses` or remote endpoint

---

## Troubleshooting

### Desktop app not updating

**Check:**
1. `NEXT_PUBLIC_COURSES_ENDPOINT` is set correctly in `.env`
2. Endpoint is accessible (try in browser)
3. CORS headers allow desktop app origin
4. Check app data directory for cached courses.json

**Fix:** Clear cache and restart app.

### Upload fails

**SCP Method:**
- Verify SSH credentials
- Test manually: `scp courses.json user@server:/path/`
- Check file permissions on server

**HTTP Method:**
- Verify endpoint accepts PUT requests
- Check authentication token
- Test with curl: `curl -X PUT -d @courses.json https://...`

### Courses show as empty

**Check:**
1. `courses.json` is not empty (run `cat courses.json`)
2. `public/courses.json` exists and matches
3. COURSES_FOLDER environment variable points to correct directory
4. Videos have valid extensions (.mp4, .avi, etc.)

**Fix:** Run `npm run build:courses` to regenerate.

---

## Migration Guide

### Updating Existing Desktop Apps

Users with the old desktop app version will:
1. Download the new version (one-time update)
2. Future course updates happen automatically (no reinstall needed)

### Backward Compatibility

The new architecture is **fully backward compatible**:
- If `NEXT_PUBLIC_COURSES_ENDPOINT` is not set, uses bundled courses.json
- Works offline with bundled/cached data
- Web app continues to work with `/api/courses` endpoint

---

## Advanced: Custom Upload Method

Edit `uploadCoursesToCDN.js` to add custom upload logic:

```javascript
async function uploadCustom() {
  // Example: AWS S3
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3();
  const fileContent = fs.readFileSync(COURSES_FILE);

  await s3.upload({
    Bucket: 'your-bucket',
    Key: 'courses.json',
    Body: fileContent,
    ContentType: 'application/json',
  }).promise();

  console.log('✅ Uploaded to S3');
}
```

Then set `COURSES_UPLOAD_METHOD=custom` in `.env`.

---

## Benefits Summary

### For Developers

✅ No app rebuilds for course updates
✅ Simple workflow: `npm run update:courses`
✅ Works with any CDN/server
✅ Automatic caching and offline support

### For Users

✅ Instant course updates (no reinstall)
✅ Works offline with cached data
✅ Automatic background updates every 5 minutes
✅ Manual "Check for Updates" option

### For Infrastructure

✅ Reduced server load (CDN caching)
✅ Smaller app updates (code only, not data)
✅ Flexible hosting (any CDN/server/S3/etc.)
✅ No database required

---

## Questions?

- Configuration issues: Check `.env.example` for all available options
- Upload problems: See `uploadCoursesToCDN.js` comments
- Desktop app issues: Check Tauri console logs
- Web app issues: Check browser DevTools console

Happy learning! 🎓
