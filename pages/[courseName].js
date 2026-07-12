import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import React, {useEffect, useState, useRef} from 'react';
import VideoPlayer from '../components/player/VideoPlayer';
import {LOCAL_CDN, SUPPORTED_VIDEO_EXTENSIONS, getCdnBase} from '../constants';
import {
    addToHistory,
    deleteLessonAnnotation,
    getLessonAnnotations,
    saveLessonAnnotation,
} from '../utils/courseTracking';
import {useSession} from 'next-auth/react';
import {useCourses} from '../hooks/useCourses';

function CourseName({courseName}) {
    const searchParams = useSearchParams();
    const topic = searchParams.get('topic');
    const lesson = searchParams.get('lesson');
    const {courses, isLoading} = useCourses();
    const course = courses.find((c) => c.name === courseName);
    const {data: session} = useSession();
    const videoFileList = course
        ? course.topics.flatMap((t) => {
              return t.files
                  .filter((f) => SUPPORTED_VIDEO_EXTENSIONS.includes(f.ext))
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
        videoFileList[0] ? videoFileList[0].replace(/\.[^.]+$/, '.vtt') : ''
    );
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 1024;
        }
        return false;
    });
    const activeElementRef = useRef(null);
    const getVideoFileNameAtGivenIndex = (index = 0) => {
        if (!videoFileList || !videoFileList.length) {
            return '';
        }
        if (index > videoFileList.length - 1 || index < 0) {
            index = 0;
        }
        return videoFileList[index];
    };
    const [currentVideo, setCurrentVideo] = useState(
        getVideoFileNameAtGivenIndex(currentVideoFileIndex)
    );
    const [annotations, setAnnotations] = useState([]);
    const [annotationFilter, setAnnotationFilter] = useState('all');
    const [noteDraft, setNoteDraft] = useState(null);
    const [seekTarget, setSeekTarget] = useState(null);
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
            subtitles: videoFileList[index].replace(/\.[^.]+$/, '.vtt'),
        };
    };

    const playSelectedVideo = (fileName) => {
        const index = videoFileList.indexOf(fileName);
        setVideoFile(videoFileList[index]);
        setSubtitlesFile(videoFileList[index].replace(/\.[^.]+$/, '.vtt'));
        setCurrentVideoFileIndex(index);
        // On mobile the sidebar overlays the whole screen, so collapse it
        // after picking a lesson to reveal the player.
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            collapseSideBar();
        }
    };

    // Courses load asynchronously, so on the first render videoFileList is
    // empty and videoFile is undefined. Once the course data arrives, seed the
    // initial lesson (honoring any ?topic/?lesson params) so the player loads a
    // video instead of sitting on the "Select a lesson" placeholder.
    useEffect(() => {
        if (!videoFile && videoFileList.length > 0) {
            const index = getVideoFileIndex(topic, lesson);
            setVideoFile(videoFileList[index]);
            setSubtitlesFile(videoFileList[index].replace(/\.[^.]+$/, '.vtt'));
            setCurrentVideoFileIndex(index);
        }
    }, [videoFileList, videoFile, topic, lesson]);

    useEffect(() => {
        setCurrentVideo(getVideoFileNameAtGivenIndex(currentVideoFileIndex));

        // Track course view history
        if (course) {
            addToHistory(course, session);
        }

        // Auto-scroll to the active lesson
        setTimeout(() => {
            if (activeElementRef.current) {
                activeElementRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }, 100);
    }, [currentVideoFileIndex, course]);

    useEffect(() => {
        if (courseName && currentVideo) {
            setAnnotations(getLessonAnnotations(courseName, currentVideo));
        } else {
            setAnnotations([]);
        }
        setNoteDraft(null);
    }, [courseName, currentVideo]);

    const collapseSideBar = () => {
        setIsSidebarCollapsed(true);
    };

    const openSidebar = () => {
        setIsSidebarCollapsed(false);
    };

    function copyVideoURL(e, filePath) {
        // getCdnBase() returns a relative "/cdn" on the web build; prefix the
        // current origin so the copied URL is fully-qualified and shareable.
        const base = getCdnBase();
        const url = base.startsWith('http')
            ? `${base}/${filePath}`
            : `${window.location.origin}${base}/${filePath}`;
        navigator.clipboard.writeText(url);
        e.stopPropagation();
    }

    function getFileName(c, t, f) {
        return !t.isTopicLess
            ? `${LOCAL_CDN}/${c.name}/${t.name}/${f.fileName}`
            : `${LOCAL_CDN}/${c.name}/${f.fileName}`;
    }

    const formatTimestamp = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds || 0));
        const minutes = Math.floor(safeSeconds / 60);
        return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
    };

    const refreshAnnotations = () => {
        setAnnotations(getLessonAnnotations(courseName, currentVideo));
    };

    const saveAnnotation = (annotation) => {
        saveLessonAnnotation(courseName, currentVideo, annotation);
        refreshAnnotations();
    };

    const captureBookmark = (timeSeconds) => {
        saveAnnotation({
            type: 'bookmark',
            timeSeconds,
            text: `Bookmark at ${formatTimestamp(timeSeconds)}`,
        });
    };

    const captureNote = (timeSeconds) => {
        setNoteDraft({type: 'note', timeSeconds, text: ''});
    };

    const submitNote = (event) => {
        event.preventDefault();
        if (!noteDraft || !noteDraft.text.trim()) {
            return;
        }
        saveAnnotation({
            ...noteDraft,
            text: noteDraft.text.trim(),
        });
        setNoteDraft(null);
    };

    const removeAnnotation = (annotationId) => {
        deleteLessonAnnotation(courseName, currentVideo, annotationId);
        refreshAnnotations();
    };

    const seekToAnnotation = (annotation) => {
        setSeekTarget({
            seconds: annotation.timeSeconds,
            id: `${annotation.id}-${Date.now()}`,
        });
    };

    const visibleAnnotations = annotations.filter(
        (annotation) =>
            annotationFilter === 'all' || annotation.type === annotationFilter
    );

    if (isLoading) {
        return (
            <div className='modern-course-container'>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid rgba(0, 0, 0, 0.1)',
                            borderTop: '4px solid #007bff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                        }}
                    >
                        Loading course...
                    </p>
                </div>
            </div>
        );
    }

    return course ? (
        <div className='modern-course-container'>
            <div
                className={`modern-course-layout ${
                    isSidebarCollapsed ? 'sidebar-collapsed' : ''
                }`}
            >
                {isSidebarCollapsed && (
                    <button
                        className='modern-open-sidebar-btn'
                        onClick={openSidebar}
                        aria-label='Open sidebar'
                    >
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                        >
                            <polyline points='9 18 15 12 9 6'></polyline>
                        </svg>
                    </button>
                )}

                <aside
                    className={`modern-sidebar ${
                        isSidebarCollapsed ? 'hidden' : ''
                    }`}
                >
                    <header className='modern-course-header'>
                        <div className='modern-nav-controls'>
                            <Link href='/' className='modern-back-btn'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <polyline points='15 18 9 12 15 6'></polyline>
                                </svg>
                                <span>All Courses</span>
                            </Link>
                            <button
                                className='modern-collapse-btn'
                                onClick={collapseSideBar}
                                aria-label='Collapse sidebar'
                            >
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <polyline points='15 18 9 12 15 6'></polyline>
                                </svg>
                            </button>
                        </div>
                        <h1 className='modern-course-title'>{courseName}</h1>
                        <div className='course-stats'>
                            <span className='stat-item'>
                                <svg
                                    width='14'
                                    height='14'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path>
                                    <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path>
                                </svg>
                                {course.topics.length} Topics
                            </span>
                            <span className='stat-item'>
                                <svg
                                    width='14'
                                    height='14'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <polygon points='23 7 16 12 23 17 23 7'></polygon>
                                    <rect
                                        x='1'
                                        y='5'
                                        width='15'
                                        height='14'
                                        rx='2'
                                        ry='2'
                                    ></rect>
                                </svg>
                                {videoFileList.length} Lessons
                            </span>
                        </div>
                    </header>

                    <div className='modern-content-list'>
                        {course.topics.map((topic, topicIndex) => (
                            <div
                                key={topicIndex}
                                className='modern-topic-section'
                            >
                                <div className='modern-topic-header'>
                                    <h3>{topic.name}</h3>
                                    <span className='topic-lesson-count'>
                                        {
                                            topic.files.filter((f) =>
                                                SUPPORTED_VIDEO_EXTENSIONS.includes(
                                                    f.ext
                                                )
                                            ).length
                                        }{' '}
                                        lessons
                                    </span>
                                </div>

                                <div className='modern-lessons-list'>
                                    {topic.files
                                        .filter((f) =>
                                            SUPPORTED_VIDEO_EXTENSIONS.includes(
                                                f.ext
                                            )
                                        )
                                        .map((file, fileIndex) => (
                                            <div
                                                key={fileIndex}
                                                ref={
                                                    getFileName(
                                                        course,
                                                        topic,
                                                        file
                                                    ) === currentVideo
                                                        ? activeElementRef
                                                        : null
                                                }
                                                className={`modern-lesson-item ${
                                                    getFileName(
                                                        course,
                                                        topic,
                                                        file
                                                    ) === currentVideo
                                                        ? 'active'
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
                                                <div className='lesson-content'>
                                                    <div className='lesson-play-icon'>
                                                        {getFileName(
                                                            course,
                                                            topic,
                                                            file
                                                        ) === currentVideo ? (
                                                            <svg
                                                                width='16'
                                                                height='16'
                                                                viewBox='0 0 24 24'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                            >
                                                                <rect
                                                                    x='6'
                                                                    y='4'
                                                                    width='4'
                                                                    height='16'
                                                                ></rect>
                                                                <rect
                                                                    x='14'
                                                                    y='4'
                                                                    width='4'
                                                                    height='16'
                                                                ></rect>
                                                            </svg>
                                                        ) : (
                                                            <svg
                                                                width='16'
                                                                height='16'
                                                                viewBox='0 0 24 24'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                            >
                                                                <polygon points='5 3 19 12 5 21 5 3'></polygon>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className='lesson-info'>
                                                        <span className='lesson-name'>
                                                            {file.name}
                                                        </span>
                                                        {getFileName(
                                                            course,
                                                            topic,
                                                            file
                                                        ) === currentVideo &&
                                                            annotations.length >
                                                                0 && (
                                                                <span className='lesson-annotation-count'>
                                                                    {
                                                                        annotations.length
                                                                    }{' '}
                                                                    saved
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                                <button
                                                    className='modern-copy-url-btn'
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
                                                    aria-label={`Copy URL for ${file.name}`}
                                                >
                                                    <svg
                                                        width='14'
                                                        height='14'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        strokeWidth='2'
                                                    >
                                                        <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                                                        <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <section className='lesson-annotations-panel'>
                        <div className='annotations-header'>
                            <h3>Annotations</h3>
                            <span>{annotations.length}</span>
                        </div>
                        <div className='annotation-tabs'>
                            {['all', 'note', 'bookmark'].map((filter) => (
                                <button
                                    key={filter}
                                    className={
                                        annotationFilter === filter
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() => setAnnotationFilter(filter)}
                                    type='button'
                                >
                                    {filter === 'all'
                                        ? 'All'
                                        : `${filter[0].toUpperCase()}${filter.slice(
                                              1
                                          )}s`}
                                </button>
                            ))}
                        </div>
                        {noteDraft && (
                            <form
                                className='annotation-note-form'
                                onSubmit={submitNote}
                            >
                                <label htmlFor='annotation-note-text'>
                                    Note at{' '}
                                    {formatTimestamp(noteDraft.timeSeconds)}
                                </label>
                                <textarea
                                    id='annotation-note-text'
                                    value={noteDraft.text}
                                    onChange={(event) =>
                                        setNoteDraft({
                                            ...noteDraft,
                                            text: event.target.value,
                                        })
                                    }
                                    rows={3}
                                    autoFocus
                                />
                                <div className='annotation-form-actions'>
                                    <button
                                        type='button'
                                        onClick={() => setNoteDraft(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button type='submit'>Save</button>
                                </div>
                            </form>
                        )}
                        {visibleAnnotations.length > 0 ? (
                            <div className='annotations-list'>
                                {visibleAnnotations.map((annotation) => (
                                    <div
                                        key={annotation.id}
                                        className='annotation-row'
                                    >
                                        <button
                                            type='button'
                                            className='annotation-time'
                                            onClick={() =>
                                                seekToAnnotation(annotation)
                                            }
                                        >
                                            {formatTimestamp(
                                                annotation.timeSeconds
                                            )}
                                        </button>
                                        <div className='annotation-body'>
                                            <span className='annotation-type'>
                                                {annotation.type === 'note'
                                                    ? 'Note'
                                                    : 'Bookmark'}
                                            </span>
                                            <p>{annotation.text}</p>
                                        </div>
                                        <button
                                            type='button'
                                            className='annotation-delete'
                                            onClick={() =>
                                                removeAnnotation(annotation.id)
                                            }
                                            aria-label='Delete annotation'
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className='annotations-empty'>
                                No saved annotations for this lesson.
                            </p>
                        )}
                    </section>
                </aside>

                <main className='modern-video-section'>
                    <VideoPlayer
                        videoFile={videoFile}
                        subtitlesFile={subtitlesFile}
                        getNextVideo={getNextVideo}
                        onCaptureBookmark={captureBookmark}
                        onCaptureNote={captureNote}
                        seekToSeconds={seekTarget?.seconds}
                    />
                </main>
            </div>
        </div>
    ) : (
        <div className='course-not-found'>
            <div className='not-found-content'>
                <svg
                    width='48'
                    height='48'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                >
                    <circle cx='12' cy='12' r='10'></circle>
                    <path d='m9 9 6 6'></path>
                    <path d='m15 9-6 6'></path>
                </svg>
                <h2>Course Not Found</h2>
                <p>The course &quot;{courseName}&quot; could not be found.</p>
                <Link href='/' className='back-to-home-btn'>
                    <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                    >
                        <polyline points='15 18 9 12 15 6'></polyline>
                    </svg>
                    Back to All Courses
                </Link>
            </div>
        </div>
    );
}

export default CourseName;

export async function getStaticProps({params: {courseName}}) {
    const staticExport = process.env.TAURI_BUILD === 'true';

    return {
        props: {
            courseName,
        },
        // ISR is not compatible with static export
        ...(staticExport ? {} : {revalidate: 3600 * 24}),
    };
}

export async function getStaticPaths() {
    // Import courses for build-time static generation only.
    // courses.json is not tracked in git and may be absent on a fresh
    // checkout; fall back to an empty list so the build never hard-fails
    // (fallback: true generates pages on demand at runtime).
    let courses = [];
    try {
        courses = require('../courses.json');
    } catch (err) {
        console.warn(
            'courses.json not found at build time; generating paths on demand'
        );
    }
    return {
        paths: courses.map((c) => ({
            params: {
                courseName: c.name,
            },
        })),
        fallback: true,
    };
}
