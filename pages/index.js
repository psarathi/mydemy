import Image from 'next/image';
import Landing from '../components/layout/Landing';
import styles from '../styles/Home.module.css';

const BASE_PATH = process.env.basePath;

export default function Home() {
    return (
        <div className={styles.container}>
            <Image
                src={`${BASE_PATH}/vercel.svg`}
                alt='me'
                width='64'
                height='64'
            />
            <Landing />
        </div>
    );
}
