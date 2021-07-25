import React, {useRef, useState} from 'react';
import {BASE_PATH} from '../../constants';

function VideoPlayer({videoFile, subtitlesFile, setNextVideo}) {
    const vp = useRef(null);
    const [currentVideo, setCurrentVideo] = useState(videoFile);
    const [currentSubtitle, setCurrentSubtitle] = useState(subtitlesFile);
    const endHandler = ()=>{
        setNextVideo();
        console.log(videoFile, subtitlesFile);
        setCurrentVideo(videoFile);
        setCurrentSubtitle(subtitlesFile);
        vp.load();
        vp.play();
    }
    return (
        <video controls width="750px" height="375px" autoPlay onEnded={endHandler} ref={vp}>
            <source src={`${BASE_PATH}/${currentVideo}`} />
            <track src={`${BASE_PATH}/${currentSubtitle}`} label="English subtitles" kind="captions" srcLang="en-us" default />
        </video>
    );
}

export default VideoPlayer;