import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthButton from './AuthButton';
import TagList from './TagList';
import { getUniqueTags } from '../../utils/tagging';
import { addToHistory } from '../../utils/courseTracking';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [viewHistory, setViewHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [uniqueTags, setUniqueTags] = useState([]);
    const { data: session } = useSession();
    const router = useRouter();

    // Check if we are on desktop
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        // Close the menu on mobile
        if (!isDesktop) setIsOpen(false);
    };

    const handleCourseClick = (course) => {
        addToHistory(course, session);
        // Close the menu on mobile
        if (!isDesktop) setIsOpen(false);
    };

    const isActive = (path) => {
        return router.pathname === path ? 'active' : '';
    };

    return (
        <>
            {/* Mobile Hamburger Button */}
            {!isDesktop && (
                <button
                    className={`hamburger-btn ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            )}

            {/* Mobile Overlay */}
            {!isDesktop && isOpen && (
                <div
                    className="hamburger-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar (Permanent on Desktop, Drawer on Mobile) */}
            <aside className={`modern-permanent-sidebar ${!isDesktop && !isOpen ? 'mobile-hidden' : ''} glass-sidebar`}>
                <div className="sidebar-header">
                    <Link href="/" className="sidebar-brand-link">
                        <div className="sidebar-brand">
                            <span className="brand-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                            </span>
                            <h3>Mydemy</h3>
                        </div>
                    </Link>
                    {!isDesktop && (
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
                    )}
                </div>

                <div className="sidebar-content-scroll">
                    {/* Primary Navigation */}
                    <nav className="sidebar-nav">
                        <Link href="/" className={`sidebar-nav-item ${isActive('/')}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <span>Home</span>
                        </Link>
                        <div className="sidebar-nav-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span>Dashboard</span>
                        </div>
                        <div className="sidebar-nav-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            <span>My Courses</span>
                        </div>
                        <div className="sidebar-nav-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>Settings</span>
                        </div>
                    </nav>

                    <div className="sidebar-divider"></div>

                    {/* Tags Section */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <h4>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7" y2="7"></line>
                                </svg>
                                Explore Tags
                            </h4>
                        </div>
                        <div className="sidebar-tag-list">
                            <TagList onTagClick={handleTagClick} />
                        </div>
                    </div>

                    <div className="sidebar-divider"></div>

                    {/* Favorites Section */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <h4>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                Favorites
                            </h4>
                        </div>
                        <div className="sidebar-list">
                            {favorites.length === 0 ? (
                                <div className="sidebar-empty-state">
                                    <p>No favorites yet</p>
                                </div>
                            ) : (
                                favorites.map((course, i) => (
                                    <div key={i} className="sidebar-list-item">
                                        <Link href={`/${course.name}`} className="sidebar-link" onClick={() => handleCourseClick(course)}>
                                            <div className="sidebar-item-content">
                                                <h5 className="truncate">{course.name}</h5>
                                            </div>
                                        </Link>
                                        <button
                                            className="sidebar-action-btn active"
                                            onClick={() => handleToggleFavorite(course)}
                                            aria-label="Remove from favorites"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="sidebar-divider"></div>

                    {/* Recent History Section */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <h4>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                Recent
                            </h4>
                            {viewHistory.length > 0 && (
                                <button
                                    className="sidebar-clear-btn"
                                    onClick={clearHistory}
                                    title="Clear history"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="sidebar-list">
                            {viewHistory.length === 0 ? (
                                <div className="sidebar-empty-state">
                                    <p>No recent courses</p>
                                </div>
                            ) : (
                                viewHistory.slice(0, 5).map((course, i) => (
                                    <div key={i} className="sidebar-list-item">
                                        <Link href={`/${course.name}`} className="sidebar-link" onClick={() => handleCourseClick(course)}>
                                            <div className="sidebar-item-content">
                                                <h5 className="truncate">{course.name}</h5>
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer with Auth */}
                <div className="sidebar-footer">
                    <AuthButton />
                </div>
            </aside>
        </>
    );
}