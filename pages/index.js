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
