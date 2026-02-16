// 'use client';
import Link from 'next/link';
import React, {useEffect, useRef, useState} from 'react';
import SwitchCheckbox from '../common/SwitchCheckbox';
import ThemeToggle from '../common/ThemeToggle';
import HamburgerMenu from '../common/HamburgerMenu';
import FavoriteButton from '../common/FavoriteButton';
import TagButton from '../common/TagButton';
import {addToHistory} from '../../utils/courseTracking';
import {addTag, removeTag, getTags, getTagCounts} from '../../utils/tagging';
import {useSession} from 'next-auth/react';
import {SUPPORTED_VIDEO_EXTENSIONS} from '../../constants';
import {useCourses} from '../../hooks/useCourses';

function Landing({search_term = '', exact, refreshCoursesRef}) {
    exact = exact?.toLowerCase() === 'true';

    // Load preserved search term from localStorage if no URL param provided
    const getInitialSearchTerm = () => {
        if (search_term) return search_term;
        if (typeof window !== 'undefined') {
            return localStorage.getItem('lastSearchTerm') || '';
        }
        return '';
    };

    const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
    const [courseList, setCourseList] = useState([]);
    const [exactSearch, setExactSearch] = useState(exact);
    const [searchInLessons, setSearchInLessons] = useState(false);
    const [previewCourse, setPreviewCourse] = useState({});
    const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
    const [activeTags, setActiveTags] = useState([]);
    const [tagFilterMode, setTagFilterMode] = useState('OR');
    const [allTagCounts, setAllTagCounts] = useState([]);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
    const searchField = useRef(null);
    const autocompleteRef = useRef(null);
    const {data: session} = useSession();
    const {courses, isLoading, mutate} = useCourses();

    // Expose refresh function to parent
    useEffect(() => {
        if (refreshCoursesRef) {
            refreshCoursesRef.current = mutate;
        }
    }, [refreshCoursesRef, mutate]);

    // Save search term to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (searchTerm) {
                localStorage.setItem('lastSearchTerm', searchTerm);
            } else {
                localStorage.removeItem('lastSearchTerm');
            }
        }
    }, [searchTerm]);

    // Load and refresh tag counts
    useEffect(() => {
        setAllTagCounts(getTagCounts());

        const handleTagsUpdated = () => {
            const counts = getTagCounts();
            setAllTagCounts(counts);
            // Clean up activeTags that no longer exist
            const existingTags = new Set(counts.map(c => c.tag));
            setActiveTags(prev => prev.filter(t => existingTags.has(t)));
        };

        window.addEventListener('courseTagsUpdated', handleTagsUpdated);
        return () => window.removeEventListener('courseTagsUpdated', handleTagsUpdated);
    }, []);

    // Autocomplete: show when typing # in search
    const autocompleteResults = React.useMemo(() => {
        if (!searchTerm.startsWith('#') || searchTerm === '#') {
            // Show all tags when just '#' is typed
            if (searchTerm === '#') return allTagCounts.slice(0, 8);
            return [];
        }
        const query = searchTerm.substring(1).toLowerCase();
        return allTagCounts
            .filter(t => t.tag.toLowerCase().includes(query))
            .slice(0, 8);
    }, [searchTerm, allTagCounts]);

    // Show/hide autocomplete based on search term
    useEffect(() => {
        if (searchTerm.startsWith('#') && autocompleteResults.length > 0) {
            setShowAutocomplete(true);
            setAutocompleteIndex(-1);
        } else {
            setShowAutocomplete(false);
        }
    }, [searchTerm, autocompleteResults]);

    // Close autocomplete when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target) &&
                searchField.current && !searchField.current.contains(e.target)) {
                setShowAutocomplete(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter courses based on search + active tags
    useEffect(() => {
        let filtered = courses;

        // Step 1: Filter by active tags
        if (activeTags.length > 0) {
            filtered = filtered.filter(c => {
                const courseTags = getTags(c.name);
                if (tagFilterMode === 'AND') {
                    return activeTags.every(t => courseTags.includes(t));
                } else {
                    return activeTags.some(t => courseTags.includes(t));
                }
            });
        }

        // Step 2: Filter by search term
        if (searchTerm && !searchTerm.startsWith('#')) {
            let searchTermParts = searchTerm.trim().split(' ');

            filtered = filtered.filter(c => {
                const courseNameMatch = !exactSearch
                    ? searchTermParts.some(
                          (p) => c.name.toLowerCase().indexOf(p.toLowerCase()) !== -1
                      )
                    : searchTermParts.every((p) =>
                          c.name.toLowerCase().split(' ').includes(p.toLowerCase())
                      );

                // If searching in lessons, also check lesson names
                if (searchInLessons && !courseNameMatch) {
                    const hasMatchingLesson = c.topics?.some((topic) =>
                        topic.files?.some((file) =>
                            !exactSearch
                                ? searchTermParts.some(
                                      (p) => file.name.toLowerCase().indexOf(p.toLowerCase()) !== -1
                                  )
                                : searchTermParts.every((p) =>
                                      file.name.toLowerCase().split(' ').includes(p.toLowerCase())
                                  )
                        )
                    );
                    return hasMatchingLesson;
                }

                return courseNameMatch;
            });
        } else if (searchTerm.startsWith('#') && searchTerm.length > 1) {
            // Legacy single-tag search via #tag (still works while autocomplete is open)
            const tag = searchTerm.substring(1).toLowerCase();
            filtered = filtered.filter(c => {
                const courseTags = getTags(c.name);
                return courseTags.includes(tag);
            });
        }

        setCourseList(filtered);
    }, [searchTerm, exactSearch, searchInLessons, courses, activeTags, tagFilterMode]);

    useEffect(() => {
        function handleTagClick(event) {
            const tag = event.detail.tag;
            setActiveTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            );
        }

        window.addEventListener('tagClicked', handleTagClick);
        return () => window.removeEventListener('tagClicked', handleTagClick);
    }, []);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.metaKey && (e.key === 'K' || e.key === 'k')) {
                searchField.current.focus();
            }
            // Clear search on Escape key
            if (e.key === 'Escape' && searchField.current === document.activeElement) {
                if (showAutocomplete) {
                    setShowAutocomplete(false);
                } else {
                    setSearchTerm('');
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return function cleanup() {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showAutocomplete]);

    function showCourseDetails(e, course) {
        if (previewCourse.name === course.name) {
            setPreviewCourse({});
            setMobilePreviewOpen(false);
        } else {
            setPreviewCourse(course);
        }
    }

    function handlePreviewTap(e, course) {
        e.stopPropagation();
        if (previewCourse.name === course.name && mobilePreviewOpen) {
            setPreviewCourse({});
            setMobilePreviewOpen(false);
        } else {
            setPreviewCourse(course);
            setMobilePreviewOpen(true);
        }
    }

    function closeMobilePreview() {
        setMobilePreviewOpen(false);
    }

    const handleCourseClick = (course) => {
        addToHistory(course, session);
    };

    const clearSearch = () => {
        setSearchTerm('');
        searchField.current?.focus();
    };

    const selectAutocompleteTag = (tag) => {
        setActiveTags(prev =>
            prev.includes(tag) ? prev : [...prev, tag]
        );
        setSearchTerm('');
        setShowAutocomplete(false);
        setAutocompleteIndex(-1);
        searchField.current?.focus();
    };

    const toggleTag = (tag) => {
        setActiveTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const clearActiveTags = () => {
        setActiveTags([]);
    };

    const handleSearchKeyDown = (e) => {
        if (showAutocomplete && autocompleteResults.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setAutocompleteIndex(prev =>
                    prev < autocompleteResults.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setAutocompleteIndex(prev =>
                    prev > 0 ? prev - 1 : autocompleteResults.length - 1
                );
            } else if (e.key === 'Enter' && autocompleteIndex >= 0) {
                e.preventDefault();
                selectAutocompleteTag(autocompleteResults[autocompleteIndex].tag);
            }
        }
    };

    const handleBulkAddTag = (tagValue) => {
        if (!tagValue || tagValue.trim() === '') return;

        // Add tag to all courses in the current filtered list
        courseList.forEach(course => {
            addTag(course, tagValue);
        });
    };

    const handleBulkRemoveTag = (tagValue) => {
        if (!tagValue || tagValue.trim() === '') return;

        // Remove tag from all courses in the current filtered list
        courseList.forEach(course => {
            removeTag(course, tagValue);
        });
    };

    if (isLoading) {
        return (
            <div className='modern-landing-container'>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(0, 0, 0, 0.1)',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='modern-landing-container'>
            <HamburgerMenu />
            <header className='landing-header'>
                <div className='header-content'>
                    <div className='brand-section'>
                        <h1 className='brand-title'>
                            <span className='brand-icon'>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                            </span>
                            Mydemy
                            {session && (
                                <span className='logged-in-indicator' title={`Signed in as ${session.user.name}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"></path>
                                    </svg>
                                </span>
                            )}
                        </h1>
                        <p className='brand-subtitle'>
                            Your personal learning platform
                            {session && (
                                <span className='welcome-text'> • Welcome back, {session.user.name?.split(' ')[0]}!</span>
                            )}
                        </p>
                    </div>
                    <div className='header-actions'>
                        <ThemeToggle />
                    </div>
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
                            placeholder='Search courses... (type # to filter by tag)'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        {searchTerm && (
                            <button
                                className='search-clear-btn'
                                onClick={clearSearch}
                                aria-label='Clear search'
                                type='button'
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                        {showAutocomplete && (
                            <div className='tag-autocomplete' ref={autocompleteRef}>
                                {autocompleteResults.map((item, i) => (
                                    <div
                                        key={item.tag}
                                        className={`tag-autocomplete-item ${i === autocompleteIndex ? 'active' : ''}`}
                                        onClick={() => selectAutocompleteTag(item.tag)}
                                        onMouseEnter={() => setAutocompleteIndex(i)}
                                    >
                                        <span className='tag-autocomplete-name'>#{item.tag}</span>
                                        <span className='tag-autocomplete-count'>{item.count} {item.count === 1 ? 'course' : 'courses'}</span>
                                    </div>
                                ))}
                                {autocompleteResults.length === 0 && searchTerm.length > 1 && (
                                    <div className='tag-autocomplete-empty'>No matching tags</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className='search-controls'>
                        <label className='exact-search-toggle'>
                            <SwitchCheckbox
                                initialState={exactSearch}
                                callback={setExactSearch}
                            />
                            <span className='toggle-label'>Exact match</span>
                        </label>
                        <label className='exact-search-toggle'>
                            <SwitchCheckbox
                                initialState={searchInLessons}
                                callback={setSearchInLessons}
                            />
                            <span className='toggle-label'>Search in lessons</span>
                        </label>
                    </div>
                </div>

                {allTagCounts.length > 0 && (
                    <div className='tag-filter-bar'>
                        <button
                            className='tag-filter-mode-btn'
                            onClick={() => setTagFilterMode(prev => prev === 'OR' ? 'AND' : 'OR')}
                            title={tagFilterMode === 'OR' ? 'Showing courses with ANY selected tag' : 'Showing courses with ALL selected tags'}
                        >
                            {tagFilterMode}
                        </button>
                        {allTagCounts.map(({tag, count}) => (
                            <button
                                key={tag}
                                className={`tag-filter-pill ${activeTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                <span>#{tag}</span>
                                <span className='tag-filter-pill-count'>{count}</span>
                            </button>
                        ))}
                        {activeTags.length > 0 && (
                            <button className='tag-filter-clear' onClick={clearActiveTags}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>
                )}

                <div className='courses-header'>
                    <div>
                        <h1>Courses</h1>
                        <span className='course-count'>{courseList.length} available</span>
                    </div>
                    {courseList.length > 0 && (
                        <div className='bulk-tag-container'>
                            <div className='bulk-tag-section'>
                                <input
                                    type="text"
                                    className="bulk-tag-input bulk-tag-add"
                                    placeholder="Add tag to all..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleBulkAddTag(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <span className='bulk-tag-hint'>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Add to all
                                </span>
                            </div>
                            <div className='bulk-tag-divider'></div>
                            <div className='bulk-tag-section'>
                                <input
                                    type="text"
                                    className="bulk-tag-input bulk-tag-remove"
                                    placeholder="Remove tag from all..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleBulkRemoveTag(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <span className='bulk-tag-hint bulk-tag-hint-remove'>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Remove from all
                                </span>
                            </div>
                            <span className='bulk-tag-count'>{courseList.length} {courseList.length === 1 ? 'course' : 'courses'}</span>
                        </div>
                    )}
                </div>
                
                <div className='courses-grid'>
                    {courseList.map((course, i) => (
                        <div
                            key={i}
                            className='course-card'
                            onMouseEnter={(event) => showCourseDetails(event, course)}
                        >
                            <div className='course-card-content'>
                                <Link href={`/${course.name}`} className='course-title-link' onClick={() => handleCourseClick(course)}>
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
                                        {course.topics?.reduce((a, t) => a + (t.files?.filter(f => SUPPORTED_VIDEO_EXTENSIONS.includes(f.ext)).length || 0), 0) || 0} lessons
                                    </span>
                                </div>
                                <div className='course-tags'>
                                    {getTags(course.name).map(tag => (
                                        <TagButton key={tag} course={course} tag={tag} />
                                    ))}
                                </div>
                            </div>
                            <div className='course-card-actions'>
                                <FavoriteButton course={course} />
                                <input
                                    type="text"
                                    className="tag-input"
                                    placeholder="Add tag"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addTag(course, e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <button
                                    className={`preview-btn ${course.name === previewCourse?.name ? 'active' : ''}`}
                                    aria-label={`Preview ${course.name}`}
                                    onClick={(e) => handlePreviewTap(e, course)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {mobilePreviewOpen && <div className='mobile-preview-overlay' onClick={closeMobilePreview} />}
            <div className={`preview-section ${mobilePreviewOpen ? 'mobile-open' : ''}`}>
                {previewCourse?.name ? (
                    <>
                        <div className='preview-header'>
                            <button className='mobile-preview-close' onClick={closeMobilePreview} aria-label="Close preview">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <h2>{previewCourse.name}</h2>
                            <div className='preview-stats'>
                                <div className='stat-badge'>
                                    <span className='stat-number'>{previewCourse?.topics?.length || 0}</span>
                                    <span className='stat-label'>Topics</span>
                                </div>
                                <div className='stat-badge'>
                                    <span className='stat-number'>
                                        {previewCourse?.topics?.reduce((a, t) => a + (t.files?.filter(f => SUPPORTED_VIDEO_EXTENSIONS.includes(f.ext)).length || 0), 0) || 0}
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
                                            {topic.files?.filter(f => SUPPORTED_VIDEO_EXTENSIONS.includes(f.ext)).map((f, j) => (
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
