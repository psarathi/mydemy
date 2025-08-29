// 'use client';
import Link from 'next/link';
import React, {useEffect, useRef, useState} from 'react';
import courses from '../../courses.json';
import SwitchCheckbox from '../common/SwitchCheckbox';

function Landing({search_term = '', exact}) {
    exact = exact?.toLowerCase() === 'true';
    const [searchTerm, setSearchTerm] = useState(search_term);
    const [courseList, setCourseList] = useState(courses);
    const [exactSearch, setExactSearch] = useState(exact);
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
        previewCourse.name === course.name
            ? setPreviewCourse({})
            : setPreviewCourse(course);
    }

    return (
        <div className='modern-landing-container'>
            <header className='landing-header'>
                <div className='header-content'>
                    <h1 className='brand-title'>
                        <span className='brand-icon'>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                        </span>
                        Mydemy
                    </h1>
                    <p className='brand-subtitle'>Your personal learning platform</p>
                </div>
            </header>
            <div className='courses-section'>
                <div className='search-section'>
                    <div className='search-bar'>
                        <svg className='search-icon' width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            ref={searchField}
                            autoFocus
                            type='text'
                            className='modern-search-input'
                            placeholder='Search courses...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className='search-controls'>
                        <label className='exact-search-toggle'>
                            <SwitchCheckbox
                                initialState={exactSearch}
                                callback={setExactSearch}
                            />
                            <span className='toggle-label'>Exact match</span>
                        </label>
                    </div>
                </div>
                
                <div className='courses-header'>
                    <h1>Courses</h1>
                    <span className='course-count'>{courseList.length} available</span>
                </div>
                
                <div className='courses-grid'>
                    {courseList.map((course, i) => (
                        <div 
                            key={i} 
                            className='course-card'
                            onMouseEnter={(event) => showCourseDetails(event, course)}
                        >
                            <div className='course-card-content'>
                                <Link href={`/${course.name}`} className='course-link'>
                                    <h3 className='course-title'>{course.name}</h3>
                                </Link>
                                <div className='course-stats'>
                                    <span className='stat'>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                        </svg>
                                        {course.topics?.length || 0} topics
                                    </span>
                                    <span className='stat'>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                        </svg>
                                        {course.topics?.reduce((a, t) => a + (t.files?.length || 0), 0) || 0} lessons
                                    </span>
                                </div>
                            </div>
                            <div className='preview-btn-container'>
                                <button
                                    className={`preview-btn ${course.name === previewCourse?.name ? 'active' : ''}`}
                                    aria-label={`Preview ${course.name}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className='preview-section'>
                {previewCourse?.name ? (
                    <>
                        <div className='preview-header'>
                            <h2>{previewCourse.name}</h2>
                            <div className='preview-stats'>
                                <div className='stat-badge'>
                                    <span className='stat-number'>{previewCourse?.topics?.length || 0}</span>
                                    <span className='stat-label'>Topics</span>
                                </div>
                                <div className='stat-badge'>
                                    <span className='stat-number'>
                                        {previewCourse?.topics?.reduce((a, t) => a + (t.files?.length || 0), 0) || 0}
                                    </span>
                                    <span className='stat-label'>Lessons</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className='preview-content'>
                            <div className='topics-list'>
                                {previewCourse?.topics?.map((topic, i) => (
                                    <div key={i} className='topic-section'>
                                        <div className='topic-header'>
                                            <Link
                                                href={{
                                                    pathname: previewCourse.name,
                                                    query: { topic: topic.name },
                                                }}
                                                className='topic-link'
                                            >
                                                <h4>{topic.name}</h4>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </Link>
                                        </div>
                                        <div className='lessons-list'>
                                            {topic.files?.filter(f => f.ext === '.mp4').map((f, j) => (
                                                <Link
                                                    key={j}
                                                    href={{
                                                        pathname: previewCourse.name,
                                                        query: {
                                                            topic: topic.name,
                                                            lesson: f.name,
                                                        },
                                                    }}
                                                    className='lesson-link'
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                    </svg>
                                                    <span>{f.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='preview-placeholder'>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <h3>Preview a Course</h3>
                        <p>Hover over a course card to see its topics and lessons</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Landing;
