import Link from 'next/link';
import React, {useState} from 'react';
import courses from '../../courses.json';

function Landing() {
    const videoList = [
        {name: 'sample.mp4', subtitles: 'sample.vtt'},
        {name: 'sample2.mp4', subtitles: 'sample2.vtt'},
    ];
    const [currentVideo, setCurrentVideo] = useState(videoList[1]);
    const handleEnded = () => {
        // alert('Playing next video in 5 seconds...');
        return videoList[0];
    };
    return (
        <div>
            {/*<VideoPlayer*/}
            {/*    videoFile={currentVideo.name}*/}
            {/*    subtitlesFile={currentVideo.subtitles}*/}
            {/*    getNextVideo={handleEnded}*/}
            {/*/>*/}
            <h2>List of courses:</h2>
            <ul>
                {courses.map((course, i) => (
                    <li key={i}>
                        <Link href={`/${course.name}`}>
                            <a>{course.name}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Landing;
