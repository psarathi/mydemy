const fs = require('node:fs/promises');
const fetchCourses = require('../fetchCourses');
const fetchCourseListingsV3 = require('../utilities/fetchCourseListingsV3');
const { COURSES_FOLDER, COURSES_FILE_NAME } = require('../constants');

jest.mock('node:fs/promises');
jest.mock('../utilities/fetchCourseListingsV3');

describe('fetchCourses', () => {
    const mockCourses = [
        { name: 'Course 1', topics: [] },
        { name: 'Course 2', topics: [] }
    ];

    let consoleLogSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    describe('Successful course fetching', () => {
        it('should fetch and save courses successfully', async () => {
            fetchCourseListingsV3.mockResolvedValue(mockCourses);

            await fetchCourses([], false);

            expect(fetchCourseListingsV3).toHaveBeenCalledWith(
                COURSES_FOLDER,
                [],
                true,
                false
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                COURSES_FILE_NAME,
                JSON.stringify(mockCourses)
            );
            expect(consoleLogSpy).toHaveBeenCalledWith('fetching courses...');
            expect(consoleLogSpy).toHaveBeenCalledWith('2 courses were found');
            expect(consoleLogSpy).toHaveBeenCalledWith('✓ courses fetched and file updated');
        });

        it('should handle logging course details when requested', async () => {
            fetchCourseListingsV3.mockResolvedValue(mockCourses);

            await fetchCourses([], true);

            expect(fetchCourseListingsV3).toHaveBeenCalledWith(
                COURSES_FOLDER,
                [],
                true,
                true
            );
        });
    });

    describe('No courses found - preservation logic', () => {
        it('should preserve existing courses.json when no new courses fetched', async () => {
            const existingCourses = [
                { name: 'Existing Course 1', topics: [] },
                { name: 'Existing Course 2', topics: [] }
            ];

            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockResolvedValue(JSON.stringify(existingCourses));

            await fetchCourses([], false);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '⚠️  No courses fetched from CDN, but preserving existing courses.json with',
                2,
                'courses'
            );
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        it('should exit with error when no courses found and no existing file', async () => {
            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockRejectedValue(new Error('ENOENT: File not found'));

            await fetchCourses([], false);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '❌ No courses found and no existing courses.json to fall back to!'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   1. CDN is accessible at:',
                expect.any(String)
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   2. COURSES_FOLDER exists:',
                COURSES_FOLDER
            );
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        it('should exit when existing courses.json is empty', async () => {
            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockResolvedValue('[]');

            await fetchCourses([], false);

            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        it('should exit when existing courses.json has invalid JSON', async () => {
            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockResolvedValue('invalid json');

            await fetchCourses([], false);

            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('Incremental course processing', () => {
        it('should merge new courses with existing ones when coursesToProcess is provided', async () => {
            const existingCourses = [{ name: 'Existing Course', topics: [] }];
            const newCourses = [{ name: 'New Course', topics: [] }];
            const coursesToProcess = ['New Course'];

            fetchCourseListingsV3.mockResolvedValue(newCourses);
            fs.readFile.mockResolvedValue(JSON.stringify(existingCourses));

            await fetchCourses(coursesToProcess, false);

            expect(fs.writeFile).toHaveBeenCalledWith(
                COURSES_FILE_NAME,
                JSON.stringify([...existingCourses, ...newCourses])
            );
        });

        it('should handle reading existing courses when merging', async () => {
            const coursesToProcess = ['Course 1'];
            const newCourses = [{ name: 'Course 1', topics: [] }];
            const existingCourses = [{ name: 'Old Course', topics: [] }];

            fetchCourseListingsV3.mockResolvedValue(newCourses);
            fs.readFile.mockResolvedValue(JSON.stringify(existingCourses));

            await fetchCourses(coursesToProcess, false);

            expect(fs.readFile).toHaveBeenCalledWith(COURSES_FILE_NAME, 'utf-8');
            expect(fs.writeFile).toHaveBeenCalledWith(
                COURSES_FILE_NAME,
                JSON.stringify([...existingCourses, ...newCourses])
            );
        });
    });

    describe('Environment variable handling', () => {
        const originalEnv = process.env;

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should use NEXT_PUBLIC_BASE_CDN_PATH in error messages', async () => {
            process.env.NEXT_PUBLIC_BASE_CDN_PATH = 'http://custom-cdn.com';

            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockRejectedValue(new Error('No file'));

            await fetchCourses([], false);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   1. CDN is accessible at:',
                'http://custom-cdn.com'
            );
        });

        it('should use default CDN path when env var not set', async () => {
            delete process.env.NEXT_PUBLIC_BASE_CDN_PATH;

            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockRejectedValue(new Error('No file'));

            await fetchCourses([], false);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   1. CDN is accessible at:',
                'http://192.168.1.141:5555'
            );
        });
    });

    describe('Course count logging', () => {
        it('should log correct course count', async () => {
            const manyCourses = Array.from({ length: 592 }, (_, i) => ({
                name: `Course ${i + 1}`,
                topics: []
            }));

            fetchCourseListingsV3.mockResolvedValue(manyCourses);

            await fetchCourses([], false);

            expect(consoleLogSpy).toHaveBeenCalledWith('592 courses were found');
        });

        it('should log zero courses found', async () => {
            fetchCourseListingsV3.mockResolvedValue([]);
            fs.readFile.mockRejectedValue(new Error('No file'));

            await fetchCourses([], false);

            expect(consoleLogSpy).toHaveBeenCalledWith('0 courses were found');
        });
    });

    describe('File write errors', () => {
        it('should handle file write errors', async () => {
            fetchCourseListingsV3.mockResolvedValue(mockCourses);
            fs.writeFile.mockRejectedValue(new Error('Permission denied'));

            await expect(fetchCourses([], false)).rejects.toThrow('Permission denied');
        });
    });

    describe('fetchCourseListingsV3 errors', () => {
        it('should handle fetch errors', async () => {
            fetchCourseListingsV3.mockRejectedValue(new Error('Network error'));

            await expect(fetchCourses([], false)).rejects.toThrow('Network error');
        });
    });
});
