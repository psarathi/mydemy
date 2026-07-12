// Course tracking utilities
const LEGACY_LESSON_PROGRESS_KEY = 'lessonProgress';
const LESSON_PROGRESS_KEY = 'mydemyLessonProgress:v1';

const readJsonArray = (key) => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(key) || '[]');
};

const readJsonObject = (key) => {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(key) || '{}');
};

const writeLessonProgress = (progress) => {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
        detail: {progress}
    }));
};

export const getLessonKey = (courseName, topicName, lessonName) =>
    [courseName, topicName, lessonName].filter(Boolean).join('::');

export const addToHistory = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const history = readJsonArray('courseHistory');

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
    return readJsonArray('courseHistory');
};

export const toggleFavorite = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const favorites = readJsonArray('courseFavorites');
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
    return readJsonArray('courseFavorites');
};

export const isFavorite = (courseName) => {
    if (typeof window === 'undefined') return false;
    const favorites = readJsonArray('courseFavorites');
    return favorites.some(fav => fav.name === courseName);
};

export const getLessonProgress = () => {
    const progress = readJsonObject(LESSON_PROGRESS_KEY);
    if (Object.keys(progress).length > 0 || typeof window === 'undefined') {
        return progress;
    }

    return readJsonObject(LEGACY_LESSON_PROGRESS_KEY);
};

export const getLessonProgressEntry = (courseName, topicName, lessonName) => {
    const progress = getLessonProgress();
    return progress[getLessonKey(courseName, topicName, lessonName)] || null;
};

export const saveLessonProgress = ({
    courseName,
    topicName,
    lessonName,
    currentTime = 0,
    duration = 0,
}) => {
    if (typeof window === 'undefined' || !courseName || !lessonName) return null;

    const progress = getLessonProgress();
    const key = getLessonKey(courseName, topicName, lessonName);
    const normalizedDuration = Number.isFinite(duration) ? Math.max(duration, 0) : 0;
    const normalizedTime = Number.isFinite(currentTime) ? Math.max(currentTime, 0) : 0;
    const completionThreshold = normalizedDuration
        ? Math.min(normalizedDuration * 0.9, normalizedDuration - 30)
        : Infinity;
    const existingEntry = progress[key] || {};

    const entry = {
        courseName,
        topicName,
        lessonName,
        currentTime: Math.round(normalizedTime),
        duration: Math.round(normalizedDuration),
        completed: existingEntry.completed || normalizedTime >= completionThreshold,
        updatedAt: new Date().toISOString(),
    };

    progress[key] = entry;
    writeLessonProgress(progress);
    return entry;
};

export const getCourseProgressSummary = (course, progressOverride = null) => {
    if (!course) {
        return {
            completedLessons: 0,
            totalLessons: 0,
            percentComplete: 0,
            activeLesson: null,
        };
    }

    const progress = progressOverride || getLessonProgress();
    const lessons = course.topics?.flatMap(topic =>
        (topic.files || []).map(file => ({
            topicName: topic.name,
            lessonName: file.name,
            entry: progress[getLessonKey(course.name, topic.name, file.name)] || null,
        }))
    ) || [];
    const completedLessons = lessons.filter(lesson => lesson.entry?.completed).length;
    const activeLesson = lessons
        .map(lesson => lesson.entry)
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

    return {
        completedLessons,
        totalLessons: lessons.length,
        percentComplete: lessons.length
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0,
        activeLesson,
    };
};

export const getCourseResumeUrl = (courseName, activeLesson) => {
    if (!courseName || !activeLesson) return `/${courseName || ''}`;

    return {
        pathname: `/${courseName}`,
        query: {
            topic: activeLesson.topicName,
            lesson: activeLesson.lessonName,
        },
    };
};

export const formatProgressTime = (seconds = 0) => {
    const safeSeconds = Math.max(Math.round(seconds), 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = `${safeSeconds % 60}`.padStart(2, '0');
    return `${minutes}:${remainder}`;
};
