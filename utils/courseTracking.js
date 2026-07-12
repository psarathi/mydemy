// Course tracking utilities
export const addToHistory = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const history = JSON.parse(localStorage.getItem('courseHistory') || '[]');

    // Remove existing entry if it exists
    const filteredHistory = history.filter((item) => item.name !== course.name);

    // Add to beginning with current timestamp
    const newHistory = [
        {
            ...course,
            viewedAt: new Date().toISOString(),
        },
        ...filteredHistory,
    ];

    // Keep only last 50 items
    const trimmedHistory = newHistory.slice(0, 50);

    localStorage.setItem('courseHistory', JSON.stringify(trimmedHistory));

    // Dispatch custom event for components to listen to
    window.dispatchEvent(
        new CustomEvent('courseHistoryUpdated', {
            detail: {course, history: trimmedHistory},
        })
    );
};

export const getHistory = () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('courseHistory') || '[]');
};

export const toggleFavorite = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const favorites = JSON.parse(
        localStorage.getItem('courseFavorites') || '[]'
    );
    const isFavorite = favorites.some((fav) => fav.name === course.name);

    let newFavorites;
    if (isFavorite) {
        newFavorites = favorites.filter((fav) => fav.name !== course.name);
    } else {
        newFavorites = [
            ...favorites,
            {
                ...course,
                favoritedAt: new Date().toISOString(),
            },
        ];
    }

    localStorage.setItem('courseFavorites', JSON.stringify(newFavorites));

    // Dispatch custom event for components to listen to
    window.dispatchEvent(
        new CustomEvent('courseFavoritesUpdated', {
            detail: {course, favorites: newFavorites, isFavorite: !isFavorite},
        })
    );

    return !isFavorite;
};

export const getFavorites = () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('courseFavorites') || '[]');
};

export const isFavorite = (courseName) => {
    if (typeof window === 'undefined') return false;
    const favorites = JSON.parse(
        localStorage.getItem('courseFavorites') || '[]'
    );
    return favorites.some((fav) => fav.name === courseName);
};

const ANNOTATIONS_KEY = 'mydemyLessonAnnotations:v1';

const readAnnotationStore = () => {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(ANNOTATIONS_KEY) || '{}');
    } catch (error) {
        return {};
    }
};

const writeAnnotationStore = (store) => {
    localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(store));
    window.dispatchEvent(
        new CustomEvent('lessonAnnotationsUpdated', {
            detail: {annotations: store},
        })
    );
};

export const getLessonAnnotationKey = (courseName, lessonPath) =>
    `${courseName || 'unknown-course'}::${lessonPath || 'unknown-lesson'}`;

export const getLessonAnnotations = (courseName, lessonPath) => {
    const store = readAnnotationStore();
    const key = getLessonAnnotationKey(courseName, lessonPath);
    return [...(store[key] || [])].sort(
        (a, b) => a.timeSeconds - b.timeSeconds
    );
};

export const saveLessonAnnotation = (courseName, lessonPath, annotation) => {
    if (typeof window === 'undefined') return null;
    const store = readAnnotationStore();
    const key = getLessonAnnotationKey(courseName, lessonPath);
    const now = new Date().toISOString();
    const existing = store[key] || [];
    const saved = {
        id:
            annotation.id ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: annotation.type === 'note' ? 'note' : 'bookmark',
        timeSeconds: Math.max(
            0,
            Math.floor(Number(annotation.timeSeconds) || 0)
        ),
        text: annotation.text || '',
        createdAt: annotation.createdAt || now,
        updatedAt: now,
    };
    store[key] = [
        ...existing.filter((item) => item.id !== saved.id),
        saved,
    ].sort((a, b) => a.timeSeconds - b.timeSeconds);
    writeAnnotationStore(store);
    return saved;
};

export const deleteLessonAnnotation = (
    courseName,
    lessonPath,
    annotationId
) => {
    if (typeof window === 'undefined') return [];
    const store = readAnnotationStore();
    const key = getLessonAnnotationKey(courseName, lessonPath);
    store[key] = (store[key] || []).filter((item) => item.id !== annotationId);
    writeAnnotationStore(store);
    return store[key];
};
