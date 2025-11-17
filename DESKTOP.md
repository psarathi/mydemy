# Mydemy Desktop App

This repository includes a native macOS desktop application built with [Tauri](https://tauri.app/), wrapping the Next.js web application.

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

### Build the Desktop App

```bash
npm run tauri:build
```

This will:
1. Build the Next.js app as a static export
2. Compile the Rust backend
3. Create a macOS `.app` bundle and `.dmg` installer

The built app will be in `src-tauri/target/release/bundle/`

### Build for Specific macOS Architecture

```bash
# Apple Silicon (M1/M2/M3)
npm run tauri:build:mac

# Intel
npm run tauri:build -- --target x86_64-apple-darwin

# Universal Binary (both architectures)
npm run tauri:build -- --target universal-apple-darwin
```

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

### Manual Distribution

After building, share the `.dmg` file from:
```
src-tauri/target/release/bundle/dmg/Mydemy_1.0.0_aarch64.dmg
```

### Mac App Store

To distribute via Mac App Store:
1. Update the bundle identifier in `tauri.conf.json`
2. Configure code signing
3. Follow Apple's submission guidelines

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
