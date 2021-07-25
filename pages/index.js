import {promises as fs} from 'fs';
import Image from 'next/image';
import path from 'path';
import Landing from '../components/layout/Landing';
import {BASE_PATH} from '../constants';
import styles from '../styles/Home.module.css';

export default function Home({filenames}) {
    return (
        <div className={styles.container}>
            <Image
                src={`${BASE_PATH}/vercel.svg`}
                alt='me'
                width='64'
                height='64'
            />
            <video controls width="750px" height="375px" autoPlay>
                <source src={`${BASE_PATH}/sample.mp4`} />
                <track src={`${BASE_PATH}/sample.vtt`} label="English subtitles" kind="captions" srcLang="en-us" default />
            </video>
            <Landing files={filenames} />
        </div>
    );
}

export async function getStaticProps() {
    const currentDirectory = path.join(process.cwd(), 'public');
    const filenames = await fs.readdir(currentDirectory);
    filenames.map((filename) => {
        const filePath = path.join(currentDirectory, filename);

        return {
            filePath,
        };
    });
    return {
        props: {
            filenames,
        },
        revalidate: 10,
    };
}
