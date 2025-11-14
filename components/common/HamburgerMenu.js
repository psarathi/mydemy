import {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import Link from 'next/link';
import AuthButton from './AuthButton';
import TagList from './TagList';
import { getUniqueTags } from '@/lib/tags/tagging';
import { addToHistory } from '@/lib/tracking/courseTracking';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [viewHistory, setViewHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [uniqueTags, setUniqueTags] = useState([]);
    const {data: session} = useSession();

    useEffect(() => {
        // Load data from localStorage
        const history = JSON.parse(localStorage.getItem('courseHistory') || '[]');
        const favs = JSON.parse(localStorage.getItem('courseFavorites') || '[]');
        const tags = getUniqueTags();
        setViewHistory(history);
        setFavorites(favs);
        setUniqueTags(tags);

        // Listen for updates
        const handleHistoryUpdate = (event) => {
            setViewHistory(event.detail.history);
        };

        const handleFavoritesUpdate = (event) => {
            setFavorites(event.detail.favorites);
        };

        const handleTagsUpdate = () => {
            setUniqueTags(getUniqueTags());
        };

        window.addEventListener('courseHistoryUpdated', handleHistoryUpdate);
        window.addEventListener('courseFavoritesUpdated', handleFavoritesUpdate);
        window.addEventListener('courseTagsUpdated', handleTagsUpdate);

        return () => {
            window.removeEventListener('courseHistoryUpdated', handleHistoryUpdate);
            window.removeEventListener('courseFavoritesUpdated', handleFavoritesUpdate);
            window.removeEventListener('courseTagsUpdated', handleTagsUpdate);
        };
    }, []);

    const handleToggleFavorite = (course) => {
        const newFavorites = favorites.some(fav => fav.name === course.name)
            ? favorites.filter(fav => fav.name !== course.name)
            : [...favorites, course];

        setFavorites(newFavorites);
        localStorage.setItem('courseFavorites', JSON.stringify(newFavorites));
    };

    const clearHistory = () => {
        setViewHistory([]);
        localStorage.removeItem('courseHistory');
    };

    const handleTagClick = (tag) => {
        // Dispatch event to notify Landing page
        window.dispatchEvent(new CustomEvent('tagClicked', { detail: { tag } }));
        // Close the menu
        setIsOpen(false);
    };

    const handleCourseClick = (course) => {
        addToHistory(course, session);
        // Close the menu when clicking on a course
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                className={`hamburger-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="hamburger-overlay" 
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Menu */}
            <div className={`hamburger-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="hamburger-header">
                    <button 
                        className="hamburger-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="hamburger-content">
                    {/* User Section */}
                    <div className="menu-section">
                        <div className="auth-section">
                            <AuthButton />
                        </div>
                    </div>

                    {/* Favorites Section */}
                    <div className="menu-section">
                        <div className="section-header">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                Favorites ({favorites.length})
                            </h4>
                        </div>
                        <div className="menu-list">
                            {favorites.length === 0 ? (
                                <div className="empty-state">
                                    <p>No favorites yet</p>
                                    <span>Mark courses as favorites to see them here</span>
                                </div>
                            ) : (
                                favorites.map((course, i) => (
                                    <div key={i} className="menu-item">
                                        <Link href={`/${course.name}`} className="menu-link" onClick={() => handleCourseClick(course)}>
                                            <div className="menu-item-content">
                                                <h5>{course.name}</h5>
                                                <span>{course.topics?.length || 0} topics</span>
                                            </div>
                                        </Link>
                                        <button
                                            className="favorite-btn active"
                                            onClick={() => handleToggleFavorite(course)}
                                            aria-label="Remove from favorites"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="menu-section">
                        <div className="section-header">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7" y2="7"></line>
                                </svg>
                                Tags ({uniqueTags.length})
                            </h4>
                        </div>
                        <div className="menu-list">
                            <TagList onTagClick={handleTagClick} />
                        </div>
                    </div>

                    {/* Recent History Section */}
                    <div className="menu-section">
                        <div className="section-header">
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                Recently Viewed ({viewHistory.length})
                            </h4>
                            {viewHistory.length > 0 && (
                                <button
                                    className="clear-btn"
                                    onClick={clearHistory}
                                    title="Clear history"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2,2h4a2,2 0 0,1,2,2v2"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="menu-list">
                            {viewHistory.length === 0 ? (
                                <div className="empty-state">
                                    <p>No recent courses</p>
                                    <span>Courses you view will appear here</span>
                                </div>
                            ) : (
                                viewHistory.slice(0, 10).map((course, i) => (
                                    <div key={i} className="menu-item">
                                        <Link href={`/${course.name}`} className="menu-link" onClick={() => handleCourseClick(course)}>
                                            <div className="menu-item-content">
                                                <h5>{course.name}</h5>
                                                <span>Viewed {new Date(course.viewedAt).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}