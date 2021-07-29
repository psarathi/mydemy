import fs from 'fs';
import Image from 'next/image';
import path from 'path';
import Landing from '../components/layout/Landing';
import {BASE_PATH, COURSES_FOLDER} from '../constants';
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
    const currentDirectory = path.join(process.cwd(), COURSES_FOLDER);
    let result = {courses: []};

    // This recursive function just goes 2 level deep, courses -> course name -> course topics -> topic files
    function getCourses(dirPath) {
        for (const item of fs.readdirSync(dirPath)) {
            const fullPath = path.join(dirPath, item);
            if (fs.statSync(fullPath).isDirectory()) {
                // if we're under the main course folder create a new course object
                if (dirPath === currentDirectory) {
                    result.courses.push({name: item, topics: []});
                    getCourses(fullPath);
                } else {
                    //    if we're not under the main folder then we must be under a course folder
                    const topicDetails = path.parse(fullPath);
                    const courseName = topicDetails.dir.split('/').pop();
                    //    get the course object using the course name
                    const courseIndex = result.courses.findIndex(
                        (course) => course.name === courseName
                    );
                    result.courses[courseIndex].topics.push({
                        name: topicDetails.base,
                        files: [],
                    });
                    getCourses(fullPath);
                }
            } else {
                // ignore any files under the main course folder
                if (dirPath === currentDirectory) {
                    continue;
                }
                //    we're inside one of the topic folders
                const topicDetails = path.parse(fullPath);
                const pathSegments = topicDetails.dir.split('/');
                const topicName = pathSegments.pop();
                const courseName = pathSegments.pop();
                //    get the course object using the course name
                const courseIndex = result.courses.findIndex(
                    (course) => course.name === courseName
                );
                const topicIndex = result.courses[courseIndex].topics.findIndex(
                    (topic) => topic.name === topicName
                );
                //don't include anything other than the video and the subtitle files
                if (topicDetails.ext.match(/.srt|.mp4/g)) {
                    result.courses[courseIndex].topics[topicIndex].files.push(
                        `${courseName}/${topicName}/${topicDetails.base}`
                    );
                }
            }
        }
    }

    getCourses(currentDirectory);
    return {
        props: {
            filenames: result.courses.map((c) => c.name),
        },
        revalidate: 10,
    };
}
