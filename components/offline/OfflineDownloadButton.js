import React, { useState, useEffect } from 'react';
import { useOfflineVideos } from '../../hooks/useOfflineVideos';
import { BASE_CDN_PATH } from '../../constants';

/**
 * Button component for downloading/deleting offline videos
 * Shows different states: not downloaded, downloading, downloaded
 */
export default function OfflineDownloadButton({ courseName, videoPath }) {
    const {
        isVideoOffline,
        downloadVideo,
        deleteOfflineVideo,
        downloadProgress,
    } = useOfflineVideos();

    const [isOffline, setIsOffline] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check offline status on mount
    useEffect(() => {
        const checkStatus = async () => {
            if (typeof window !== 'undefined' && window.__TAURI__) {
                try {
                    const status = await isVideoOffline(videoPath);
                    setIsOffline(status);
                } catch (error) {
                    console.error('Failed to check offline status:', error);
                } finally {
                    setIsChecking(false);
                }
            } else {
                setIsChecking(false);
            }
        };

        checkStatus();
    }, [videoPath, isVideoOffline]);

    // Handle download
    const handleDownload = async (e) => {
        e.stopPropagation();

        try {
            const videoUrl = `${BASE_CDN_PATH}/${videoPath}`;
            await downloadVideo(courseName, videoUrl, videoPath);
            setIsOffline(true);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download video: ' + error);
        }
    };

    // Handle delete
    const handleDelete = async (e) => {
        e.stopPropagation();

        if (!confirm('Delete this offline video?')) {
            return;
        }

        try {
            await deleteOfflineVideo(videoPath);
            setIsOffline(false);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete video: ' + error);
        }
    };

    // Don't show in web mode
    if (typeof window === 'undefined' || !window.__TAURI__) {
        return null;
    }

    // Get download progress for this video
    const progress = downloadProgress[videoPath];

    // Checking state
    if (isChecking) {
        return (
            <button
                className="offline-download-btn checking"
                disabled
                aria-label="Checking offline status"
                onClick={(e) => e.stopPropagation()}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" opacity="0.3"></circle>
                </svg>
            </button>
        );
    }

    // Downloading state
    if (progress && progress.status === 'downloading') {
        return (
            <button
                className="offline-download-btn downloading"
                disabled
                aria-label="Downloading..."
                onClick={(e) => e.stopPropagation()}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 12 16 16 12"></polyline>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                </svg>
            </button>
        );
    }

    // Downloaded state
    if (isOffline) {
        return (
            <button
                className="offline-download-btn downloaded"
                onClick={handleDelete}
                aria-label="Delete offline video"
                title="Delete offline video"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
        );
    }

    // Not downloaded state
    return (
        <button
            className="offline-download-btn not-downloaded"
            onClick={handleDownload}
            aria-label="Download for offline viewing"
            title="Download for offline viewing"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </button>
    );
}
