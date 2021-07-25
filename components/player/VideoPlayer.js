import React from 'react';
import {BASE_PATH} from '../../constants';

function VideoPlayer({videoFile, subtitlesFile, endHandler}) {
    return (
        <video controls width="750px" height="375px" autoPlay onEnded={endHandler}>
            <source src={`${BASE_PATH}/${videoFile}`} />
            <track src={`${BASE_PATH}/${subtitlesFile}`} label="English subtitles" kind="captions" srcLang="en-us" default />
        </video>
    );
}

export default VideoPlayer;