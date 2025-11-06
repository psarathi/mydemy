import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useCourses() {
    const {data, error, isLoading, mutate} = useSWR('/api/courses', fetcher, {
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
