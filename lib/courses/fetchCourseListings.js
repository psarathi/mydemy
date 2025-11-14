const fs = require('fs').promises;
const path = require('path');
const topicNameSorter = require('./topicNameSorter');
const topicFileNameSorter = require('./topicFileNameSorter');

// Constants
const VIDEO_FILE_EXTENSIONS = new Set([
    '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv',
    '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ogv', '.ts'
]);
const EXCLUDED_DIRECTORY = '0. Websites you may like';
const MAX_CONCURRENT_OPERATIONS = 50; // Limit concurrent file system operations

// In-memory cache for directory results
const directoryCache = new Map();

/**
 * Processes promises with concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} fn - Async function to run for each item
 * @param {number} limit - Max concurrent operations
 * @returns {Promise<Array>} Results array
 */
async function processConcurrently(items, fn, limit = MAX_CONCURRENT_OPERATIONS) {
    const results = [];
    const executing = [];

    for (const [index, item] of items.entries()) {
        const promise = Promise.resolve().then(() => fn(item, index));
        results.push(promise);

        if (limit <= items.length) {
            const executing_promise = promise.then(() =>
                executing.splice(executing.indexOf(executing_promise), 1)
            );
            executing.push(executing_promise);

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(results);
}

/**
 * Gets the last modified time for a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Last modified timestamp
 */
async function getDirectoryMtime(dirPath) {
    try {
        const stats = await fs.stat(dirPath);
        return stats.mtimeMs;
    } catch (err) {
        return 0;
    }
}

/**
 * Checks if cached result is still valid
 * @param {string} dirPath - Directory path
 * @param {Object} cached - Cached object with mtime and data
 * @returns {Promise<boolean>} True if cache is valid
 */
async function isCacheValid(dirPath, cached) {
    if (!cached) return false;
    const currentMtime = await getDirectoryMtime(dirPath);
    return currentMtime === cached.mtime;
}

/**
 * Processes files and filters to only include video files
 * @param {string[]} fileNames - Array of file names to process
 * @returns {Array<{fileName: string, name: string, ext: string}>} Processed video file objects
 */
function processFiles(fileNames) {
    const fileObjects = [];

    for (const fileName of fileNames) {
        const fileInfo = path.parse(fileName);
        const fileObj = {
            fileName,
            name: fileInfo.name,
            ext: fileInfo.ext.toLowerCase(), // Normalize to lowercase for comparison
        };

        // Only include video files
        if (VIDEO_FILE_EXTENSIONS.has(fileObj.ext)) {
            fileObjects.push(fileObj);
        }
    }

    return fileObjects;
}

/**
 * Recursively collects all topics (folders with files) from a directory tree
 * @param {string} dirPath - Directory path to traverse
 * @param {string} relativePath - Relative path from course root (for nested folders)
 * @param {boolean} useCache - Whether to use caching
 * @returns {Promise<Array>} Array of topic objects found at any depth
 */
async function collectTopicsRecursively(dirPath, relativePath = '', useCache = true) {
    // Check cache first
    if (useCache && directoryCache.has(dirPath)) {
        const cached = directoryCache.get(dirPath);
        if (await isCacheValid(dirPath, cached)) {
            return cached.data;
        }
    }

    const topics = [];

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const files = items.filter((item) => item.isFile()).map((item) => item.name);
        const subDirectories = items.filter(
            (item) => item.isDirectory() && item.name !== EXCLUDED_DIRECTORY
        );

        // Process files in current directory
        const processedFiles = processFiles(files);

        // If this directory has files, create a topic for it
        if (processedFiles.length > 0) {
            const topicName = relativePath || path.basename(dirPath);
            topics.push({
                name: topicName,
                files: processedFiles,
            });
        }

        // Recursively process subdirectories with concurrency control
        const subTopicsArrays = await processConcurrently(
            subDirectories,
            async (subDir) => {
                const subDirPath = path.join(dirPath, subDir.name);
                const newRelativePath = relativePath
                    ? `${relativePath}/${subDir.name}`
                    : subDir.name;

                return await collectTopicsRecursively(subDirPath, newRelativePath, useCache);
            }
        );

        subTopicsArrays.forEach((subTopics) => topics.push(...subTopics));

        // Cache the result
        if (useCache) {
            const mtime = await getDirectoryMtime(dirPath);
            directoryCache.set(dirPath, { mtime, data: topics });
        }

    } catch (err) {
        console.error(`Error processing directory at ${dirPath}:`, err.message);
    }

    return topics;
}

/**
 * Processes a course directory and returns all topics (handles nested structures)
 * @param {string} coursePath - Path to the course directory
 * @param {string} courseName - Name of the course
 * @param {boolean} useCache - Whether to use caching
 * @returns {Promise<Array>} Array of topic objects
 */
async function processCourseTopics(coursePath, courseName, useCache = true) {
    try {
        const courseItems = await fs.readdir(coursePath, { withFileTypes: true });
        const files = courseItems.filter((item) => item.isFile()).map((item) => item.name);
        const subDirectories = courseItems.filter(
            (item) => item.isDirectory() && item.name !== EXCLUDED_DIRECTORY
        );

        // Case 1: No subdirectories (topicless course)
        if (subDirectories.length === 0) {
            const processedFiles = processFiles(files);

            // Only add topic if it has files
            if (processedFiles.length > 0) {
                return [{
                    name: courseName,
                    files: processedFiles,
                    isTopicLess: true,
                }];
            }
            return [];
        }

        // Case 2: Has subdirectories - recursively collect all topics at any depth
        const topics = await collectTopicsRecursively(coursePath, '', useCache);

        return topics;
    } catch (err) {
        console.error(`Error processing course "${courseName}" at ${coursePath}:`, err.message);
        return [];
    }
}

/**
 * Sorts course topics and files if sorting is enabled
 * @param {Array} courses - Array of course objects
 */
function sortCoursesData(courses) {
    courses.forEach((course) => {
        course.topics = course.topics.sort(topicNameSorter);
        course.topics.forEach((topic) => {
            topic.files = topic.files.sort(topicFileNameSorter);
        });
    });
}

/**
 * Validates that the directory path exists and is accessible
 * @param {string} directoryPath - Path to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
async function validateDirectoryPath(directoryPath) {
    try {
        const stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
            console.error(`Error: "${directoryPath}" is not a directory`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`Error: Cannot access directory "${directoryPath}":`, err.message);
        return false;
    }
}

/**
 * Clears the directory cache (useful for testing or forcing refresh)
 */
function clearCache() {
    directoryCache.clear();
}

/**
 * Lists directories with their topics and files
 * @param {string} directoryPath - Root directory path containing courses
 * @param {string[]} coursesToProcess - Optional array of specific course names to process
 * @param {boolean} sorted - Whether to sort topics and files in proper serial order
 * @param {boolean} logCourseDetails - Whether to log processing details to console
 * @param {boolean} useCache - Whether to use caching (default: true)
 * @returns {Promise<Array<{name: string, topics: Array}>>} Array of course objects with their topics
 */
async function listDirectoriesWithTopics(
    directoryPath,
    coursesToProcess = [],
    sorted = true,
    logCourseDetails = true,
    useCache = true
) {
    // Validate directory path
    const isValid = await validateDirectoryPath(directoryPath);
    if (!isValid) {
        return [];
    }

    try {
        let items = await fs.readdir(directoryPath, { withFileTypes: true });

        // Filter courses if specific ones are requested
        if (coursesToProcess.length > 0) {
            items = items.filter((item) => coursesToProcess.includes(item.name));
        }

        // Filter to only course directories
        const courseDirectories = items.filter(
            (item) => item.isDirectory() && item.name !== EXCLUDED_DIRECTORY
        );

        // Process all courses with concurrency control
        const courses = await processConcurrently(
            courseDirectories,
            async (courseItem) => {
                const courseName = courseItem.name;
                const coursePath = path.join(directoryPath, courseName);

                // Check cache for course
                let topics;
                if (useCache && directoryCache.has(coursePath)) {
                    const cached = directoryCache.get(coursePath);
                    if (await isCacheValid(coursePath, cached)) {
                        topics = cached.data;
                        if (logCourseDetails) {
                            console.log(
                                `processing course: ${courseName} topics found: ${topics.length} (cached)`
                            );
                        }
                        return {
                            name: courseName,
                            topics,
                        };
                    }
                }

                // Not cached or cache invalid, process the course
                topics = await processCourseTopics(coursePath, courseName, useCache);

                // Cache the result
                if (useCache) {
                    const mtime = await getDirectoryMtime(coursePath);
                    directoryCache.set(coursePath, { mtime, data: topics });
                }

                if (logCourseDetails) {
                    console.log(
                        `processing course: ${courseName} topics found: ${topics.length}`
                    );
                }

                return {
                    name: courseName,
                    topics,
                };
            }
        );

        // Filter out courses with no topics
        const coursesWithTopics = courses.filter((course) => course.topics.length > 0);

        // Sort if requested
        if (sorted) {
            sortCoursesData(coursesWithTopics);
        }

        return coursesWithTopics;
    } catch (err) {
        console.error(`Error reading directory "${directoryPath}":`, err.message);
        return [];
    }
}

module.exports = listDirectoriesWithTopics;
module.exports.clearCache = clearCache;
