import React, {useEffect, useRef, useState} from 'react';

const BASE_PATH = process.env.basePath;

function VideoPlayer({videoFile, subtitlesFile, getNextVideo}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);

    const endHandler = () => {
        const nextVideo = getNextVideo();
        console.log(nextVideo);
        setCurrentVideo(nextVideo.name);
        setCurrentSubtitle(nextVideo.subtitles);
        vp.current.load();
        vp.current.play();
    };

    const addTrack = () => {
        let existingTrack = vp.current.getElementsByTagName('track')[0];
        if (existingTrack) {
            existingTrack.remove();
        }
        let track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.src = `${BASE_PATH}/${currentSubtitle}`;
        track.addEventListener('load', function () {
            this.mode = 'showing';
            vp.current.textTracks[0].mode = 'showing'; // thanks Firefox
        });
        track.default = true;
        vp.current.appendChild(track);
    };

    useEffect(() => {
        //due to some reason, the onLoadStart is not being called when the page loads, hence this effect
        addTrack();
    });

    return (
        <video
            controls
            width='750px'
            height='375px'
            autoPlay
            onEnded={endHandler}
            ref={vp}
            // onLoadedMetadata={addTrack}
            onLoadStart={addTrack}
        >
            <source src={`${BASE_PATH}/${currentVideo}`} />
        </video>
    );
}

export default VideoPlayer;
