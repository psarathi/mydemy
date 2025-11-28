import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOfflineVideos } from '../hooks/useOfflineVideos';

/**
 * Page for managing offline video downloads
 * Shows all downloaded videos and storage information
 */
export default function OfflinePage() {
    const {
        offlineVideos,
        storageInfo,
        isLoading,
        isError,
        errorMessage,
        deleteOfflineVideo,
        reload,
    } = useOfflineVideos();

    const [deletingVideos, setDeletingVideos] = useState(new Set());
    const [isTauriApp, setIsTauriApp] = useState(false);

    useEffect(() => {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && window.__TAURI__) {
            setIsTauriApp(true);
        }
    }, []);

    const handleDelete = async (videoPath) => {
        if (!confirm('Delete this offline video?')) {
            return;
        }

        setDeletingVideos(prev => new Set([...prev, videoPath]));

        try {
            await deleteOfflineVideo(videoPath);
        } catch (error) {
            console.error('Failed to delete video:', error);
            alert('Failed to delete video: ' + error);
        } finally {
            setDeletingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(videoPath);
                return newSet;
            });
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm(`Delete all ${offlineVideos.length} offline videos?`)) {
            return;
        }

        for (const video of offlineVideos) {
            try {
                await deleteOfflineVideo(video.video_path);
            } catch (error) {
                console.error('Failed to delete video:', error);
            }
        }

        await reload();
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Not a Tauri app
    if (!isTauriApp) {
        return (
            <div className="offline-page">
                <div className="offline-container">
                    <div className="not-available">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2>Offline Downloads Not Available</h2>
                        <p>Offline downloads are only available in the desktop app.</p>
                        <Link href="/" className="back-btn">
                            Back to Courses
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="offline-page">
            <div className="offline-container">
                <header className="offline-header">
                    <div className="header-top">
                        <Link href="/" className="back-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to Courses
                        </Link>
                    </div>
                    <h1>Offline Downloads</h1>
                    <p className="subtitle">Manage your downloaded courses for offline viewing</p>
                </header>

                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading offline videos...</p>
                    </div>
                ) : isError ? (
                    <div className="error-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2>Error Loading Offline Videos</h2>
                        <p>{errorMessage}</p>
                        <button onClick={reload} className="retry-btn">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="storage-info">
                            <div className="storage-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                </svg>
                                <div>
                                    <div className="stat-value">{storageInfo.total_videos}</div>
                                    <div className="stat-label">Videos</div>
                                </div>
                            </div>
                            <div className="storage-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                <div>
                                    <div className="stat-value">{storageInfo.total_size_gb.toFixed(2)} GB</div>
                                    <div className="stat-label">Total Size</div>
                                </div>
                            </div>
                            {offlineVideos.length > 0 && (
                                <button onClick={handleDeleteAll} className="delete-all-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete All
                                </button>
                            )}
                        </div>

                        {offlineVideos.length === 0 ? (
                            <div className="empty-state">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <h2>No Offline Videos</h2>
                                <p>You haven&apos;t downloaded any videos yet.</p>
                                <p className="hint">Go to a course and click the download icon next to any lesson.</p>
                            </div>
                        ) : (
                            <div className="videos-list">
                                {offlineVideos.map((video, index) => (
                                    <div key={index} className="video-item">
                                        <div className="video-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </div>
                                        <div className="video-info">
                                            <h3 className="video-course">{video.course_name}</h3>
                                            <p className="video-path">{video.video_path.split('/').pop()}</p>
                                            <div className="video-meta">
                                                <span className="meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    {formatDate(video.download_date)}
                                                </span>
                                                <span className="meta-item">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                    </svg>
                                                    {formatBytes(video.file_size)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(video.video_path)}
                                            disabled={deletingVideos.has(video.video_path)}
                                            className="delete-btn"
                                            aria-label="Delete video"
                                        >
                                            {deletingVideos.has(video.video_path) ? (
                                                <div className="mini-spinner"></div>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
                .offline-page {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    padding: 24px;
                }

                .offline-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .offline-header {
                    margin-bottom: 32px;
                }

                .header-top {
                    margin-bottom: 16px;
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    text-decoration: none;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    background: var(--bg-tertiary);
                    border-color: var(--primary-color);
                }

                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 8px 0;
                }

                .subtitle {
                    font-size: 16px;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .storage-info {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .storage-stat {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    flex: 1;
                    min-width: 200px;
                }

                .storage-stat svg {
                    color: var(--primary-color);
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-label {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .delete-all-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: var(--danger-color, #ef4444);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .delete-all-btn:hover {
                    background: var(--danger-hover, #dc2626);
                }

                .videos-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .video-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .video-item:hover {
                    border-color: var(--primary-color);
                    background: var(--bg-tertiary);
                }

                .video-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    color: white;
                    flex-shrink: 0;
                }

                .video-info {
                    flex: 1;
                }

                .video-course {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 4px 0;
                }

                .video-path {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 0 0 8px 0;
                }

                .video-meta {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: var(--text-tertiary);
                }

                .delete-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--danger-color, #ef4444);
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .delete-btn:hover:not(:disabled) {
                    background: var(--danger-color, #ef4444);
                    color: white;
                    border-color: var(--danger-color, #ef4444);
                }

                .delete-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .empty-state,
                .error-state,
                .loading-state,
                .not-available {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 64px 24px;
                    text-align: center;
                }

                .empty-state svg,
                .error-state svg,
                .not-available svg {
                    color: var(--text-tertiary);
                    margin-bottom: 24px;
                }

                .empty-state h2,
                .error-state h2,
                .not-available h2 {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 12px 0;
                }

                .empty-state p,
                .error-state p,
                .not-available p {
                    font-size: 16px;
                    color: var(--text-secondary);
                    margin: 0 0 8px 0;
                }

                .hint {
                    font-size: 14px;
                    color: var(--text-tertiary);
                }

                .retry-btn {
                    margin-top: 16px;
                    padding: 10px 24px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .retry-btn:hover {
                    opacity: 0.9;
                }

                .spinner,
                .mini-spinner {
                    border: 3px solid rgba(0, 0, 0, 0.1);
                    border-top: 3px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    margin-bottom: 16px;
                }

                .mini-spinner {
                    width: 18px;
                    height: 18px;
                    border-width: 2px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .offline-page {
                        padding: 16px;
                    }

                    h1 {
                        font-size: 24px;
                    }

                    .storage-info {
                        flex-direction: column;
                    }

                    .storage-stat {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
