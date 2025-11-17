# Mydemy Desktop App

This repository includes a native macOS desktop application built with [Tauri](https://tauri.app/), wrapping the Next.js web application.

## Quick Start

```bash
# Development
npm run tauri:dev

# Production Build (Universal Binary - Recommended)
npm run tauri:build -- --target universal-apple-darwin

# Build Output
src-tauri/target/universal-apple-darwin/release/bundle/dmg/Mydemy_1.0.0_universal.dmg
```

## Features

- ✅ **Native macOS Application** - Lightweight, fast, and secure
- ✅ **Offline-Ready** - App UI bundled locally
- ✅ **Auto-Updates** - Built-in updater for seamless updates
- ✅ **CDN Integration** - Videos and course content load from CDN
- ✅ **Small Bundle Size** - ~10-20MB (vs 100-200MB for Electron)

## Prerequisites

- Node.js 18+ and npm
- Rust (already installed on your system)
- macOS 10.13+

## Development

### Run the Desktop App in Development Mode

```bash
npm run tauri:dev
```

This will:
1. Start the Next.js dev server on http://localhost:3000
2. Launch the Tauri development window

### Build the Desktop App for Production

**Recommended: Universal Binary (works on both Intel and Apple Silicon Macs)**

```bash
npm run tauri:build -- --target universal-apple-darwin
```

This will:
1. Fetch course data from your CDN (~2-3 minutes)
2. Generate 596 static pages (~5-10 minutes)
3. Compile Rust for both Intel and Apple Silicon (~3-5 minutes)
4. Create `.app` bundle and `.dmg` installer (~1-2 minutes)

**Total build time: 15-20 minutes**

**Alternative: Architecture-specific builds (faster)**

```bash
# Apple Silicon only (M1/M2/M3) - ~10 minutes
npm run tauri:build:mac

# Intel only - ~10 minutes
npm run tauri:build -- --target x86_64-apple-darwin
```

### Build Output Location

After the build completes, find your distributable files:

```
src-tauri/target/universal-apple-darwin/release/bundle/
├── dmg/
│   └── Mydemy_1.0.0_universal.dmg          # Share this file
└── macos/
    └── Mydemy.app                           # Application bundle
```

For architecture-specific builds:
- Apple Silicon: `src-tauri/target/aarch64-apple-darwin/release/bundle/`
- Intel: `src-tauri/target/x86_64-apple-darwin/release/bundle/`

## Project Structure

```
mydemy/
├── components/          # React components (shared with web)
├── pages/              # Next.js pages (shared with web)
├── styles/             # CSS styles (shared with web)
├── public/             # Public assets (shared with web)
├── src-tauri/          # Tauri/Rust desktop app code
│   ├── src/
│   │   ├── main.rs    # Rust entry point
│   │   └── lib.rs     # Tauri app logic & updater
│   ├── icons/         # App icons
│   ├── Cargo.toml     # Rust dependencies
│   └── tauri.conf.json # Tauri configuration
└── next.config.js     # Next.js config (with static export)
```

## Configuration

### Video CDN Configuration

The desktop app loads videos from your CDN/server. Configure the video source URL:

1. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Set the CDN URL in `.env.local`:**
   ```bash
   # URL where video content is served from
   NEXT_PUBLIC_BASE_CDN_PATH=http://your-cdn-domain.com:5555
   # or for production
   NEXT_PUBLIC_BASE_CDN_PATH=https://cdn.yourdomain.com
   ```

3. **The app will use this URL to fetch:**
   - Course videos
   - Course metadata
   - Thumbnails and assets

**Important:** Videos are NOT bundled in the app - they're streamed from your CDN. This keeps the app size small (~10-20MB) while allowing instant content updates.

### App Metadata

Edit `src-tauri/tauri.conf.json` to customize:
- App name and version
- Window size and behavior
- Bundle identifier
- Auto-updater settings

### Auto-Updates

The app includes an auto-updater. To enable it:

1. Generate update keys:
   ```bash
   npx tauri signer generate
   ```

2. Add the public key to `src-tauri/tauri.conf.json`:
   ```json
   "plugins": {
     "updater": {
       "pubkey": "YOUR_PUBLIC_KEY_HERE"
     }
   }
   ```

3. Set up a release server and configure endpoints

## Icons

To customize the app icon:

1. Create a 1024x1024px PNG icon: `src-tauri/icons/app-icon.png`
2. Generate all sizes:
   ```bash
   npx @tauri-apps/cli icon src-tauri/icons/app-icon.png
   ```

See `src-tauri/icons/README.md` for details.

## Distribution

### Option 1: Quick Distribution (Unsigned)

**Best for:** Internal use, testing, or small trusted user groups

1. Share the `.dmg` file:
   ```
   src-tauri/target/universal-apple-darwin/release/bundle/dmg/Mydemy_1.0.0_universal.dmg
   ```

2. Users install by:
   - Opening the `.dmg` file
   - Dragging `Mydemy.app` to Applications folder
   - Right-click > Open (first time only, due to "unidentified developer" warning)

**Pros:** No Apple Developer account required
**Cons:** Users see security warning on first launch

### Option 2: Code Signing (Removes Warning)

**Best for:** Wider distribution, professional appearance
**Requires:** Apple Developer Program membership ($99/year)

1. **Get a Developer ID certificate:**
   - Join Apple Developer Program at developer.apple.com
   - Create a "Developer ID Application" certificate in Xcode or developer portal
   - Install certificate in your Keychain

2. **Sign the app:**
   ```bash
   codesign --deep --force --sign "Developer ID Application: Your Name (TEAM_ID)" \
     src-tauri/target/universal-apple-darwin/release/bundle/macos/Mydemy.app
   ```

3. **Verify signing:**
   ```bash
   codesign --verify --verbose=4 Mydemy.app
   spctl --assess --verbose=4 Mydemy.app
   ```

4. **Create signed DMG:**
   ```bash
   hdiutil create -volname "Mydemy" -srcfolder Mydemy.app \
     -ov -format UDZO Mydemy_signed.dmg
   ```

**Pros:** No security warning for users
**Cons:** Requires paid Apple Developer account

### Option 3: Notarization (Recommended for Public Release)

**Best for:** Public distribution, App Store-like experience
**Requires:** Code signing + Apple Developer account

1. **Code sign the app** (see Option 2)

2. **Create a zip for notarization:**
   ```bash
   cd src-tauri/target/universal-apple-darwin/release/bundle/macos/
   ditto -c -k --keepParent Mydemy.app Mydemy.zip
   ```

3. **Submit for notarization:**
   ```bash
   xcrun notarytool submit Mydemy.zip \
     --apple-id "your@email.com" \
     --team-id "YOUR_TEAM_ID" \
     --password "app-specific-password" \
     --wait
   ```

   > **Note:** Generate an app-specific password at appleid.apple.com

4. **Staple the notarization ticket:**
   ```bash
   xcrun stapler staple Mydemy.app
   ```

5. **Verify notarization:**
   ```bash
   spctl --assess -vv --type install Mydemy.app
   ```

6. **Create final DMG:**
   ```bash
   hdiutil create -volname "Mydemy" -srcfolder Mydemy.app \
     -ov -format UDZO Mydemy_notarized.dmg
   ```

**Pros:** Seamless installation, no warnings, professional
**Cons:** Most complex process, requires paid account

### Mac App Store Distribution

To distribute via Mac App Store:
1. Update the bundle identifier in `tauri.conf.json`
2. Configure App Store code signing
3. Add required entitlements
4. Submit via App Store Connect
5. Follow Apple's App Store Review Guidelines

## Troubleshooting

### Build Fails

```bash
# Clean build artifacts
rm -rf src-tauri/target
rm -rf out .next

# Rebuild
npm run build
npm run tauri:build
```

### Dev Server Issues

```bash
# Kill any running Next.js processes
killall -9 node

# Restart
npm run tauri:dev
```

### Rust Compilation Errors

```bash
# Update Rust
rustup update

# Clean Cargo cache
cd src-tauri
cargo clean
```

## How It Works

### Static Export + CDN

The desktop app uses a **hybrid approach**:

1. **UI is bundled** - Next.js app is built as static HTML/CSS/JS
2. **Content from CDN** - Videos and course data load from your CDN
3. **Best of both worlds**:
   - Fast startup (local UI)
   - Instant content updates (remote CDN)
   - Works offline (previously loaded courses)

### Auto-Updates

The app checks for updates on startup:
- Downloads new version in background
- Prompts user to install
- Updates automatically without re-downloading content

## Further Reading

- [Tauri Documentation](https://tauri.app/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/)

## License

Same as the main Mydemy project.
