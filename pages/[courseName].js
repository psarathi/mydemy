import Link from 'next/link';
import React from 'react';
import VideoPlayer from '../components/player/VideoPlayer';
import {COURSE_PATH} from '../constants';
import courses from '../courses.json';

function CourseName({courseName}) {
    const course = courses.find((c) => c.name === courseName);
    const videoFileList = course
        ? course.topics.flatMap((t) => {
              return t.files
                  .filter((f) => f.ext === '.mp4')
                  .map(
                      (f) =>
                          `${COURSE_PATH}/${course.name}/${t.name}/${f.fileName}`
                  );
          })
        : [];
    let currentVideoFileIndex = 0;
    const getNextVideo = () => {
        currentVideoFileIndex += 1;
        return {
            name: videoFileList[currentVideoFileIndex],
            subtitles: videoFileList[currentVideoFileIndex].replace(
                'mp4',
                'vtt'
            ),
        };
    };
    return course ? (
        <div className='courseWrapper'>
            <div className='courseListings'>
                <div className='courseName'>{courseName}</div>
                <ul>
                    {course.topics.map((topic, i) => (
                        <li key={i} className='topicName'>
                            <strong>{topic.name}</strong>
                            <ul>
                                {topic.files
                                    .filter((f) => f.ext === '.mp4')
                                    .map((file, i) => (
                                        <li key={i} className='videoFile'>
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
            <div className='videoPlayer'>
                <VideoPlayer
                    videoFile={videoFileList[currentVideoFileIndex]}
                    subtitlesFile={videoFileList[currentVideoFileIndex].replace(
                        'mp4',
                        'vtt'
                    )}
                    getNextVideo={getNextVideo}
                />
            </div>
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
