use tauri::Manager;
use serde_json::Value;
use std::path::PathBuf;

// Tauri command to fetch courses from remote endpoint
#[tauri::command]
async fn fetch_remote_courses(endpoint: String) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(&endpoint)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch courses: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let courses: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse courses JSON: {}", e))?;

    Ok(courses)
}

// Tauri command to get cached courses from app data directory
#[tauri::command]
async fn get_cached_courses(app_handle: tauri::AppHandle) -> Result<Value, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let courses_path = app_data_dir.join("courses.json");

    if !courses_path.exists() {
        return Err("No cached courses found".to_string());
    }

    let courses_str = tokio::fs::read_to_string(&courses_path)
        .await
        .map_err(|e| format!("Failed to read cached courses: {}", e))?;

    let courses: Value = serde_json::from_str(&courses_str)
        .map_err(|e| format!("Failed to parse cached courses: {}", e))?;

    Ok(courses)
}

// Tauri command to update and cache courses
#[tauri::command]
async fn update_courses(app_handle: tauri::AppHandle, endpoint: String) -> Result<Value, String> {
    // Fetch from remote
    let courses = fetch_remote_courses(endpoint).await?;

    // Save to app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Create directory if it doesn't exist
    tokio::fs::create_dir_all(&app_data_dir)
        .await
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    let courses_path = app_data_dir.join("courses.json");
    let courses_str = serde_json::to_string_pretty(&courses)
        .map_err(|e| format!("Failed to serialize courses: {}", e))?;

    tokio::fs::write(&courses_path, courses_str)
        .await
        .map_err(|e| format!("Failed to write courses to cache: {}", e))?;

    Ok(courses)
}

// Tauri command to get bundled courses (fallback)
#[tauri::command]
async fn get_bundled_courses(app_handle: tauri::AppHandle) -> Result<Value, String> {
    // Try multiple paths for different environments
    let mut tried_paths = Vec::new();

    // Path 1: Production bundle (_up_/out/courses.json in Resources)
    if let Ok(resource_path) = app_handle.path().resource_dir() {
        let courses_path = resource_path.join("_up_").join("out").join("courses.json");
        tried_paths.push(format!("{:?}", courses_path));

        if courses_path.exists() {
            println!("Found courses at: {:?}", courses_path);
            let courses_str = tokio::fs::read_to_string(&courses_path)
                .await
                .map_err(|e| format!("Failed to read bundled courses: {}", e))?;

            let courses: Value = serde_json::from_str(&courses_str)
                .map_err(|e| format!("Failed to parse bundled courses: {}", e))?;

            return Ok(courses);
        }
    }

    // Path 2: Development mode (courses.json in project root)
    if let Ok(app_dir) = app_handle.path().app_data_dir() {
        // Go up to project root from app data dir
        if let Some(project_root) = app_dir.parent().and_then(|p| p.parent()).and_then(|p| p.parent()) {
            let dev_path = project_root.join("courses.json");
            tried_paths.push(format!("{:?}", dev_path));

            if dev_path.exists() {
                println!("Found courses at: {:?}", dev_path);
                let courses_str = tokio::fs::read_to_string(&dev_path)
                    .await
                    .map_err(|e| format!("Failed to read dev courses: {}", e))?;

                let courses: Value = serde_json::from_str(&courses_str)
                    .map_err(|e| format!("Failed to parse dev courses: {}", e))?;

                return Ok(courses);
            }
        }
    }

    // Path 3: Try current directory (fallback for dev)
    let current_dir_path = PathBuf::from("courses.json");
    tried_paths.push(format!("{:?}", current_dir_path));

    if current_dir_path.exists() {
        println!("Found courses at: {:?}", current_dir_path);
        let courses_str = tokio::fs::read_to_string(&current_dir_path)
            .await
            .map_err(|e| format!("Failed to read current dir courses: {}", e))?;

        let courses: Value = serde_json::from_str(&courses_str)
            .map_err(|e| format!("Failed to parse current dir courses: {}", e))?;

        return Ok(courses);
    }

    Err(format!("Bundled courses not found. Tried paths: {:?}", tried_paths))
}

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
        .invoke_handler(tauri::generate_handler![
            fetch_remote_courses,
            get_cached_courses,
            update_courses,
            get_bundled_courses
        ])
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
