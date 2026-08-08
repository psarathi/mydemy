import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCdnBase, VIDEO_MIME_TYPES } from '../../constants';
import AutoplayCountdown from './AutoplayCountdown';
import VideoSettings from './VideoSettings';
import AudioSettings from './AudioSettings';
import Hls from 'hls.js';

function VideoPlayer({
    videoFile,
    subtitlesFile,
    getNextVideo,
    startTime = 0,
    onProgress,
    onTimeUpdate,
    onCaptureBookmark,
    onCaptureNote,
    seekToSeconds,
    hlsManifestFile,
}) {
    const vp = useRef(null);
    const lastProgressReport = useRef(0);
    const seekTarget = useRef({videoFile, startTime});
    const startTimeRef = useRef(startTime);
    const onProgressRef = useRef(onProgress);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const [videoDuration, setVideoDuration] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [nextVideoInfo, setNextVideoInfo] = useState(null);
    const [countdownDuration, setCountdownDuration] = useState(10);
    const [showSettings, setShowSettings] = useState(false);
    const [showAudioSettings, setShowAudioSettings] = useState(false);
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [audioTracks, setAudioTracks] = useState([]);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState('original');
    const hls = useRef(null);
    const [captureSeconds, setCaptureSeconds] = useState(0);

    // Mobile browsers reject play() when autoplay-with-audio is blocked
    // (NotAllowedError). Swallow that rejection so it doesn't surface as an
    // uncaught promise error; the native controls let the user start playback.
    const safePlay = useCallback(() => {
        if (!vp.current) {
            return;
        }
        const result = vp.current.play();
        if (result && typeof result.catch === 'function') {
            result.catch(() => {});
        }
    }, []);

    const endHandler = useCallback((userSelected = false) => {
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
    }, [getNextVideo, safePlay, subtitlesFile, videoFile]);

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

    const addTrack = useCallback(() => {
        if (!vp.current) {
            return;
        }
        let existingTrack = vp.current.getElementsByTagName('track')[0];
        if (existingTrack) {
            existingTrack.remove();
        }
        if (!currentSubtitle) {
            return;
        }
        let track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.src = `${getCdnBase()}/${currentSubtitle}`;
        track.addEventListener('load', function () {
            this.mode = captionsEnabled ? 'showing' : 'disabled';
            if (
                vp.current &&
                vp.current.textTracks &&
                vp.current.textTracks[0]
            ) {
                vp.current.textTracks[0].mode = captionsEnabled
                    ? 'showing'
                    : 'disabled'; // thanks Firefox
            }
        });
        track.default = true;
        vp.current.appendChild(track);
        if (vp.current.textTracks && vp.current.textTracks[0]) {
            vp.current.textTracks[0].mode = captionsEnabled
                ? 'showing'
                : 'disabled';
        }
    }, [captionsEnabled, currentSubtitle]);

    const syncAudioTracks = useCallback(() => {
        if (!vp.current || !vp.current.audioTracks) {
            setAudioTracks([]);
            setSelectedAudioTrack('original');
            return;
        }

        const tracks = Array.from(vp.current.audioTracks).map((track, index) => ({
            id: String(index),
            label: track.label || track.language || `Audio track ${index + 1}`,
            enabled: track.enabled,
        }));
        setAudioTracks(tracks);
        const activeTrack = tracks.find((track) => track.enabled);
        setSelectedAudioTrack(activeTrack ? activeTrack.id : tracks[0]?.id || 'original');
    }, []);

    const handleCaptionsChange = (enabled) => {
        setCaptionsEnabled(enabled);
        if (vp.current?.textTracks?.[0]) {
            vp.current.textTracks[0].mode = enabled ? 'showing' : 'disabled';
        }
    };

    const handleAudioTrackChange = (trackId) => {
        setSelectedAudioTrack(trackId);
        if (hls.current) {
            hls.current.audioTrack = Number(trackId);
            return;
        }
        if (!vp.current?.audioTracks) return;
        Array.from(vp.current.audioTracks).forEach((track, index) => {
            track.enabled = String(index) === trackId;
        });
    };

    useEffect(() => {
        const supportsNativeHls = vp.current?.canPlayType('application/vnd.apple.mpegurl');
        if (!vp.current || !hlsManifestFile || (!Hls.isSupported() && !supportsNativeHls)) return;
        const controller = new AbortController();
        const manifestUrl = `${getCdnBase()}/${hlsManifestFile}`;
        if (supportsNativeHls) {
            vp.current.src = manifestUrl;
            vp.current.load();
            return () => controller.abort();
        }

        const instance = new Hls();
        hls.current = instance;
        const updateAudioTracks = (tracks) => {
            setAudioTracks(tracks.map((track, index) => ({
                id: String(index),
                label: track.name || track.lang || `Audio track ${index + 1}`,
                enabled: index === instance.audioTrack,
            })));
            setSelectedAudioTrack(String(instance.audioTrack));
        };
        instance.on(Hls.Events.MANIFEST_PARSED, () =>
            updateAudioTracks(instance.audioTracks)
        );
        instance.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) =>
            updateAudioTracks(data.audioTracks)
        );
        instance.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                instance.destroy();
                hls.current = null;
                vp.current?.load();
            }
        });
        instance.loadSource(manifestUrl);
        instance.attachMedia(vp.current);
        return () => {
            controller.abort();
            instance.destroy();
            hls.current = null;
        };
    }, [hlsManifestFile]);

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
        // Some browsers do not fire onLoadStart on the initial page load.
        addTrack();
    }, [addTrack]);

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
        onProgressRef.current = onProgress;
    }, [onProgress]);

    useEffect(() => {
        startTimeRef.current = startTime;
    }, [startTime]);

    useEffect(() => {
        setCurrentVideo(videoFile);
        setCurrentSubtitle(subtitlesFile);
        seekTarget.current = {videoFile, startTime: startTimeRef.current};
        lastProgressReport.current = 0;
        if (vp.current) {
            vp.current.load();
            safePlay();
        }
    }, [videoFile, subtitlesFile, safePlay]);

    useEffect(() => {
        if (vp.current && typeof seekToSeconds === 'number') {
            vp.current.currentTime = seekToSeconds;
            safePlay();
        }
    }, [seekToSeconds, safePlay]);

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
        const shouldSeek =
            seekTarget.current.videoFile === videoFile &&
            seekTarget.current.startTime > 0 &&
            vp.current &&
            vp.current.currentTime < 1;
        if (shouldSeek) {
            vp.current.currentTime = seekTarget.current.startTime;
        }
    };

    const reportProgress = useCallback((force = false) => {
        const handleProgress = onProgressRef.current;
        if (!vp.current || !handleProgress) {
            return;
        }
        const now = Date.now();
        if (!force && now - lastProgressReport.current < 5000) {
            return;
        }
        lastProgressReport.current = now;
        handleProgress({
            currentTime: vp.current.currentTime,
            duration: vp.current.duration || 0,
        });
    }, []);

    useEffect(() => {
        const flushProgress = () => reportProgress(true);
        window.addEventListener('beforeunload', flushProgress);
        return () => {
            window.removeEventListener('beforeunload', flushProgress);
            flushProgress();
        };
    }, [reportProgress]);

    const getCurrentSeconds = () =>
        vp.current ? Math.floor(vp.current.currentTime || 0) : 0;

    const handleTimeUpdate = () => {
        const seconds = getCurrentSeconds();
        setCaptureSeconds(seconds);
        if (onTimeUpdate) {
            onTimeUpdate(seconds);
        }
        reportProgress();
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
                    <div className='audio-settings-control'>
                        <button
                            className='control-btn'
                            onClick={() => setShowAudioSettings((isOpen) => !isOpen)}
                            aria-label='Audio and subtitles settings'
                            aria-expanded={showAudioSettings}
                            title='Audio and subtitles'
                        >
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <path d='M11 5 6 9H2v6h4l5 4V5Z'></path>
                                <path d='M15.54 8.46a5 5 0 0 1 0 7.07'></path>
                                <path d='M19.07 4.93a10 10 0 0 1 0 14.14'></path>
                            </svg>
                        </button>
                        <AudioSettings
                            isOpen={showAudioSettings}
                            onClose={() => setShowAudioSettings(false)}
                            captionsAvailable={Boolean(currentSubtitle)}
                            captionsEnabled={captionsEnabled}
                            onCaptionsChange={handleCaptionsChange}
                            audioTracks={audioTracks}
                            selectedAudioTrack={selectedAudioTrack}
                            onAudioTrackChange={handleAudioTrackChange}
                        />
                    </div>
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
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => {
                                setIsPlaying(false);
                                reportProgress(true);
                            }}
                            onTimeUpdate={handleTimeUpdate}
                            ref={vp}
                            onLoadStart={addTrack}
                            onLoadedMetadata={() => {
                                getVideoDuration();
                                syncAudioTracks();
                            }}
                            onEnded={() => {
                                reportProgress(true);
                                endHandler();
                            }}
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
