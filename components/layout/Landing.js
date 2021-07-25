import Link from 'next/link';
import React, {useState} from 'react';
import VideoPlayer from '../player/VideoPlayer';

function Landing({files}) {
    const videoList = [
        {name: 'sample.mp4', subtitles: 'sample.vtt'},
        {name: 'sample2.mp4', subtitles: 'sample2.vtt'}
    ];
    const [currentVideo, setCurrentVideo] = useState(videoList[0]);
    const handleEnded = () => {
        // alert('Playing next video in 5 seconds...');
        setCurrentVideo(videoList[1]);
    };
    return (
        <div>
            <VideoPlayer videoFile={currentVideo.name} subtitlesFile={currentVideo.subtitles} endHandler={handleEnded}/>
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
