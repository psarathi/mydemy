import Link from 'next/link';
import React from 'react';
import {COURSE_PATH} from '../constants';
import courses from '../courses.json';

function CourseName({courseName}) {
    const course = courses.find((c) => c.name === courseName);
    return course ? (
        <div>
            <h3>{courseName}</h3>
            <ul>
                {course.topics.map((topic, i) => (
                    <li key={i}>
                        <strong>{topic.name}</strong>
                        <ul>
                            {topic.files
                                .filter((f) => f.ext === '.mp4')
                                .map((file, i) => (
                                    <li key={i}>
                                        <Link
                                            href={`/${COURSE_PATH}/${course.name}/${topic.name}/${file.fileName}`}
                                        >
                                            <a>{file.name}</a>
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    ) : (
        <div>{`${courseName} is not a valid course name`}</div>
    );
}

export default CourseName;

export async function getStaticProps({params}) {
    return {
        props: {
            courseName: params.courseName,
        },
        revalidate: 3600 * 24,
    };
}

export async function getStaticPaths() {
    return {
        paths: courses.map((c) => {
            return {
                params: {
                    courseName: c.name,
                },
            };
        }),
        fallback: true,
    };
}
