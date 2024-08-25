import Head from 'next/head';
import {useEffect} from 'react';
import Landing from '../components/layout/Landing';
import styles from '../styles/Home.module.css';

const BASE_PATH = process.env.basePath;

export default function Home() {
    useEffect(() => {
        const eventSource = new EventSource('api/serverNotifier');
        eventSource.onmessage = (event) => {
            if (
                confirm(
                    'New courses have been uploaded, do you want to refresh the page?'
                )
            ) {
                window.location.href = '/';
            }
        };
        return () => {
            eventSource.close();
        };
    }, []);
    return (
        <div className={styles.container}>
            <Head>
                <title>Mydemy</title>
            </Head>
            <Landing />
        </div>
    );
}
