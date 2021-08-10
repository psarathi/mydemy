import React, {useEffect, useState} from 'react';
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
    const [currentVideoFileIndex, setCurrentVideoFileIndex] = useState(0);
    const [videoFile, setVideoFile] = useState(videoFileList[0]);
    const [subtitlesFile, setSubtitlesFile] = useState(
        videoFileList[0] ? videoFileList[0].replace('mp4', 'vtt') : ''
    );
    const getVideoFileNameAtGivenIndex = (index = 0) => {
        if (!videoFileList || !videoFileList.length) {
            return '';
        }
        if (index > videoFileList.length - 1) {
            index = 0;
        }
        const filePathParts = videoFileList[index].split('/');
        return filePathParts.length
            ? filePathParts[filePathParts.length - 1]
            : '';
    };
    const [currentVideo, setCurrentVideo] = useState(
        getVideoFileNameAtGivenIndex(0)
    );
    const getNextVideo = () => {
        setCurrentVideoFileIndex(
            (currentVideoFileIndex) => currentVideoFileIndex + 1
        );
        if (currentVideoFileIndex >= videoFileList.length) {
            setCurrentVideoFileIndex(0);
        }
        let index =
            currentVideoFileIndex + 1 >= videoFileList.length
                ? 0
                : currentVideoFileIndex + 1;
        return {
            name: videoFileList[index],
            subtitles: videoFileList[index].replace('mp4', 'vtt'),
        };
    };

    const playSelectedVideo = (fileName) => {
        const index = videoFileList.indexOf(fileName);
        setVideoFile(videoFileList[index]);
        setSubtitlesFile(videoFileList[index].replace('mp4', 'vtt'));
        setCurrentVideoFileIndex(index);
    };

    useEffect(() => {
        setCurrentVideo(getVideoFileNameAtGivenIndex(currentVideoFileIndex));
    }, [currentVideoFileIndex]);

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
                                        <li
                                            key={i}
                                            className={`videoFile ${
                                                file.fileName === currentVideo
                                                    ? 'playing'
                                                    : ''
                                            }`}
                                            onClick={(e) =>
                                                playSelectedVideo(
                                                    `${COURSE_PATH}/${course.name}/${topic.name}/${file.fileName}`
                                                )
                                            }
                                        >
                                            {file.name}
                                        </li>
                                    ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
            <div className='videoPlayer'>
                <VideoPlayer
                    videoFile={videoFile}
                    subtitlesFile={subtitlesFile}
                    getNextVideo={getNextVideo}
                />
            </div>
        </div>
    ) : (
        <div>{`${courseName} is not a valid course name`}</div>
    );
}

export default CourseName;

export async function getStaticProps({params: {courseName}}) {
    return {
        props: {
            courseName,
        },
        revalidate: 3600 * 24,
    };
}

export async function getStaticPaths() {
    return {
        paths: courses.map((c) => ({
            params: {
                courseName: c.name,
            },
        })),
        fallback: true,
    };
}
