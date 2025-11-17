use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_updater::UpdaterExt;

                // Check for updates on startup (only if endpoints are configured)
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    match handle.updater() {
                        Ok(updater) => {
                            match updater.check().await {
                                Ok(Some(update)) => {
                                    println!("Update available: {}", update.version);

                                    // Download and install the update
                                    if let Err(e) = update.download_and_install(|_, _| {}, || {}).await {
                                        eprintln!("Failed to update: {}", e);
                                    }
                                }
                                Ok(None) => {
                                    println!("App is up to date");
                                }
                                Err(e) => {
                                    // Don't error out if updater isn't configured
                                    println!("Update check skipped: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            // Only log a warning if updater endpoints aren't set up yet
                            println!("Auto-updater not configured: {}", e);
                            println!("To enable updates, configure endpoints in tauri.conf.json");
                        }
                    }
                });
            }

            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
