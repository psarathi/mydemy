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

            let loadedCourses = null;

            // Step 1: Try to get cached courses first (fast)
            try {
                console.log('Trying to load cached courses...');
                const cachedCourses = await invoke('get_cached_courses');
                console.log('Cached courses loaded:', cachedCourses.length);
                loadedCourses = cachedCourses;
                setIsUsingFallback(false);
            } catch (cacheError) {
                console.log('No cached courses available:', cacheError);
            }

            // Step 2: Try bundled courses as fallback if no cached courses
            if (!loadedCourses || loadedCourses.length === 0) {
                try {
                    console.log('Trying to load bundled courses...');
                    const bundledCourses = await invoke('get_bundled_courses');
                    console.log('Bundled courses loaded:', bundledCourses.length);
                    loadedCourses = bundledCourses;
                    setIsUsingFallback(true);
                } catch (bundledError) {
                    console.error('Failed to load bundled courses:', bundledError);
                    throw new Error('Failed to load bundled courses: ' + bundledError);
                }
            }

            // Set courses immediately with what we have
            if (loadedCourses && loadedCourses.length > 0) {
                setCourses(loadedCourses);
                setIsLoading(false);
            }

            // Step 3: If we have a remote endpoint, try to fetch and update in background
            if (coursesEndpoint) {
                if (showUpdatingStatus) {
                    setUpdateStatus('downloading');
                }

                try {
                    console.log('Fetching remote courses from:', coursesEndpoint);
                    const remoteCourses = await invoke('update_courses', {
                        endpoint: coursesEndpoint
                    });
                    console.log('Remote courses loaded:', remoteCourses.length);

                    setCourses(remoteCourses);
                    setIsUsingFallback(false);
                    setUpdateStatus('success');

                    setTimeout(() => {
                        setUpdateStatus('idle');
                    }, 3000);
                } catch (remoteError) {
                    console.warn('Failed to fetch remote courses:', remoteError);
                    // Keep using the courses we already loaded
                    setUpdateStatus('idle');
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
    }, [coursesEndpoint]);

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
