import useSWR from 'swr';
import { useTauriCourses } from './useTauriCourses';

const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
};

/**
 * Hybrid courses hook that works for both web and desktop apps
 * - Desktop (Tauri): Uses native Tauri commands with local caching
 * - Web: Uses remote endpoint with SWR caching
 */
export function useCourses() {
    // Detect if running in Tauri desktop app
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

    // Desktop app: Use Tauri-specific hook
    if (isTauri) {
        return useTauriCourses();
    }

    // Web app: Use SWR with remote endpoint or API route
    const remoteEndpoint = process.env.NEXT_PUBLIC_COURSES_ENDPOINT;
    const endpoint = remoteEndpoint || '/api/courses';

    const { data, error, isLoading, mutate } = useSWR(
        endpoint,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Dedupe requests within 60 seconds
            // Revalidate every 5 minutes to check for updates
            refreshInterval: 300000,
            // Retry on error with exponential backoff
            shouldRetryOnError: true,
            errorRetryCount: 3,
        }
    );

    return {
        courses: data || [],
        isLoading,
        isError: error,
        errorMessage: error?.message,
        updateStatus: 'idle',
        isUsingFallback: false,
        mutate, // Expose mutate to manually trigger revalidation
        checkForUpdates: mutate, // Alias for consistency with Tauri hook
    };
}
