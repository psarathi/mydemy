import React, {useRef, useState} from 'react';
import {BASE_PATH} from '../../constants';

function VideoPlayer({videoFile, subtitlesFile, getNextVideo}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const endHandler = ()=>{
        const nextVideo = getNextVideo();
        console.log(nextVideo);
        setCurrentVideo(nextVideo.name);
        setCurrentSubtitle(nextVideo.subtitles);
        vp.current.load();
        vp.current.play();
    }
    const addTrack = () => {
        let track = document.createElement("track");
        track.kind = "captions";
        track.label = "English";
        track.srclang = "en";
        track.src = `${BASE_PATH}/${currentSubtitle}`;
        track.addEventListener("load", function() {
            this.mode = "showing";
            vp.current.textTracks[0].mode = "showing"; // thanks Firefox
        });
        vp.current.appendChild(track);
    }
    return (
        <video controls width="750px" height="375px" autoPlay onEnded={endHandler} ref={vp} onLoadedMetadata={addTrack}>
            <source src={`${BASE_PATH}/${currentVideo}`} />
            {/*<track src={`${BASE_PATH}/${currentSubtitle}`} label="English subtitles" kind="captions" srcLang="en-us" default />*/}
        </video>
    );
}

export default VideoPlayer;