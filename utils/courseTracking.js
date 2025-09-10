// Course tracking utilities
export const addToHistory = (course, session = null) => {
    if (typeof window === 'undefined' || !session) return;
    
    const history = JSON.parse(localStorage.getItem('courseHistory') || '[]');
    
    // Remove existing entry if it exists
    const filteredHistory = history.filter(item => item.name !== course.name);
    
    // Add to beginning with current timestamp
    const newHistory = [{
        ...course,
        viewedAt: new Date().toISOString()
    }, ...filteredHistory];
    
    // Keep only last 50 items
    const trimmedHistory = newHistory.slice(0, 50);
    
    localStorage.setItem('courseHistory', JSON.stringify(trimmedHistory));
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('courseHistoryUpdated', { 
        detail: { course, history: trimmedHistory }
    }));
};

export const getHistory = () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('courseHistory') || '[]');
};

export const toggleFavorite = (course, session = null) => {
    if (typeof window === 'undefined' || !session) return;
    
    const favorites = JSON.parse(localStorage.getItem('courseFavorites') || '[]');
    const isFavorite = favorites.some(fav => fav.name === course.name);
    
    let newFavorites;
    if (isFavorite) {
        newFavorites = favorites.filter(fav => fav.name !== course.name);
    } else {
        newFavorites = [...favorites, {
            ...course,
            favoritedAt: new Date().toISOString()
        }];
    }
    
    localStorage.setItem('courseFavorites', JSON.stringify(newFavorites));
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('courseFavoritesUpdated', { 
        detail: { course, favorites: newFavorites, isFavorite: !isFavorite }
    }));
    
    return !isFavorite;
};

export const getFavorites = () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('courseFavorites') || '[]');
};

export const isFavorite = (courseName) => {
    if (typeof window === 'undefined') return false;
    const favorites = JSON.parse(localStorage.getItem('courseFavorites') || '[]');
    return favorites.some(fav => fav.name === courseName);
};