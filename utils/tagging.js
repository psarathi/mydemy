// Tagging utilities
import {getUserScopedStorageKey} from './pinAuth';

const COURSE_TAGS_KEY = 'courseTags';

export const addTag = (course, tag) => {
    if (typeof window === 'undefined' || !tag || tag.trim() === '') return;

    const courseName = course.name;
    const normalizedTag = tag.toLowerCase().trim();
    const allTags = getAllTags();

    if (!allTags[courseName]) {
        allTags[courseName] = [];
    }

    if (!allTags[courseName].includes(normalizedTag)) {
        allTags[courseName].push(normalizedTag);
        localStorage.setItem(getUserScopedStorageKey(COURSE_TAGS_KEY), JSON.stringify(allTags));
        window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
            detail: { courseName, tags: allTags[courseName], allTags: allTags }
        }));
    }
};

export const removeTag = (course, tag) => {
    if (typeof window === 'undefined' || !tag || tag.trim() === '') return;

    const courseName = course.name;
    const normalizedTag = tag.toLowerCase().trim();
    const allTags = getAllTags();

    if (allTags[courseName]) {
        const initialLength = allTags[courseName].length;
        allTags[courseName] = allTags[courseName].filter(t => t !== normalizedTag);

        if (allTags[courseName].length === 0) {
            delete allTags[courseName];
        }

        if (initialLength !== (allTags[courseName] ? allTags[courseName].length : 0)) {
            localStorage.setItem(getUserScopedStorageKey(COURSE_TAGS_KEY), JSON.stringify(allTags));
            window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
                detail: { courseName, tags: allTags[courseName] || [], allTags: allTags }
            }));
        }
    }
};

export const getTags = (courseName) => {
    if (typeof window === 'undefined') return [];
    const allTags = getAllTags();
    return allTags[courseName] || [];
};

export const getAllTags = () => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(getUserScopedStorageKey(COURSE_TAGS_KEY));
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error parsing course tags:', error);
        return {};
    }
};

export const getUniqueTags = () => {
    const allTags = getAllTags();
    const uniqueTags = new Set();
    for (const courseName in allTags) {
        if (Array.isArray(allTags[courseName])) {
            allTags[courseName].forEach(tag => uniqueTags.add(tag));
        }
    }
    return Array.from(uniqueTags).sort();
};

export const getCoursesByTag = (tag) => {
    if (typeof window === 'undefined' || !tag || tag.trim() === '') return [];
    const normalizedTag = tag.toLowerCase().trim();
    const allTags = getAllTags();
    const coursesWithTag = [];
    for (const courseName in allTags) {
        if (allTags[courseName].includes(normalizedTag)) {
            coursesWithTag.push(courseName);
        }
    }
    return coursesWithTag;
};

export const clearCourseTags = (courseName) => {
    if (typeof window === 'undefined' || !courseName) return;
    const allTags = getAllTags();
    if (allTags[courseName]) {
        delete allTags[courseName];
        localStorage.setItem(getUserScopedStorageKey(COURSE_TAGS_KEY), JSON.stringify(allTags));
        window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
            detail: { courseName, tags: [], allTags: allTags }
        }));
    }
};

export const getTagCounts = () => {
    const allTags = getAllTags();
    const counts = {};
    for (const courseName in allTags) {
        allTags[courseName].forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
    }
    return Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
};

export const clearAllTags = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getUserScopedStorageKey(COURSE_TAGS_KEY));
    window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
        detail: { allTags: {} }
    }));
};
