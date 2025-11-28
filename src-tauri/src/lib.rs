use tauri::Manager;
use serde_json::{Value, json};
use std::path::PathBuf;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct OfflineVideo {
    course_name: String,
    video_path: String,
    local_path: String,
    download_date: String,
    file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct OfflineManifest {
    videos: HashMap<String, OfflineVideo>,
}

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

// Helper function to get offline manifest path
async fn get_offline_manifest_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    tokio::fs::create_dir_all(&app_data_dir)
        .await
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    Ok(app_data_dir.join("offline_manifest.json"))
}

// Helper function to load offline manifest
async fn load_offline_manifest(app_handle: &tauri::AppHandle) -> Result<OfflineManifest, String> {
    let manifest_path = get_offline_manifest_path(app_handle).await?;

    if !manifest_path.exists() {
        return Ok(OfflineManifest {
            videos: HashMap::new(),
        });
    }

    let manifest_str = tokio::fs::read_to_string(&manifest_path)
        .await
        .map_err(|e| format!("Failed to read offline manifest: {}", e))?;

    let manifest: OfflineManifest = serde_json::from_str(&manifest_str)
        .map_err(|e| format!("Failed to parse offline manifest: {}", e))?;

    Ok(manifest)
}

// Helper function to save offline manifest
async fn save_offline_manifest(app_handle: &tauri::AppHandle, manifest: &OfflineManifest) -> Result<(), String> {
    let manifest_path = get_offline_manifest_path(app_handle).await?;

    let manifest_str = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize offline manifest: {}", e))?;

    tokio::fs::write(&manifest_path, manifest_str)
        .await
        .map_err(|e| format!("Failed to write offline manifest: {}", e))?;

    Ok(())
}

// Tauri command to download a video for offline viewing
#[tauri::command]
async fn download_video_offline(
    app_handle: tauri::AppHandle,
    course_name: String,
    video_url: String,
    video_path: String,
) -> Result<Value, String> {
    println!("Downloading video for offline: {}", video_path);

    // Create offline videos directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let offline_dir = app_data_dir.join("offline_videos");
    tokio::fs::create_dir_all(&offline_dir)
        .await
        .map_err(|e| format!("Failed to create offline directory: {}", e))?;

    // Generate local filename (sanitize the path)
    let filename = video_path.replace("/", "_").replace("\\", "_");
    let local_path = offline_dir.join(&filename);

    // Download the video
    let client = reqwest::Client::new();
    let response = client
        .get(&video_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download video: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read video bytes: {}", e))?;

    let file_size = bytes.len() as u64;

    tokio::fs::write(&local_path, &bytes)
        .await
        .map_err(|e| format!("Failed to write video file: {}", e))?;

    // Update manifest
    let mut manifest = load_offline_manifest(&app_handle).await?;

    let offline_video = OfflineVideo {
        course_name: course_name.clone(),
        video_path: video_path.clone(),
        local_path: local_path.to_string_lossy().to_string(),
        download_date: chrono::Utc::now().to_rfc3339(),
        file_size,
    };

    manifest.videos.insert(video_path.clone(), offline_video.clone());
    save_offline_manifest(&app_handle, &manifest).await?;

    Ok(json!({
        "success": true,
        "video_path": video_path,
        "file_size": file_size,
        "local_path": local_path.to_string_lossy(),
    }))
}

// Tauri command to check if a video is available offline
#[tauri::command]
async fn is_video_offline(app_handle: tauri::AppHandle, video_path: String) -> Result<bool, String> {
    let manifest = load_offline_manifest(&app_handle).await?;

    if let Some(offline_video) = manifest.videos.get(&video_path) {
        let local_path = PathBuf::from(&offline_video.local_path);
        Ok(local_path.exists())
    } else {
        Ok(false)
    }
}

// Tauri command to get offline video path
#[tauri::command]
async fn get_offline_video_path(app_handle: tauri::AppHandle, video_path: String) -> Result<String, String> {
    let manifest = load_offline_manifest(&app_handle).await?;

    if let Some(offline_video) = manifest.videos.get(&video_path) {
        let local_path = PathBuf::from(&offline_video.local_path);
        if local_path.exists() {
            Ok(local_path.to_string_lossy().to_string())
        } else {
            Err("Video file not found".to_string())
        }
    } else {
        Err("Video not available offline".to_string())
    }
}

// Tauri command to get all offline videos
#[tauri::command]
async fn get_offline_videos(app_handle: tauri::AppHandle) -> Result<Value, String> {
    let manifest = load_offline_manifest(&app_handle).await?;

    let videos: Vec<OfflineVideo> = manifest
        .videos
        .values()
        .filter(|v| PathBuf::from(&v.local_path).exists())
        .cloned()
        .collect();

    Ok(json!(videos))
}

// Tauri command to delete an offline video
#[tauri::command]
async fn delete_offline_video(app_handle: tauri::AppHandle, video_path: String) -> Result<bool, String> {
    let mut manifest = load_offline_manifest(&app_handle).await?;

    if let Some(offline_video) = manifest.videos.remove(&video_path) {
        let local_path = PathBuf::from(&offline_video.local_path);
        if local_path.exists() {
            tokio::fs::remove_file(&local_path)
                .await
                .map_err(|e| format!("Failed to delete video file: {}", e))?;
        }

        save_offline_manifest(&app_handle, &manifest).await?;
        Ok(true)
    } else {
        Ok(false)
    }
}

// Tauri command to get offline storage info
#[tauri::command]
async fn get_offline_storage_info(app_handle: tauri::AppHandle) -> Result<Value, String> {
    let manifest = load_offline_manifest(&app_handle).await?;

    let mut total_size: u64 = 0;
    let mut video_count = 0;

    for video in manifest.videos.values() {
        let local_path = PathBuf::from(&video.local_path);
        if local_path.exists() {
            total_size += video.file_size;
            video_count += 1;
        }
    }

    Ok(json!({
        "total_videos": video_count,
        "total_size_bytes": total_size,
        "total_size_mb": total_size as f64 / 1024.0 / 1024.0,
        "total_size_gb": total_size as f64 / 1024.0 / 1024.0 / 1024.0,
    }))
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
            get_bundled_courses,
            download_video_offline,
            is_video_offline,
            get_offline_video_path,
            get_offline_videos,
            delete_offline_video,
            get_offline_storage_info
        ])
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
