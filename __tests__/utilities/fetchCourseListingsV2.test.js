const fs = require('fs').promises;
const path = require('path');
const listDirectoriesWithTopics = require('../../utilities/fetchCourseListingsV2');

// Mock dependencies
jest.mock('fs', () => ({
    promises: {
        readdir: jest.fn()
    }
}));
jest.mock('path');
jest.mock('../../utilities/topicNameSorter');
jest.mock('../../utilities/topicFileNameSorter');

const mockFs = fs;
const mockPath = path;
const mockTopicNameSorter = require('../../utilities/topicNameSorter');
const mockTopicFileNameSorter = require('../../utilities/topicFileNameSorter');

describe('listDirectoriesWithTopics', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        
        // Mock path methods
        mockPath.join.mockImplementation((...args) => args.join('/'));
        mockPath.parse.mockImplementation((filePath) => {
            const fileName = filePath.split('/').pop();
            const dotIndex = fileName.lastIndexOf('.');
            const name = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
            const ext = dotIndex > 0 ? fileName.substring(dotIndex) : '';
            return {
                name: name,
                ext: ext
            };
        });

        // Mock sorter functions
        mockTopicNameSorter.mockImplementation((a, b) => a.name.localeCompare(b.name));
        mockTopicFileNameSorter.mockImplementation((a, b) => a.name.localeCompare(b.name));
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test('processes course with topics structure', async () => {
        const testPath = '/courses';
        
        // Mock directory structure: /courses/Course1/Topic1/video.mp4
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false }
            ]) // Root directory
            .mockResolvedValueOnce([
                { name: 'Topic1', isDirectory: () => true, isFile: () => false }
            ]) // Course directory
            .mockResolvedValueOnce(['video.mp4', 'video.srt']); // Topic directory

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Course1');
        expect(result[0].topics).toHaveLength(1);
        expect(result[0].topics[0].name).toBe('Topic1');
        expect(result[0].topics[0].files).toHaveLength(2);
    });

    test('processes course without topics (topicless structure)', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'video.mp4', isDirectory: () => false, isFile: () => true },
                { name: 'video.srt', isDirectory: () => false, isFile: () => true }
            ]);

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Course1');
        expect(result[0].topics).toHaveLength(1);
        expect(result[0].topics[0].isTopicLess).toBe(true);
        expect(result[0].topics[0].files).toHaveLength(2);
    });

    test('filters courses by coursesToProcess array', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false },
                { name: 'Course2', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'video.mp4', isDirectory: () => false, isFile: () => true }
            ]);

        const result = await listDirectoriesWithTopics(testPath, ['Course1'], false, false);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Course1');
    });

    test('ignores unnecessary file extensions', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'video.mp4', isDirectory: () => false, isFile: () => true },
                { name: 'unwanted.url', isDirectory: () => false, isFile: () => true },
                { name: '.DS_Store', isDirectory: () => false, isFile: () => true },
                { name: 'noextension', isDirectory: () => false, isFile: () => true }
            ]);

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result[0].topics[0].files).toHaveLength(1);
        expect(result[0].topics[0].files[0].fileName).toBe('video.mp4');
    });

    test('ignores "0. Websites you may like" directories', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false },
                { name: '0. Websites you may like', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'Topic1', isDirectory: () => true, isFile: () => false },
                { name: '0. Websites you may like', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce(['video.mp4']);

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Course1');
        expect(result[0].topics).toHaveLength(1);
        expect(result[0].topics[0].name).toBe('Topic1');
    });

    test('sorts topics and files when sorted=true', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'Topic2', isDirectory: () => true, isFile: () => false },
                { name: 'Topic1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce(['video2.mp4'])
            .mockResolvedValueOnce(['video1.mp4']);

        const result = await listDirectoriesWithTopics(testPath, [], true, false);

        // Verify that sorting functions would be called (we have topics and files to sort)
        expect(result).toHaveLength(1);
        expect(result[0].topics).toHaveLength(2);
    });

    test('logs course details when logCourseDetails=true', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'Course1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'video.mp4', isDirectory: () => false, isFile: () => true }
            ]);

        await listDirectoriesWithTopics(testPath, [], false, true);

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('processing course: Course1')
        );
    });

    test('handles errors gracefully', async () => {
        const testPath = '/invalid/path';
        const error = new Error('Directory not found');
        mockFs.readdir.mockRejectedValueOnce(error);

        const result = await listDirectoriesWithTopics(testPath);

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });

    test('handles empty directory', async () => {
        const testPath = '/courses';
        
        mockFs.readdir.mockResolvedValueOnce([]);

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result).toEqual([]);
    });

    test('processes multiple courses with mixed structures', async () => {
        const testPath = '/courses';
        
        mockFs.readdir
            .mockResolvedValueOnce([
                { name: 'CourseWithTopics', isDirectory: () => true, isFile: () => false },
                { name: 'CourseWithoutTopics', isDirectory: () => true, isFile: () => false }
            ])
            // CourseWithTopics has subdirectories
            .mockResolvedValueOnce([
                { name: 'Topic1', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce(['video1.mp4'])
            // CourseWithoutTopics has direct files
            .mockResolvedValueOnce([
                { name: 'video2.mp4', isDirectory: () => false, isFile: () => true }
            ]);

        const result = await listDirectoriesWithTopics(testPath, [], false, false);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('CourseWithTopics');
        expect(result[0].topics[0].isTopicLess).toBeUndefined();
        expect(result[1].name).toBe('CourseWithoutTopics');
        expect(result[1].topics[0].isTopicLess).toBe(true);
    });
});