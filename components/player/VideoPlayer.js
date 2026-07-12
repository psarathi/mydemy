import React, {useEffect, useRef, useState} from 'react';
import {getCdnBase, VIDEO_MIME_TYPES} from '../../constants';
import AutoplayCountdown from './AutoplayCountdown';
import VideoSettings from './VideoSettings';

function VideoPlayer({
    videoFile,
    subtitlesFile,
    getNextVideo,
    onTimeUpdate,
    onCaptureBookmark,
    onCaptureNote,
    seekToSeconds,
}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const [videoDuration, setVideoDuration] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [nextVideoInfo, setNextVideoInfo] = useState(null);
    const [countdownDuration, setCountdownDuration] = useState(10);
    const [showSettings, setShowSettings] = useState(false);
    const [captureSeconds, setCaptureSeconds] = useState(0);

    // Mobile browsers reject play() when autoplay-with-audio is blocked
    // (NotAllowedError). Swallow that rejection so it doesn't surface as an
    // uncaught promise error; the native controls let the user start playback.
    const safePlay = () => {
        if (!vp.current) {
            return;
        }
        const result = vp.current.play();
        if (result && typeof result.catch === 'function') {
            result.catch(() => {});
        }
    };

    const endHandler = (userSelected = false) => {
        if (userSelected) {
            // User manually selected a video, play immediately
            setCurrentVideo(videoFile);
            setCurrentSubtitle(subtitlesFile);
            if (vp.current) {
                vp.current.load();
                safePlay();
            }
        } else {
            // Video ended, show countdown before playing next
            const nextVideo = getNextVideo();
            setNextVideoInfo(nextVideo);
            setShowCountdown(true);
        }
    };

    const playNextVideo = () => {
        if (nextVideoInfo) {
            setCurrentVideo(nextVideoInfo.name);
            setCurrentSubtitle(nextVideoInfo.subtitles);
            setShowCountdown(false);
            setNextVideoInfo(null);
            setTimeout(() => {
                if (vp.current) {
                    vp.current.load();
                    safePlay();
                }
            }, 100);
        }
    };

    const skipToNextVideo = () => {
        const nextVideo = getNextVideo();
        setCurrentVideo(nextVideo.name);
        setCurrentSubtitle(nextVideo.subtitles);
        setShowCountdown(false);
        setNextVideoInfo(null);
        setTimeout(() => {
            if (vp.current) {
                vp.current.load();
                safePlay();
            }
        }, 100);
    };

    const cancelAutoplay = () => {
        setShowCountdown(false);
        setNextVideoInfo(null);
    };

    const getNextVideoInfo = () => {
        if (!nextVideoInfo || !nextVideoInfo.name) {
            return {topic: '', lesson: 'Next video'};
        }
        const pathParts = nextVideoInfo.name.split('/');
        // Path format: courses/course-name/topic-name/lesson-name.ext
        const lesson = pathParts[pathParts.length - 1].replace(/\.[^.]+$/, '');
        const topic =
            pathParts.length >= 3 ? pathParts[pathParts.length - 2] : '';
        return {topic, lesson};
    };

    const addTrack = () => {
        if (!vp.current || !currentSubtitle) {
            return;
        }
        // getVideoDuration();
        let existingTrack = vp.current.getElementsByTagName('track')[0];
        if (existingTrack) {
            existingTrack.remove();
        }
        let track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.src = `${getCdnBase()}/${currentSubtitle}`;
        track.addEventListener('load', function () {
            this.mode = 'showing';
            if (
                vp.current &&
                vp.current.textTracks &&
                vp.current.textTracks[0]
            ) {
                vp.current.textTracks[0].mode = 'showing'; // thanks Firefox
            }
        });
        track.default = true;
        vp.current.appendChild(track);
        if (vp.current.textTracks && vp.current.textTracks[0]) {
            vp.current.textTracks[0].mode = 'showing';
        }
    };

    const getVideoName = () => {
        if (!currentVideo) {
            return '';
        }
        const pathParts = currentVideo.split('/');
        let duration = '';
        return `${pathParts[pathParts.length - 1].replace(
            /\.[^.]+$/,
            ''
        )} ${duration}`;
    };

    useEffect(() => {
        //due to some reason, the onLoadStart is not being called when the page loads, hence this effect
        addTrack();
    });

    useEffect(() => {
        // Load autoplay countdown duration from localStorage
        const savedDuration = localStorage.getItem('autoplayCountdownDuration');
        if (savedDuration) {
            setCountdownDuration(parseInt(savedDuration, 10));
        }

        // Listen for settings updates
        const handleSettingsUpdate = (event) => {
            if (event.detail.countdownDuration) {
                setCountdownDuration(event.detail.countdownDuration);
            }
        };

        window.addEventListener(
            'autoplaySettingsUpdated',
            handleSettingsUpdate
        );

        return () => {
            window.removeEventListener(
                'autoplaySettingsUpdated',
                handleSettingsUpdate
            );
        };
    }, []);

    useEffect(() => {
        setCurrentVideo(videoFile);
        setCurrentSubtitle(subtitlesFile);
        endHandler(true);
    }, [videoFile, subtitlesFile]);

    useEffect(() => {
        if (vp.current && typeof seekToSeconds === 'number') {
            vp.current.currentTime = seekToSeconds;
            safePlay();
        }
    }, [seekToSeconds]);

    const getVideoDuration = () => {
        if (vp.current.duration) {
            setVideoDuration(
                `(${Math.floor(vp.current.duration / 60)}:${Math.round(
                    vp.current.duration % 60
                )
                    .toString()
                    .padStart(2, '0')})`
            );
        }
    };

    const getCurrentSeconds = () =>
        vp.current ? Math.floor(vp.current.currentTime || 0) : 0;

    const handleTimeUpdate = () => {
        const seconds = getCurrentSeconds();
        setCaptureSeconds(seconds);
        if (onTimeUpdate) {
            onTimeUpdate(seconds);
        }
    };

    const formatTimestamp = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds || 0));
        const minutes = Math.floor(safeSeconds / 60);
        return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
    };

    return (
        <div className='modern-video-container'>
            {showCountdown && (
                <AutoplayCountdown
                    nextVideoInfo={getNextVideoInfo()}
                    onCancel={cancelAutoplay}
                    onPlayNow={playNextVideo}
                    countdownDuration={countdownDuration}
                />
            )}
            <VideoSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
            <div className='video-header'>
                <div className='video-info'>
                    <h2 className='video-title'>
                        {getVideoName() || 'Select a lesson to start watching'}
                    </h2>
                </div>
                <div className='video-controls'>
                    <button
                        className='control-btn'
                        onClick={() => {
                            if (vp.current.paused) {
                                safePlay();
                                setIsPlaying(true);
                            } else {
                                vp.current.pause();
                                setIsPlaying(false);
                            }
                        }}
                        aria-label='Toggle play/pause'
                    >
                        {isPlaying ? (
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <rect x='6' y='4' width='4' height='16'></rect>
                                <rect x='14' y='4' width='4' height='16'></rect>
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
                    </button>
                    <button
                        className='control-btn'
                        onClick={skipToNextVideo}
                        aria-label='Next video'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                        >
                            <polygon points='5 4 15 12 5 20 5 4'></polygon>
                            <line x1='19' y1='5' x2='19' y2='19'></line>
                        </svg>
                    </button>
                    {onCaptureBookmark && (
                        <button
                            className='control-btn'
                            onClick={() =>
                                onCaptureBookmark(getCurrentSeconds())
                            }
                            aria-label='Bookmark current timestamp'
                            title='Bookmark current timestamp'
                        >
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'></path>
                            </svg>
                        </button>
                    )}
                    {onCaptureNote && (
                        <button
                            className='control-btn'
                            onClick={() => onCaptureNote(getCurrentSeconds())}
                            aria-label='Add note at current timestamp'
                            title='Add note at current timestamp'
                        >
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <path d='M12 20h9'></path>
                                <path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'></path>
                            </svg>
                        </button>
                    )}
                    {(onCaptureBookmark || onCaptureNote) && (
                        <span className='video-duration'>
                            Capture at {formatTimestamp(captureSeconds)}
                        </span>
                    )}
                    <button
                        className='control-btn'
                        onClick={() => setShowSettings(true)}
                        aria-label='Video settings'
                        title='Video settings'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                        >
                            <circle cx='12' cy='12' r='3'></circle>
                            <path d='M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24'></path>
                        </svg>
                    </button>
                    {videoDuration && (
                        <span className='video-duration'>
                            <svg
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <circle cx='12' cy='12' r='10'></circle>
                                <polyline points='12,6 12,12 16,14'></polyline>
                            </svg>
                            {videoDuration}
                        </span>
                    )}
                </div>
            </div>

            <div className='video-player-wrapper'>
                <div className='video-aspect-container'>
                    {currentVideo ? (
                        <video
                            className='modern-video-player'
                            controls
                            autoPlay
                            onEnded={() => endHandler()}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={handleTimeUpdate}
                            ref={vp}
                            onLoadStart={addTrack}
                            onLoadedMetadata={getVideoDuration}
                            preload='metadata'
                            playsInline
                            controlsList='nodownload'
                            onError={(e) => console.error('Video error:', e)}
                        >
                            <source
                                src={`${getCdnBase()}/${currentVideo}`}
                                type={(() => {
                                    const ext = currentVideo
                                        ? currentVideo.match(/\.[^.]+$/)?.[0]
                                        : '.mp4';
                                    return VIDEO_MIME_TYPES[ext] || 'video/mp4';
                                })()}
                            />
                            <p className='video-fallback'>
                                Your browser doesn&apos;t support HTML5 video.
                                <a href={`${getCdnBase()}/${currentVideo}`}>
                                    Download the video
                                </a>{' '}
                                instead.
                            </p>
                        </video>
                    ) : (
                        <div className='video-placeholder'>
                            <div className='placeholder-content'>
                                <svg
                                    width='64'
                                    height='64'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <polygon points='5 3 19 12 5 21 5 3'></polygon>
                                </svg>
                                <h3>Ready to Learn</h3>
                                <p>
                                    Select a lesson from the sidebar to start
                                    watching
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;
