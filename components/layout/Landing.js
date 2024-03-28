import Link from 'next/link';
import React, {useEffect, useRef, useState} from 'react';
import courses from '../../courses.json';
import SwitchCheckbox from '../common/SwitchCheckbox';

function Landing() {
    const [searchTerm, setSearchTerm] = useState('');
    const [courseList, setCourseList] = useState(courses);
    const [exactSearch, setExactSearch] = useState(false);
    const [previewCourse, setPreviewCourse] = useState({});
    const searchField = useRef(null);
    useEffect(() => {
        if (!searchTerm) {
            setCourseList(courses);
        } else {
            let searchTermParts = searchTerm.trim().split(' ');
            setCourseList(
                courses.filter((c) =>
                    !exactSearch
                        ? searchTermParts.some(
                              (p) => c.name.toLowerCase().indexOf(p) !== -1
                          )
                        : searchTermParts.every((p) =>
                              c.name.toLowerCase().split(' ').includes(p)
                          )
                )
            );
        }
    }, [searchTerm, exactSearch]);
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.metaKey && (e.key === 'K' || e.key === 'k')) {
                searchField.current.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return function cleanup() {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    function showCourseDetails(e, course) {
        previewCourse.name && previewCourse.name === course.name
            ? setPreviewCourse({})
            : setPreviewCourse(course);
    }

    return (
        <div className='mainLandingContainer'>
            <div className='listingContainer'>
                <div className='searchInputContainer'>
                    <input
                        ref={searchField}
                        autoFocus
                        type='text'
                        className='search-input'
                        placeholder='search courses...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SwitchCheckbox
                        initialState={exactSearch}
                        callback={setExactSearch}
                    />
                </div>
                <div className='courseListHeader'>
                    <h2>Courses: {`(${courseList.length})`}</h2>
                </div>
                <div className='courseListContainer'>
                    <ul className='course-list'>
                        {courseList.map((course, i) => (
                            <li key={i}>
                                <div className='courseListLineItemContainer'>
                                    <Link href={`/${course.name}`}>
                                        {course.name}
                                    </Link>
                                    <div
                                        className={
                                            course.name === previewCourse?.name
                                                ? 'courseListLineItemPreview deepSkyBlue'
                                                : 'courseListLineItemPreview'
                                        }
                                        onMouseOverCapture={(event) =>
                                            showCourseDetails(event, course)
                                        }
                                    >
                                        &#9215;
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className='previewContainer'>
                <div className='coursePreviewHeader'>
                    <h2>{previewCourse?.name}</h2>
                    {previewCourse.name && (
                        <h3>
                            <span>Topics: {previewCourse?.topics?.length}</span>
                            <span>
                                Lessons:&nbsp;
                                {previewCourse?.topics?.reduce((a, t) => {
                                    return a + t.files.length;
                                }, 0)}
                            </span>
                        </h3>
                    )}
                </div>
                <div className='coursePreviewDetails'>
                    <ul className='course-list'>
                        {previewCourse?.topics?.map((topic, i) => (
                            <>
                                <li key={i} className='coursePreviewTopic'>
                                    <Link
                                        href={{
                                            pathname: previewCourse.name,
                                            query: {
                                                topic: topic.name,
                                            },
                                        }}
                                    >
                                        {topic.name}
                                    </Link>
                                </li>
                                {topic.files.map((f, j) => (
                                    <li
                                        className='coursePreviewTopicLesson'
                                        key={j}
                                    >
                                        <Link
                                            href={{
                                                pathname: previewCourse.name,
                                                query: {
                                                    topic: topic.name,
                                                    lesson: f.e,
                                                },
                                            }}
                                        >
                                            {f.name}
                                        </Link>
                                    </li>
                                ))}
                            </>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Landing;
