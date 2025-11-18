import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useCourses() {
    // For static export (desktop app), use static JSON file
    // For dev/production web, use API route
    // Tauri uses 'tauri:' protocol, static exports might use 'file:'
    const isStaticExport = typeof window !== 'undefined' &&
        (window.location.protocol === 'file:' || window.location.protocol === 'tauri:');
    const endpoint = isStaticExport ? '/courses.json' : '/api/courses';

    const {data, error, isLoading, mutate} = useSWR(endpoint, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // Dedupe requests within 60 seconds
    });

    return {
        courses: data || [],
        isLoading,
        isError: error,
        mutate, // Expose mutate to manually trigger revalidation
    };
}
