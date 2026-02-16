import Head from 'next/head';
import {useRouter} from 'next/router';
import {useEffect, useRef, useState} from 'react';
import Landing from '../components/layout/Landing';
import styles from '../styles/Home.module.css';

const BASE_PATH = process.env.basePath;

export default function Home() {
    const router = useRouter();
    const [notification, setNotification] = useState(null);
    const refreshCoursesRef = useRef(null);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        console.log('[SSE] Connecting to server notifications...');
        const eventSource = new EventSource('api/serverNotifier');

        eventSource.onopen = () => {
            console.log('[SSE] Connection established');
        };

        eventSource.onmessage = (event) => {
            console.log('[SSE] Message received:', event.data);

            // Show notification
            setNotification('New courses have been added!');

            // Auto-refresh courses by calling the function directly
            if (refreshCoursesRef.current) {
                console.log('[SSE] Refreshing courses...');
                refreshCoursesRef.current();
            } else {
                console.log('[SSE] refreshCoursesRef.current is null!');
            }

            // Hide notification after 3 seconds
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] Connection error:', error);
        };

        return () => {
            console.log('[SSE] Closing connection');
            eventSource.close();
        };
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>Mydemy</title>
            </Head>
            {notification && (
                <div
                    style={{
                        position: 'fixed',
                        top: '16px',
                        right: '16px',
                        backgroundColor: 'var(--success)',
                        color: '#fff',
                        padding: '12px 20px',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 1000,
                        fontSize: '14px',
                        fontWeight: 500,
                        animation: 'fadeIn 0.2s ease',
                    }}
                >
                    {notification}
                </div>
            )}
            <Landing
                search_term={router.query?.q}
                exact={router.query?.exact}
                refreshCoursesRef={refreshCoursesRef}
            />
        </div>
    );
}
