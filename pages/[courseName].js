import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import React, {useEffect, useState} from 'react';
import VideoPlayer from '../components/player/VideoPlayer';
import {BASE_CDN_PATH, LOCAL_CDN} from '../constants';
import courses from '../courses.json';

function CourseName({courseName}) {
    const queryParams = useSearchParams();
    const topic = queryParams.get('topic');
    const lesson = queryParams.get('lesson');
    const course = courses.find((c) => c.name === courseName);
    const videoFileList = course
        ? course.topics.flatMap((t) => {
              return t.files
                  .filter((f) => f.ext === '.mp4')
                  .map((f) => getFileName(course, t, f));
          })
        : [];
    const getVideoFileIndex = (topic, lesson) => {
        let lessonFileName;
        let fileIndex;
        if (topic && lesson) {
            lessonFileName = course.topics
                .find((t) => t.name === topic)
                ?.files.find((f) => f.name === lesson)?.name;
            fileIndex = videoFileList.findIndex((vf) =>
                vf.includes(lessonFileName)
            );
        } else if (topic) {
            lessonFileName = course.topics.find((t) => t.name === topic)
                ?.files[0].name;
            fileIndex = videoFileList.findIndex((vf) =>
                vf.includes(lessonFileName)
            );
        }
        return !fileIndex || fileIndex < 0 || fileIndex >= videoFileList.length
            ? 0
            : fileIndex;
    };
    const [currentVideoFileIndex, setCurrentVideoFileIndex] = useState(
        getVideoFileIndex(topic, lesson)
    );
    const [videoFile, setVideoFile] = useState(
        videoFileList[currentVideoFileIndex]
    );
    const [subtitlesFile, setSubtitlesFile] = useState(
        videoFileList[0] ? videoFileList[0].replace('mp4', 'vtt') : ''
    );
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const getVideoFileNameAtGivenIndex = (index = 0) => {
        if (!videoFileList || !videoFileList.length) {
            return '';
        }
        if (index > videoFileList.length - 1 || index < 0) {
            index = 0;
        }
        const filePathParts = videoFileList[index].split('/');
        return filePathParts.length
            ? filePathParts[filePathParts.length - 1]
            : '';
    };
    const [currentVideo, setCurrentVideo] = useState(
        getVideoFileNameAtGivenIndex(currentVideoFileIndex)
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

    const collapseSideBar = () => {
        setIsSidebarCollapsed(true);
    };

    const openSidebar = () => {
        setIsSidebarCollapsed(false);
    };

    function copyVideoURL(e, filePath) {
        navigator.clipboard.writeText(`${BASE_CDN_PATH}/${filePath}`);
        e.stopPropagation();
    }

    function getFileName(c, t, f) {
        return !t.isTopicLess
            ? `${LOCAL_CDN}/${c.name}/${t.name}/${f.fileName}`
            : `${LOCAL_CDN}/${c.name}/${f.fileName}`;
    }

    return course ? (
        <div className='courseContainer'>
            <div
                className={
                    isSidebarCollapsed
                        ? 'courseWrapper collapsedSidebar'
                        : 'courseWrapper'
                }
            >
                {isSidebarCollapsed && (
                    <div className='openSidebar' onClick={openSidebar}>
                        &#8594;
                    </div>
                )}
                <div
                    className={
                        isSidebarCollapsed
                            ? 'courseListings hideContents'
                            : 'courseListings'
                    }
                >
                    <div className='courseName'>
                        <div className='navMenu'>
                            <div className='backButton'>
                                <Link href='/'>
                                    {/*<a>&#8592; All Courses</a>*/}
                                    All Courses
                                </Link>
                            </div>
                            <div
                                className='closeSidebar'
                                onClick={collapseSideBar}
                            >
                                &#10539;
                            </div>
                        </div>
                        <div className='courseTitle'>{courseName}</div>
                    </div>
                    <ul>
                        {course.topics.map((topic, i) => (
                            <>
                                <div key={i} className='topicName'>
                                    <strong>{topic.name}</strong>
                                </div>
                                <ul>
                                    {topic.files
                                        .filter((f) => f.ext === '.mp4')
                                        .map((file, i) => (
                                            <li
                                                key={i}
                                                className={`videoFile ${
                                                    i === 0 ? 'firstItem' : ''
                                                } ${
                                                    file.fileName ===
                                                    currentVideo
                                                        ? 'playing'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    playSelectedVideo(
                                                        getFileName(
                                                            course,
                                                            topic,
                                                            file
                                                        )
                                                    )
                                                }
                                            >
                                                <div className='topicListItemContainer'>
                                                    <div className='listItemFileName'>
                                                        {file.name}
                                                    </div>
                                                    <div
                                                        className='copyVidURL'
                                                        onClick={(event) =>
                                                            copyVideoURL(
                                                                event,
                                                                getFileName(
                                                                    course,
                                                                    topic,
                                                                    file
                                                                )
                                                            )
                                                        }
                                                    >
                                                        &#10064;
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </>
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
