import Image from 'next/image';
import Landing from '../components/layout/Landing';
import {BASE_PATH} from '../constants';
import styles from '../styles/Home.module.css';

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
