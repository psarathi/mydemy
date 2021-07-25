import Link from 'next/link';
import React, {useState} from 'react';
import {BASE_PATH} from '../../constants';

function Landing({files}) {
    const videoList = [
        {name: 'sample.mp4', subtitles: 'sample.vtt'},
        {name: 'sample2.mp4', subtitles: 'sample2.vtt'}
    ];
    const [currentVideo, setCurrentVideo] = useState(videoList[0]);
    const handleEnded = ()=>{
        // alert('Playing next video in 5 seconds...');
        setCurrentVideo(videoList[1]);
    };
    return (
        <div>
            <video controls width="750px" height="375px" autoPlay onEnded={handleEnded}>
                <source src={`${BASE_PATH}/${currentVideo.name}`} />
                <track src={`${BASE_PATH}/${currentVideo.subtitles}`} label="English subtitles" kind="captions" srcLang="en-us" default />
            </video>
            <ul>
                {files.map((file, i) => (
                    <li key={i}>
                        <Link href={`/${file}`}>
                            <a>{file}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Landing;
