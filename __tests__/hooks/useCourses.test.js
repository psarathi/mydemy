import { renderHook } from '@testing-library/react';
import { useCourses } from '../../hooks/useCourses';
import { useTauriCourses } from '../../hooks/useTauriCourses';
import useSWR from 'swr';

// Mock the hooks
jest.mock('../../hooks/useTauriCourses');
jest.mock('swr');

const originalWindow = global.window;

describe('useCourses', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset window object
        global.window = originalWindow;
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    describe('Tauri detection', () => {
        it('should use useTauriCourses when __TAURI__ is defined', () => {
            const mockTauriData = {
                courses: [{ name: 'Tauri Course', topics: [] }],
                isLoading: false,
                isError: false,
                errorMessage: null,
                updateStatus: 'idle',
                isUsingFallback: false,
                checkForUpdates: jest.fn(),
                mutate: jest.fn(),
            };

            useTauriCourses.mockReturnValue(mockTauriData);

            // Simulate Tauri environment
            global.window = { ...originalWindow, __TAURI__: {} };

            const { result } = renderHook(() => useCourses());

            expect(useTauriCourses).toHaveBeenCalled();
            expect(useSWR).not.toHaveBeenCalled();
            expect(result.current.courses).toEqual(mockTauriData.courses);
        });

        it('should use SWR when __TAURI__ is undefined', () => {
            const mockSWRData = {
                data: [{ name: 'Web Course', topics: [] }],
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            };

            useSWR.mockReturnValue(mockSWRData);

            // Simulate web environment
            global.window = { ...originalWindow };
            delete global.window.__TAURI__;

            const { result } = renderHook(() => useCourses());

            expect(useTauriCourses).not.toHaveBeenCalled();
            expect(useSWR).toHaveBeenCalled();
            expect(result.current.courses).toEqual(mockSWRData.data);
        });
    });

    describe('Web mode (SWR)', () => {
        beforeEach(() => {
            global.window = { ...originalWindow };
            delete global.window.__TAURI__;
        });

        it('should use remote endpoint when configured', () => {
            const mockCourses = [{ name: 'Course 1', topics: [] }];
            useSWR.mockReturnValue({
                data: mockCourses,
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            });

            process.env.NEXT_PUBLIC_COURSES_ENDPOINT = 'http://example.com/courses.json';

            renderHook(() => useCourses());

            expect(useSWR).toHaveBeenCalledWith(
                'http://example.com/courses.json',
                expect.any(Function),
                expect.objectContaining({
                    revalidateOnFocus: false,
                    dedupingInterval: 60000,
                    refreshInterval: 300000,
                })
            );
        });

        it('should fallback to /api/courses when no endpoint configured', () => {
            useSWR.mockReturnValue({
                data: [],
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            });

            delete process.env.NEXT_PUBLIC_COURSES_ENDPOINT;

            renderHook(() => useCourses());

            expect(useSWR).toHaveBeenCalledWith(
                '/api/courses',
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should return empty array when data is null', () => {
            useSWR.mockReturnValue({
                data: null,
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            });

            const { result } = renderHook(() => useCourses());

            expect(result.current.courses).toEqual([]);
        });

        it('should handle SWR errors', () => {
            const mockError = new Error('Network error');
            mockError.message = 'Failed to fetch';

            useSWR.mockReturnValue({
                data: null,
                error: mockError,
                isLoading: false,
                mutate: jest.fn(),
            });

            const { result } = renderHook(() => useCourses());

            expect(result.current.isError).toBe(mockError);
            expect(result.current.errorMessage).toBe('Failed to fetch');
        });

        it('should expose mutate as checkForUpdates', () => {
            const mockMutate = jest.fn();
            useSWR.mockReturnValue({
                data: [],
                error: null,
                isLoading: false,
                mutate: mockMutate,
            });

            const { result } = renderHook(() => useCourses());

            expect(result.current.checkForUpdates).toBe(mockMutate);
            expect(result.current.mutate).toBe(mockMutate);
        });

        it('should return default values for Tauri-specific fields', () => {
            useSWR.mockReturnValue({
                data: [{ name: 'Course 1', topics: [] }],
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            });

            const { result } = renderHook(() => useCourses());

            expect(result.current.updateStatus).toBe('idle');
            expect(result.current.isUsingFallback).toBe(false);
        });
    });

    describe('Return shape consistency', () => {
        it('should have consistent return shape in Tauri mode', () => {
            const mockTauriData = {
                courses: [],
                isLoading: false,
                isError: false,
                errorMessage: null,
                updateStatus: 'idle',
                isUsingFallback: false,
                checkForUpdates: jest.fn(),
                mutate: jest.fn(),
            };

            useTauriCourses.mockReturnValue(mockTauriData);
            global.window = { ...originalWindow, __TAURI__: {} };

            const { result } = renderHook(() => useCourses());

            expect(result.current).toHaveProperty('courses');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isError');
            expect(result.current).toHaveProperty('errorMessage');
            expect(result.current).toHaveProperty('updateStatus');
            expect(result.current).toHaveProperty('isUsingFallback');
            expect(result.current).toHaveProperty('checkForUpdates');
            expect(result.current).toHaveProperty('mutate');
        });

        it('should have consistent return shape in web mode', () => {
            useSWR.mockReturnValue({
                data: [],
                error: null,
                isLoading: false,
                mutate: jest.fn(),
            });

            global.window = { ...originalWindow };
            delete global.window.__TAURI__;

            const { result } = renderHook(() => useCourses());

            expect(result.current).toHaveProperty('courses');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('isError');
            expect(result.current).toHaveProperty('errorMessage');
            expect(result.current).toHaveProperty('updateStatus');
            expect(result.current).toHaveProperty('isUsingFallback');
            expect(result.current).toHaveProperty('checkForUpdates');
            expect(result.current).toHaveProperty('mutate');
        });
    });
});
