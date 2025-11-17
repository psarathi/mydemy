# App Icons

To generate icons for your Mydemy macOS app, you'll need to:

## 1. Create a Source Icon

Create a 1024x1024px PNG image with your app icon design. Save it as `app-icon.png` in this directory.

## 2. Generate Icons

Run the following command from the project root:

```bash
npx @tauri-apps/cli icon src-tauri/icons/app-icon.png
```

This will automatically generate all required icon sizes:
- 32x32.png
- 128x128.png
- 128x128@2x.png
- icon.icns (macOS)
- icon.ico (Windows)

## 3. Manual Generation (Alternative)

You can also use online tools like:
- https://icon.kitchen/
- https://appicon.co/

Just upload your 1024x1024px icon and download the generated files to this directory.

## Temporary Workaround

For now, the build will use Tauri's default icon. Replace it with your custom icon before distributing your app.
