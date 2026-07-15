// Course tracking utilities
import {getUserScopedStorageKey} from './pinAuth';

const LEARNING_PLAYLIST_KEY = 'learningPlaylist';
const LEGACY_LESSON_PROGRESS_KEY = 'lessonProgress';
const LESSON_PROGRESS_KEY = 'mydemyLessonProgress:v1';
const ANNOTATIONS_KEY = 'mydemyLessonAnnotations:v1';

const readJsonArray = (key) => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(getUserScopedStorageKey(key)) || '[]');
};

const readJsonObject = (key) => {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(getUserScopedStorageKey(key)) || '{}');
};

const writeLessonProgress = (progress) => {
    localStorage.setItem(getUserScopedStorageKey(LESSON_PROGRESS_KEY), JSON.stringify(progress));
    window.dispatchEvent(
        new CustomEvent('lessonProgressUpdated', {
            detail: {progress},
        })
    );
};

const readAnnotationStore = () => readJsonObject(ANNOTATIONS_KEY);

const writeAnnotationStore = (store) => {
    localStorage.setItem(getUserScopedStorageKey(ANNOTATIONS_KEY), JSON.stringify(store));
    window.dispatchEvent(
        new CustomEvent('lessonAnnotationsUpdated', {
            detail: {annotations: store},
        })
    );
};

export const getLessonKey = (courseName, topicName, lessonName) =>
    [courseName, topicName, lessonName].filter(Boolean).join('::');

export const addToHistory = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const history = readJsonArray('courseHistory');
    const filteredHistory = history.filter((item) => item.name !== course.name);
    const newHistory = [
        {
            ...course,
            viewedAt: new Date().toISOString(),
        },
        ...filteredHistory,
    ];
    const trimmedHistory = newHistory.slice(0, 50);

    localStorage.setItem(getUserScopedStorageKey('courseHistory'), JSON.stringify(trimmedHistory));
    window.dispatchEvent(
        new CustomEvent('courseHistoryUpdated', {
            detail: {course, history: trimmedHistory},
        })
    );
};

export const getHistory = () => {
    return readJsonArray('courseHistory');
};

export const clearHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getUserScopedStorageKey('courseHistory'));
    window.dispatchEvent(
        new CustomEvent('courseHistoryUpdated', {
            detail: {history: []},
        })
    );
};

export const toggleFavorite = (course, session = null) => {
    if (typeof window === 'undefined') return;

    const favorites = readJsonArray('courseFavorites');
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

    localStorage.setItem(getUserScopedStorageKey('courseFavorites'), JSON.stringify(newFavorites));
    window.dispatchEvent(
        new CustomEvent('courseFavoritesUpdated', {
            detail: {course, favorites: newFavorites, isFavorite: !isFavorite},
        })
    );

    return !isFavorite;
};

export const getFavorites = () => {
    return readJsonArray('courseFavorites');
};

export const isFavorite = (courseName) => {
    if (typeof window === 'undefined') return false;
    const favorites = readJsonArray('courseFavorites');
    return favorites.some((fav) => fav.name === courseName);
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
    if (typeof window === 'undefined' || !courseName || !lessonName) {
        return null;
    }

    const progress = getLessonProgress();
    const key = getLessonKey(courseName, topicName, lessonName);
    const normalizedDuration = Number.isFinite(duration)
        ? Math.max(duration, 0)
        : 0;
    const normalizedTime = Number.isFinite(currentTime)
        ? Math.max(currentTime, 0)
        : 0;
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
    const lessons =
        course.topics?.flatMap((topic) =>
            (topic.files || []).map((file) => ({
                topicName: topic.name,
                lessonName: file.name,
                entry:
                    progress[getLessonKey(course.name, topic.name, file.name)] ||
                    null,
            }))
        ) || [];
    const completedLessons = lessons.filter(
        (lesson) => lesson.entry?.completed
    ).length;
    const activeLesson =
        lessons
            .map((lesson) => lesson.entry)
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] ||
        null;

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

const writeLearningPlaylist = (playlist) => {
    localStorage.setItem(getUserScopedStorageKey(LEARNING_PLAYLIST_KEY), JSON.stringify(playlist));
    window.dispatchEvent(new CustomEvent('learningPlaylistUpdated', {
        detail: {playlist}
    }));
};

export const getLearningPlaylist = () => {
    return readJsonArray(LEARNING_PLAYLIST_KEY);
};

export const getPlaylistLessonId = (courseName, topicName, lessonName) =>
    getLessonKey(courseName, topicName, lessonName);

export const isLessonInPlaylist = (courseName, topicName, lessonName, playlistOverride = null) => {
    const playlist = playlistOverride || getLearningPlaylist();
    const lessonId = getPlaylistLessonId(courseName, topicName, lessonName);
    return playlist.some((item) => item.id === lessonId);
};

export const addLessonToPlaylist = ({courseName, topicName, lessonName, filePath}) => {
    if (typeof window === 'undefined' || !courseName || !lessonName) return null;

    const playlist = getLearningPlaylist();
    const lessonId = getPlaylistLessonId(courseName, topicName, lessonName);
    const existingItem = playlist.find((item) => item.id === lessonId);

    if (existingItem) {
        return existingItem;
    }

    const item = {
        id: lessonId,
        courseName,
        topicName,
        lessonName,
        filePath,
        addedAt: new Date().toISOString(),
    };

    writeLearningPlaylist([...playlist, item]);
    return item;
};

export const removeLessonFromPlaylist = (lessonId) => {
    if (typeof window === 'undefined' || !lessonId) return [];

    const playlist = getLearningPlaylist();
    const updatedPlaylist = playlist.filter((item) => item.id !== lessonId);
    writeLearningPlaylist(updatedPlaylist);
    return updatedPlaylist;
};

export const movePlaylistLesson = (lessonId, direction) => {
    if (typeof window === 'undefined' || !lessonId) return [];

    const playlist = getLearningPlaylist();
    const currentIndex = playlist.findIndex((item) => item.id === lessonId);
    const offset = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    const nextIndex = currentIndex + offset;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= playlist.length) {
        return playlist;
    }

    const updatedPlaylist = [...playlist];
    const [item] = updatedPlaylist.splice(currentIndex, 1);
    updatedPlaylist.splice(nextIndex, 0, item);
    writeLearningPlaylist(updatedPlaylist);
    return updatedPlaylist;
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
