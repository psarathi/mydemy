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
                        top: '20px',
                        right: '20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        animation: 'slideIn 0.3s ease-out',
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
