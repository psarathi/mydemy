import React, {useEffect, useRef, useState} from 'react';
import {BASE_CDN_PATH} from '../../constants';

function VideoPlayer({videoFile, subtitlesFile, getNextVideo}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const [videoDuration, setVideoDuration] = useState('');

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
        <div className='videoContainer'>
            <div className='fileName'>{`${getVideoName()} ${videoDuration}`}</div>
            <br />
            <video
                className='player'
                controls
                autoPlay
                onEnded={() => endHandler()}
                ref={vp}
                onLoadStart={addTrack}
                onLoadedMetadata={getVideoDuration}
            >
                <source
                    src={`${BASE_CDN_PATH}/${currentVideo}`}
                    type='video/mp4'
                />
            </video>
        </div>
    );
}

export default VideoPlayer;
