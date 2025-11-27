import { renderHook, act, waitFor } from '@testing-library/react';
import { useTauriCourses } from '../../hooks/useTauriCourses';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/core', () => ({
    invoke: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('useTauriCourses', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        // Clear localStorage
        localStorage.clear();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Three-tier fallback strategy', () => {
        it('should load cached courses first', async () => {
            const mockCachedCourses = [
                { name: 'Cached Course 1', topics: [] },
                { name: 'Cached Course 2', topics: [] }
            ];

            invoke.mockResolvedValueOnce(mockCachedCourses);

            const { result } = renderHook(() => useTauriCourses());

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.courses).toEqual(mockCachedCourses);
            expect(result.current.isUsingFallback).toBe(false);
            expect(invoke).toHaveBeenCalledWith('get_cached_courses');
        });

        it('should fallback to bundled courses when cached courses fail', async () => {
            const mockBundledCourses = [
                { name: 'Bundled Course 1', topics: [] },
                { name: 'Bundled Course 2', topics: [] }
            ];

            // Cached courses fail
            invoke
                .mockRejectedValueOnce(new Error('No cached courses found'))
                .mockResolvedValueOnce(mockBundledCourses);

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.courses).toEqual(mockBundledCourses);
            expect(result.current.isUsingFallback).toBe(true);
            expect(invoke).toHaveBeenCalledWith('get_cached_courses');
            expect(invoke).toHaveBeenCalledWith('get_bundled_courses');
        });

        it('should handle both cached and bundled courses failing', async () => {
            invoke
                .mockRejectedValueOnce(new Error('No cached courses'))
                .mockRejectedValueOnce(new Error('No bundled courses'));

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.errorMessage).toContain('Failed to load bundled courses');
        });
    });

    describe('Remote endpoint updates', () => {
        it('should update courses from remote endpoint when configured', async () => {
            const mockCachedCourses = [{ name: 'Cached Course', topics: [] }];
            const mockRemoteCourses = [
                { name: 'Remote Course 1', topics: [] },
                { name: 'Remote Course 2', topics: [] }
            ];

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockResolvedValueOnce(mockRemoteCourses);

            const { result } = renderHook(() => useTauriCourses());

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.courses).toEqual(mockCachedCourses);
            });

            // Wait for remote update
            await waitFor(() => {
                expect(result.current.courses).toEqual(mockRemoteCourses);
            });

            expect(invoke).toHaveBeenCalledWith('update_courses', {
                endpoint: 'http://example.com/courses.json'
            });
            expect(result.current.isUsingFallback).toBe(false);
        });

        it('should keep cached courses if remote update fails', async () => {
            const mockCachedCourses = [{ name: 'Cached Course', topics: [] }];

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.courses).toEqual(mockCachedCourses);
            expect(result.current.updateStatus).toBe('idle');
        });
    });

    describe('Manual updates', () => {
        it('should allow manual course updates via checkForUpdates', async () => {
            const mockCachedCourses = [{ name: 'Cached Course', topics: [] }];
            const mockUpdatedCourses = [{ name: 'Updated Course', topics: [] }];

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockResolvedValueOnce(mockUpdatedCourses);

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.courses).toEqual(mockCachedCourses);
            });

            // Clear previous calls
            invoke.mockClear();
            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockResolvedValueOnce(mockUpdatedCourses);

            // Trigger manual update
            await act(async () => {
                await result.current.checkForUpdates();
            });

            await waitFor(() => {
                expect(result.current.updateStatus).toBe('success');
            });

            expect(result.current.courses).toEqual(mockUpdatedCourses);
        });
    });

    describe('Update status', () => {
        it('should set update status during manual updates', async () => {
            const mockCachedCourses = [{ name: 'Cached Course', topics: [] }];
            const mockRemoteCourses = [{ name: 'Remote Course', topics: [] }];

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            let resolveRemote;
            const remotePromise = new Promise(resolve => {
                resolveRemote = resolve;
            });

            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockImplementationOnce(() => remotePromise);

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.courses).toEqual(mockCachedCourses);
            });

            invoke.mockClear();
            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockResolvedValueOnce(mockRemoteCourses);

            // Trigger manual update
            act(() => {
                result.current.checkForUpdates();
            });

            await waitFor(() => {
                expect(result.current.updateStatus).toBe('checking');
            });
        });

        it('should reset update status to idle after 3 seconds on success', async () => {
            jest.useFakeTimers();

            const mockCachedCourses = [{ name: 'Cached Course', topics: [] }];
            const mockRemoteCourses = [{ name: 'Remote Course', topics: [] }];

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            invoke
                .mockResolvedValueOnce(mockCachedCourses)
                .mockResolvedValueOnce(mockRemoteCourses);

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.updateStatus).toBe('success');
            });

            act(() => {
                jest.advanceTimersByTime(3000);
            });

            await waitFor(() => {
                expect(result.current.updateStatus).toBe('idle');
            });

            jest.useRealTimers();
        });
    });

    describe('Loading states', () => {
        it('should start with loading true', () => {
            invoke.mockImplementation(() => new Promise(() => {})); // Never resolves

            const { result } = renderHook(() => useTauriCourses());

            expect(result.current.isLoading).toBe(true);
            expect(result.current.courses).toEqual([]);
        });

        it('should set loading false after courses load', async () => {
            const mockCourses = [{ name: 'Course 1', topics: [] }];
            invoke.mockResolvedValueOnce(mockCourses);

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });

    describe('Error handling', () => {
        it('should set error state when all sources fail', async () => {
            invoke
                .mockRejectedValueOnce(new Error('Cache failed'))
                .mockRejectedValueOnce(new Error('Bundled failed'));

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.errorMessage).toBeTruthy();
        });

        it('should clear error state on successful reload', async () => {
            const mockCourses = [{ name: 'Course 1', topics: [] }];

            // First load fails
            invoke
                .mockRejectedValueOnce(new Error('Cache failed'))
                .mockRejectedValueOnce(new Error('Bundled failed'));

            const { result } = renderHook(() => useTauriCourses());

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            // Second load succeeds
            invoke.mockClear();
            invoke.mockResolvedValueOnce(mockCourses);

            await act(async () => {
                await result.current.checkForUpdates();
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(false);
            });
        });
    });
});
