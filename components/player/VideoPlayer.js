import React, {useEffect, useRef, useState} from 'react';
import {BASE_CDN_PATH} from '../../constants';

function VideoPlayer({videoFile, subtitlesFile, getNextVideo}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const [videoDuration, setVideoDuration] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    const endHandler = (userSelected = false) => {
        let vf = videoFile,
            sf = subtitlesFile;
        if (!userSelected) {
            const nextVideo = getNextVideo();
            vf = nextVideo.name;
            sf = nextVideo.subtitles;
        }
        setCurrentVideo(vf);
        setCurrentSubtitle(sf);
        vp.current.load();
        vp.current.play();
    };

    const addTrack = () => {
        // getVideoDuration();
        let existingTrack = vp.current.getElementsByTagName('track')[0];
        if (existingTrack) {
            existingTrack.remove();
        }
        let track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.src = `${BASE_CDN_PATH}/${currentSubtitle}`;
        track.addEventListener('load', function () {
            this.mode = 'showing';
            vp.current.textTracks[0].mode = 'showing'; // thanks Firefox
        });
        track.default = true;
        vp.current.appendChild(track);
        vp.current.textTracks[0].mode = 'showing';
    };

    const getVideoName = () => {
        if (!currentVideo) {
            return '';
        }
        const pathParts = currentVideo.split('/');
        let duration = '';
        return `${pathParts[pathParts.length - 1].replace(
            '.mp4',
            ''
        )} ${duration}`;
    };

    useEffect(() => {
        //due to some reason, the onLoadStart is not being called when the page loads, hence this effect
        addTrack();
    });

    useEffect(() => {
        setCurrentVideo(videoFile);
        setCurrentSubtitle(subtitlesFile);
        endHandler(true);
    }, [videoFile, subtitlesFile]);

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

    return (
        <div className='modern-video-container'>
            <div className='video-header'>
                <div className='video-info'>
                    <h2 className='video-title'>{getVideoName() || 'Select a lesson to start watching'}</h2>
                    {videoDuration && (
                        <span className='video-duration'>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            {videoDuration}
                        </span>
                    )}
                </div>
                <div className='video-controls'>
                    <button 
                        className='control-btn'
                        onClick={() => {
                            if (vp.current.paused) {
                                vp.current.play();
                                setIsPlaying(true);
                            } else {
                                vp.current.pause();
                                setIsPlaying(false);
                            }
                        }}
                        aria-label="Toggle play/pause"
                    >
                        {isPlaying ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        )}
                    </button>
                    <button 
                        className='control-btn'
                        onClick={() => endHandler()}
                        aria-label="Next video"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                    </button>
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
                            ref={vp}
                            onLoadStart={addTrack}
                            onLoadedMetadata={getVideoDuration}
                            preload="metadata"
                            playsInline
                            controlsList="nodownload"
                            onError={(e) => console.error('Video error:', e)}
                        >
                            <source
                                src={`${BASE_CDN_PATH}/${currentVideo}`}
                                type='video/mp4'
                            />
                            <p className='video-fallback'>
                                Your browser doesn't support HTML5 video. 
                                <a href={`${BASE_CDN_PATH}/${currentVideo}`}>Download the video</a> instead.
                            </p>
                        </video>
                    ) : (
                        <div className='video-placeholder'>
                            <div className='placeholder-content'>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                <h3>Ready to Learn</h3>
                                <p>Select a lesson from the sidebar to start watching</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;
