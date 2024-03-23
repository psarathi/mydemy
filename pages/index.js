import Image from 'next/image';
import Landing from '../components/layout/Landing';
import styles from '../styles/Home.module.css';

const BASE_PATH = process.env.basePath;

export default function Home() {
    return (
        <div className={styles.container}>
            <Landing />
        </div>
    );
}
