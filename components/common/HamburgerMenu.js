import {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import AuthButton from './AuthButton';
import FavoriteButton from './FavoriteButton';
import styles from '../../styles/modules/HamburgerMenu.module.css';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [viewHistory, setViewHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const {data: session} = useSession();

    useEffect(() => {
        // Load data from localStorage
        const history = JSON.parse(localStorage.getItem('courseHistory') || '[]');
        const favs = JSON.parse(localStorage.getItem('courseFavorites') || '[]');
        setViewHistory(history);
        setFavorites(favs);

        // Listen for updates
        const handleHistoryUpdate = (event) => {
            setViewHistory(event.detail.history);
        };

        const handleFavoritesUpdate = (event) => {
            setFavorites(event.detail.favorites);
        };

        window.addEventListener('courseHistoryUpdated', handleHistoryUpdate);
        window.addEventListener('courseFavoritesUpdated', handleFavoritesUpdate);

        return () => {
            window.removeEventListener('courseHistoryUpdated', handleHistoryUpdate);
            window.removeEventListener('courseFavoritesUpdated', handleFavoritesUpdate);
        };
    }, []);

    const clearHistory = () => {
        setViewHistory([]);
        localStorage.removeItem('courseHistory');
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                className={`${styles.btn} ${isOpen ? styles.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <span className={styles.line}></span>
                <span className={styles.line}></span>
                <span className={styles.line}></span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Menu */}
            <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <button
                        className={styles.close}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* User Section */}
                    <div className={styles.menuSection}>
                        <div className={styles.authSection}>
                            <AuthButton />
                        </div>
                    </div>

                    {/* Favorites Section */}
                    <div className={styles.menuSection}>
                        <div className={styles.sectionHeader}>
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                Favorites ({favorites.length})
                            </h4>
                        </div>
                        <div className={styles.menuList}>
                            {favorites.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>No favorites yet</p>
                                    <span>Mark courses as favorites to see them here</span>
                                </div>
                            ) : (
                                favorites.map((course, i) => (
                                    <div key={i} className={styles.menuItem}>
                                        <a href={`/${course.name}`} className={styles.menuLink}>
                                            <div className={styles.menuItemContent}>
                                                <h5>{course.name}</h5>
                                                <span>{course.topics?.length || 0} topics</span>
                                            </div>
                                        </a>
                                        <FavoriteButton course={course} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent History Section */}
                    <div className={styles.menuSection}>
                        <div className={styles.sectionHeader}>
                            <h4>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12,6 12,12 16,14"></polyline>
                                </svg>
                                Recently Viewed ({viewHistory.length})
                            </h4>
                            {viewHistory.length > 0 && (
                                <button
                                    className={styles.clearBtn}
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
                        <div className={styles.menuList}>
                            {viewHistory.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>No recent courses</p>
                                    <span>Courses you view will appear here</span>
                                </div>
                            ) : (
                                viewHistory.slice(0, 10).map((course, i) => (
                                    <div key={i} className={styles.menuItem}>
                                        <a href={`/${course.name}`} className={styles.menuLink}>
                                            <div className={styles.menuItemContent}>
                                                <h5>{course.name}</h5>
                                                <span>Viewed {new Date(course.viewedAt).toLocaleDateString()}</span>
                                            </div>
                                        </a>
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
