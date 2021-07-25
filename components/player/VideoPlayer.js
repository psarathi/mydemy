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
        vp.current.textTracks[0].src = `${BASE_PATH}/${currentSubtitle}`;
        vp.current.textTracks[0].mode = 'showing';
    }
    return (
        <video controls width="750px" height="375px" autoPlay onEnded={endHandler} ref={vp}>
            <source src={`${BASE_PATH}/${currentVideo}`} />
            <track src={`${BASE_PATH}/${currentSubtitle}`} label="English subtitles" kind="captions" srcLang="en-us" default />
        </video>
    );
}

export default VideoPlayer;