import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Custom hook for managing offline video downloads in Tauri desktop app
 * Provides functionality to:
 * - Download videos for offline viewing
 * - Check if a video is available offline
 * - Get local path for offline videos
 * - Delete offline videos
 * - Get storage information
 */
export function useOfflineVideos() {
    const [offlineVideos, setOfflineVideos] = useState([]);
    const [storageInfo, setStorageInfo] = useState({
        total_videos: 0,
        total_size_bytes: 0,
        total_size_mb: 0,
        total_size_gb: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState({}); // { videoPath: { status: 'downloading'|'success'|'error', progress: 0-100 } }

    /**
     * Load all offline videos
     */
    const loadOfflineVideos = useCallback(async () => {
        try {
            setIsLoading(true);
            setIsError(false);
            setErrorMessage(null);

            const videos = await invoke('get_offline_videos');
            setOfflineVideos(videos);

            // Also load storage info
            const info = await invoke('get_offline_storage_info');
            setStorageInfo(info);

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load offline videos:', error);
            setIsError(true);
            setErrorMessage(error.toString());
            setIsLoading(false);
        }
    }, []);

    /**
     * Check if a specific video is available offline
     */
    const isVideoOffline = useCallback(async (videoPath) => {
        try {
            const result = await invoke('is_video_offline', { videoPath });
            return result;
        } catch (error) {
            console.error('Failed to check offline status:', error);
            return false;
        }
    }, []);

    /**
     * Get local file path for an offline video
     */
    const getOfflineVideoPath = useCallback(async (videoPath) => {
        try {
            const localPath = await invoke('get_offline_video_path', { videoPath });
            return localPath;
        } catch (error) {
            console.error('Failed to get offline video path:', error);
            throw error;
        }
    }, []);

    /**
     * Download a video for offline viewing
     */
    const downloadVideo = useCallback(async (courseName, videoUrl, videoPath) => {
        try {
            // Set download progress
            setDownloadProgress(prev => ({
                ...prev,
                [videoPath]: { status: 'downloading', progress: 0 }
            }));

            const result = await invoke('download_video_offline', {
                courseName,
                videoUrl,
                videoPath,
            });

            // Update download progress
            setDownloadProgress(prev => ({
                ...prev,
                [videoPath]: { status: 'success', progress: 100 }
            }));

            // Reload offline videos and storage info
            await loadOfflineVideos();

            // Clear download progress after 3 seconds
            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[videoPath];
                    return newProgress;
                });
            }, 3000);

            return result;
        } catch (error) {
            console.error('Failed to download video:', error);

            // Update download progress
            setDownloadProgress(prev => ({
                ...prev,
                [videoPath]: { status: 'error', progress: 0 }
            }));

            // Clear download progress after 5 seconds
            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[videoPath];
                    return newProgress;
                });
            }, 5000);

            throw error;
        }
    }, [loadOfflineVideos]);

    /**
     * Delete an offline video
     */
    const deleteOfflineVideo = useCallback(async (videoPath) => {
        try {
            const result = await invoke('delete_offline_video', { videoPath });

            if (result) {
                // Reload offline videos and storage info
                await loadOfflineVideos();
            }

            return result;
        } catch (error) {
            console.error('Failed to delete offline video:', error);
            throw error;
        }
    }, [loadOfflineVideos]);

    /**
     * Refresh storage information
     */
    const refreshStorageInfo = useCallback(async () => {
        try {
            const info = await invoke('get_offline_storage_info');
            setStorageInfo(info);
            return info;
        } catch (error) {
            console.error('Failed to refresh storage info:', error);
            throw error;
        }
    }, []);

    /**
     * Load offline videos on mount
     */
    useEffect(() => {
        // Only run in Tauri environment
        if (typeof window !== 'undefined' && window.__TAURI__) {
            loadOfflineVideos();
        }
    }, [loadOfflineVideos]);

    return {
        offlineVideos,
        storageInfo,
        isLoading,
        isError,
        errorMessage,
        downloadProgress,
        isVideoOffline,
        getOfflineVideoPath,
        downloadVideo,
        deleteOfflineVideo,
        refreshStorageInfo,
        reload: loadOfflineVideos, // Alias for reloading the list
    };
}
