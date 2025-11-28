import { renderHook, act } from '@testing-library/react';
import { useOfflineVideos } from '../../hooks/useOfflineVideos';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/core', () => ({
    invoke: jest.fn(),
}));

const originalWindow = global.window;

describe('useOfflineVideos', () => {
    const mockVideos = [
        {
            course_name: 'Course 1',
            video_path: 'course1/lesson1.mp4',
            local_path: '/path/to/course1_lesson1.mp4',
            download_date: '2024-01-01T00:00:00Z',
            file_size: 1000000,
        },
    ];

    const mockStorageInfo = {
        total_videos: 1,
        total_size_bytes: 1000000,
        total_size_mb: 0.95,
        total_size_gb: 0.001,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.window = { ...originalWindow, __TAURI__: {} };

        // Default mock implementation
        invoke.mockImplementation((cmd) => {
            if (cmd === 'get_offline_videos') return Promise.resolve(mockVideos);
            if (cmd === 'get_offline_storage_info') return Promise.resolve(mockStorageInfo);
            return Promise.reject(new Error(`Unknown command: ${cmd}`));
        });
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    describe('Environment detection', () => {
        it('should not call Tauri commands in non-Tauri environment', () => {
            global.window = { ...originalWindow };
            delete global.window.__TAURI__;

            renderHook(() => useOfflineVideos());

            // Should not call any Tauri commands
            expect(invoke).not.toHaveBeenCalled();
        });
    });

    describe('isVideoOffline', () => {
        it('should check if a video is available offline', async () => {
            invoke.mockResolvedValue(true);

            const { result } = renderHook(() => useOfflineVideos());

            const isOffline = await result.current.isVideoOffline('course1/lesson1.mp4');

            expect(invoke).toHaveBeenCalledWith('is_video_offline', {
                videoPath: 'course1/lesson1.mp4',
            });
            expect(isOffline).toBe(true);
        });

        it('should return false on error', async () => {
            invoke.mockRejectedValue(new Error('Not found'));

            const { result } = renderHook(() => useOfflineVideos());

            const isOffline = await result.current.isVideoOffline('course1/lesson1.mp4');

            expect(isOffline).toBe(false);
        });
    });

    describe('getOfflineVideoPath', () => {
        it('should get local path for offline video', async () => {
            const mockPath = '/path/to/course1_lesson1.mp4';
            invoke.mockResolvedValue(mockPath);

            const { result } = renderHook(() => useOfflineVideos());

            const path = await result.current.getOfflineVideoPath('course1/lesson1.mp4');

            expect(invoke).toHaveBeenCalledWith('get_offline_video_path', {
                videoPath: 'course1/lesson1.mp4',
            });
            expect(path).toBe(mockPath);
        });

        it('should throw error if video not found', async () => {
            invoke.mockRejectedValue(new Error('Video not available offline'));

            const { result } = renderHook(() => useOfflineVideos());

            await expect(
                result.current.getOfflineVideoPath('course1/lesson1.mp4')
            ).rejects.toThrow('Video not available offline');
        });
    });

    describe('downloadVideo', () => {
        it('should download a video successfully', async () => {
            const mockResult = {
                success: true,
                video_path: 'course1/lesson1.mp4',
                file_size: 1000000,
                local_path: '/path/to/course1_lesson1.mp4',
            };

            invoke.mockImplementation((cmd) => {
                if (cmd === 'download_video_offline') return Promise.resolve(mockResult);
                if (cmd === 'get_offline_videos') return Promise.resolve([]);
                if (cmd === 'get_offline_storage_info') return Promise.resolve(mockStorageInfo);
                return Promise.reject(new Error(`Unknown command: ${cmd}`));
            });

            const { result } = renderHook(() => useOfflineVideos());

            let downloadResult;
            await act(async () => {
                downloadResult = await result.current.downloadVideo(
                    'Course 1',
                    'http://cdn.example.com/course1/lesson1.mp4',
                    'course1/lesson1.mp4'
                );
            });

            expect(invoke).toHaveBeenCalledWith('download_video_offline', {
                courseName: 'Course 1',
                videoUrl: 'http://cdn.example.com/course1/lesson1.mp4',
                videoPath: 'course1/lesson1.mp4',
            });
            expect(downloadResult).toEqual(mockResult);
        });

        it('should handle download errors', async () => {
            invoke.mockImplementation((cmd) => {
                if (cmd === 'download_video_offline') return Promise.reject(new Error('Download failed'));
                if (cmd === 'get_offline_videos') return Promise.resolve([]);
                if (cmd === 'get_offline_storage_info') return Promise.resolve(mockStorageInfo);
                return Promise.reject(new Error(`Unknown command: ${cmd}`));
            });

            const { result } = renderHook(() => useOfflineVideos());

            await act(async () => {
                await expect(
                    result.current.downloadVideo(
                        'Course 1',
                        'http://cdn.example.com/course1/lesson1.mp4',
                        'course1/lesson1.mp4'
                    )
                ).rejects.toThrow('Download failed');
            });

            // Check download progress shows error
            expect(result.current.downloadProgress['course1/lesson1.mp4']).toEqual({
                status: 'error',
                progress: 0,
            });
        });
    });

    describe('deleteOfflineVideo', () => {
        it('should delete a video successfully', async () => {
            invoke.mockImplementation((cmd) => {
                if (cmd === 'delete_offline_video') return Promise.resolve(true);
                if (cmd === 'get_offline_videos') return Promise.resolve([]);
                if (cmd === 'get_offline_storage_info') return Promise.resolve(mockStorageInfo);
                return Promise.reject(new Error(`Unknown command: ${cmd}`));
            });

            const { result } = renderHook(() => useOfflineVideos());

            let deleteResult;
            await act(async () => {
                deleteResult = await result.current.deleteOfflineVideo('course1/lesson1.mp4');
            });

            expect(invoke).toHaveBeenCalledWith('delete_offline_video', {
                videoPath: 'course1/lesson1.mp4',
            });
            expect(deleteResult).toBe(true);
        });

        it('should handle delete errors', async () => {
            invoke.mockImplementation((cmd) => {
                if (cmd === 'delete_offline_video') return Promise.reject(new Error('Delete failed'));
                if (cmd === 'get_offline_videos') return Promise.resolve([]);
                if (cmd === 'get_offline_storage_info') return Promise.resolve(mockStorageInfo);
                return Promise.reject(new Error(`Unknown command: ${cmd}`));
            });

            const { result } = renderHook(() => useOfflineVideos());

            await act(async () => {
                await expect(
                    result.current.deleteOfflineVideo('course1/lesson1.mp4')
                ).rejects.toThrow('Delete failed');
            });
        });
    });

    describe('refreshStorageInfo', () => {
        it('should refresh storage information', async () => {
            const newStorageInfo = {
                total_videos: 5,
                total_size_bytes: 5000000,
                total_size_mb: 4.77,
                total_size_gb: 0.005,
            };

            invoke.mockImplementation((cmd) => {
                if (cmd === 'get_offline_storage_info') return Promise.resolve(newStorageInfo);
                if (cmd === 'get_offline_videos') return Promise.resolve([]);
                return Promise.reject(new Error(`Unknown command: ${cmd}`));
            });

            const { result } = renderHook(() => useOfflineVideos());

            let info;
            await act(async () => {
                info = await result.current.refreshStorageInfo();
            });

            expect(invoke).toHaveBeenCalledWith('get_offline_storage_info');
            expect(info).toEqual(newStorageInfo);
        });
    });

    describe('Return shape', () => {
        it('should have correct return shape', () => {
            const { result } = renderHook(() => useOfflineVideos());

            expect(result.current).toHaveProperty('offlineVideos');
            expect(result.current).toHaveProperty('storageInfo');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isError');
            expect(result.current).toHaveProperty('errorMessage');
            expect(result.current).toHaveProperty('downloadProgress');
            expect(result.current).toHaveProperty('isVideoOffline');
            expect(result.current).toHaveProperty('getOfflineVideoPath');
            expect(result.current).toHaveProperty('downloadVideo');
            expect(result.current).toHaveProperty('deleteOfflineVideo');
            expect(result.current).toHaveProperty('refreshStorageInfo');
            expect(result.current).toHaveProperty('reload');
        });
    });
});
