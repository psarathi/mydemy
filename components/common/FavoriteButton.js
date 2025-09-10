import {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {toggleFavorite, isFavorite} from '../../utils/courseTracking';

export default function FavoriteButton({course, className = ''}) {
    const [isCourseFavorite, setIsCourseFavorite] = useState(false);
    const {data: session} = useSession();

    useEffect(() => {
        if (session) {
            setIsCourseFavorite(isFavorite(course.name));

            // Listen for favorite updates
            const handleFavoriteUpdate = (event) => {
                if (event.detail.course.name === course.name) {
                    setIsCourseFavorite(event.detail.isFavorite);
                }
            };

            window.addEventListener('courseFavoritesUpdated', handleFavoriteUpdate);
            return () => window.removeEventListener('courseFavoritesUpdated', handleFavoriteUpdate);
        }
    }, [course.name, session]);

    const handleToggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!session) {
            // Could show a tooltip or redirect to sign in
            return;
        }
        
        toggleFavorite(course);
    };

    // Don't render the button if user is not logged in
    if (!session) {
        return null;
    }

    return (
        <button
            className={`favorite-btn ${isCourseFavorite ? 'active' : ''} ${className}`}
            onClick={handleToggleFavorite}
            aria-label={isCourseFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isCourseFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill={isCourseFavorite ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                strokeWidth="2"
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        </button>
    );
}