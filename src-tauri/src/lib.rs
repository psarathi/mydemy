use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_updater::UpdaterExt;

                // Check for updates on startup
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    match handle.updater() {
                        Ok(updater) => {
                            if let Ok(Some(update)) = updater.check().await {
                                println!("Update available: {}", update.version);

                                // Download and install the update
                                if let Err(e) = update.download_and_install(|_, _| {}, || {}).await {
                                    eprintln!("Failed to update: {}", e);
                                }
                            }
                        }
                        Err(e) => eprintln!("Failed to get updater: {}", e),
                    }
                });
            }

            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
