import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Custom hook for managing courses in Tauri desktop app
 * Implements a three-tier fallback strategy:
 * 1. Try remote endpoint (with caching)
 * 2. Try cached courses from app data directory
 * 3. Fall back to bundled courses.json
 */
export function useTauriCourses() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null); // 'idle', 'checking', 'downloading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState(null);
    const [isUsingFallback, setIsUsingFallback] = useState(false);

    // Get courses endpoint from environment
    const coursesEndpoint = process.env.NEXT_PUBLIC_COURSES_ENDPOINT;

    /**
     * Load courses with fallback strategy
     */
    const loadCourses = useCallback(async (showUpdatingStatus = false) => {
        try {
            setIsLoading(true);
            setIsError(false);
            setErrorMessage(null);

            if (showUpdatingStatus) {
                setUpdateStatus('checking');
            }

            // Try to get cached courses first (fast)
            try {
                const cachedCourses = await invoke('get_cached_courses');
                setCourses(cachedCourses);
                setIsUsingFallback(false);
                setIsLoading(false);
            } catch (cacheError) {
                console.log('No cached courses, will fetch fresh data');
            }

            // If we have a remote endpoint, try to fetch and update
            if (coursesEndpoint) {
                if (showUpdatingStatus) {
                    setUpdateStatus('downloading');
                }

                try {
                    const remoteCourses = await invoke('update_courses', {
                        endpoint: coursesEndpoint
                    });

                    setCourses(remoteCourses);
                    setIsUsingFallback(false);
                    setUpdateStatus('success');

                    // Auto-hide success status after 3 seconds
                    setTimeout(() => {
                        setUpdateStatus('idle');
                    }, 3000);
                } catch (remoteError) {
                    console.warn('Failed to fetch remote courses:', remoteError);

                    // If we already have cached courses, keep using them
                    if (courses.length > 0) {
                        setUpdateStatus('error');
                        setErrorMessage('Failed to check for updates. Using cached version.');
                        setTimeout(() => {
                            setUpdateStatus('idle');
                        }, 5000);
                    } else {
                        // No cached courses, try bundled fallback
                        const bundledCourses = await invoke('get_bundled_courses');
                        setCourses(bundledCourses);
                        setIsUsingFallback(true);
                        setUpdateStatus('error');
                        setErrorMessage('Using offline version. Check your connection.');
                    }
                }
            } else {
                // No remote endpoint configured, try cached or bundled
                if (courses.length === 0) {
                    const bundledCourses = await invoke('get_bundled_courses');
                    setCourses(bundledCourses);
                    setIsUsingFallback(true);
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load courses:', error);
            setIsError(true);
            setErrorMessage(error.toString());
            setIsLoading(false);
            setUpdateStatus('error');
        }
    }, [coursesEndpoint, courses.length]);

    /**
     * Manual refresh/update trigger
     */
    const checkForUpdates = useCallback(async () => {
        await loadCourses(true);
    }, [loadCourses]);

    /**
     * Load courses on mount
     */
    useEffect(() => {
        loadCourses(false);
    }, [loadCourses]);

    /**
     * Auto-refresh every 5 minutes (if app is running)
     */
    useEffect(() => {
        if (!coursesEndpoint) return;

        const interval = setInterval(() => {
            console.log('Auto-checking for course updates...');
            loadCourses(false);
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [coursesEndpoint, loadCourses]);

    return {
        courses,
        isLoading,
        isError,
        errorMessage,
        updateStatus,
        isUsingFallback,
        checkForUpdates, // Manual update trigger
        mutate: checkForUpdates, // Alias for compatibility with useCourses
    };
}
