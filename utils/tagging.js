// Utility functions for managing course tags in localStorage

/**
 * Add tags to a course
 * @param {string} courseName - Name of the course
 * @param {string[]} tags - Array of tag strings to add
 * @returns {string[]} Updated array of tags for the course
 */
export function addTags(courseName, tags) {
  if (typeof window === 'undefined') return [];

  const courseTags = getCourseTags();
  const normalizedTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);

  // Get existing tags or initialize empty array
  const existingTags = courseTags[courseName] || [];

  // Merge and deduplicate tags
  const updatedTags = [...new Set([...existingTags, ...normalizedTags])];

  // Update storage
  courseTags[courseName] = updatedTags;
  localStorage.setItem('courseTags', JSON.stringify(courseTags));

  // Dispatch event for components to listen
  window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
    detail: { courseName, tags: updatedTags }
  }));

  return updatedTags;
}

/**
 * Remove tags from a course
 * @param {string} courseName - Name of the course
 * @param {string[]} tags - Array of tag strings to remove
 * @returns {string[]} Updated array of tags for the course
 */
export function removeTags(courseName, tags) {
  if (typeof window === 'undefined') return [];

  const courseTags = getCourseTags();
  const normalizedTags = tags.map(tag => tag.trim().toLowerCase());

  if (!courseTags[courseName]) {
    return [];
  }

  // Filter out removed tags
  const updatedTags = courseTags[courseName].filter(
    tag => !normalizedTags.includes(tag)
  );

  if (updatedTags.length === 0) {
    // Remove course entry if no tags left
    delete courseTags[courseName];
  } else {
    courseTags[courseName] = updatedTags;
  }

  localStorage.setItem('courseTags', JSON.stringify(courseTags));

  // Dispatch event
  window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
    detail: { courseName, tags: updatedTags }
  }));

  return updatedTags;
}

/**
 * Get all tags for a specific course
 * @param {string} courseName - Name of the course
 * @returns {string[]} Array of tags for the course
 */
export function getTagsForCourse(courseName) {
  if (typeof window === 'undefined') return [];

  const courseTags = getCourseTags();
  return courseTags[courseName] || [];
}

/**
 * Get all course tags from localStorage
 * @returns {Object} Object mapping course names to tag arrays
 */
export function getCourseTags() {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem('courseTags');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error parsing course tags:', error);
    return {};
  }
}

/**
 * Get all unique tags across all courses
 * @returns {string[]} Sorted array of all unique tags
 */
export function getAllTags() {
  if (typeof window === 'undefined') return [];

  const courseTags = getCourseTags();
  const allTags = new Set();

  Object.values(courseTags).forEach(tags => {
    tags.forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Get all courses that have a specific tag
 * @param {string} tag - Tag to search for
 * @returns {string[]} Array of course names with the tag
 */
export function getCoursesByTag(tag) {
  if (typeof window === 'undefined') return [];

  const courseTags = getCourseTags();
  const normalizedTag = tag.trim().toLowerCase();
  const matchingCourses = [];

  Object.entries(courseTags).forEach(([courseName, tags]) => {
    if (tags.includes(normalizedTag)) {
      matchingCourses.push(courseName);
    }
  });

  return matchingCourses;
}

/**
 * Clear all tags for a specific course
 * @param {string} courseName - Name of the course
 */
export function clearCourseTags(courseName) {
  if (typeof window === 'undefined') return;

  const courseTags = getCourseTags();
  delete courseTags[courseName];

  localStorage.setItem('courseTags', JSON.stringify(courseTags));

  // Dispatch event
  window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
    detail: { courseName, tags: [] }
  }));
}

/**
 * Clear all tags from all courses
 */
export function clearAllTags() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('courseTags');

  // Dispatch event
  window.dispatchEvent(new CustomEvent('courseTagsUpdated', {
    detail: { courseName: null, tags: [] }
  }));
}
