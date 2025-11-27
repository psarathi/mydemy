const fs = require('fs');
const fetchCourses = require('../fetchCourses');

jest.mock('fs');
jest.mock('../fetchCourses');

describe('fetchCoursesScript', () => {
    const originalEnv = process.env;
    let consoleLogSpy;
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = { ...originalEnv };
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        process.env = originalEnv;
    });

    describe('SKIP_COURSE_FETCH=true', () => {
        beforeEach(() => {
            process.env.SKIP_COURSE_FETCH = 'true';
        });

        it('should skip course fetch when courses.json exists', () => {
            const mockCourses = [
                { name: 'Course 1', topics: [] },
                { name: 'Course 2', topics: [] }
            ];

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockCourses));

            require('../fetchCoursesScript');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '⏭️  Skipping course fetch (SKIP_COURSE_FETCH=true)'
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                '✓ Using existing courses.json with 2 courses'
            );
            expect(processExitSpy).toHaveBeenCalledWith(0);
            expect(fetchCourses).not.toHaveBeenCalled();
        });

        it('should log correct course count', () => {
            const manyCourses = Array.from({ length: 592 }, (_, i) => ({
                name: `Course ${i + 1}`,
                topics: []
            }));

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(manyCourses));

            require('../fetchCoursesScript');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '✓ Using existing courses.json with 592 courses'
            );
        });

        it('should exit with error when courses.json does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            require('../fetchCoursesScript');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '❌ SKIP_COURSE_FETCH is set but courses.json does not exist!'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith('   Please either:');
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   1. Create a courses.json file, or'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '   2. Unset SKIP_COURSE_FETCH to fetch from CDN'
            );
            expect(processExitSpy).toHaveBeenCalledWith(1);
            expect(fetchCourses).not.toHaveBeenCalled();
        });

        it('should handle invalid JSON in courses.json', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json');

            expect(() => require('../fetchCoursesScript')).toThrow();
            expect(fetchCourses).not.toHaveBeenCalled();
        });

        it('should handle empty courses.json', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('[]');

            require('../fetchCoursesScript');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '✓ Using existing courses.json with 0 courses'
            );
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });
    });

    describe('SKIP_COURSE_FETCH not set', () => {
        it('should call fetchCourses when SKIP_COURSE_FETCH is not set', () => {
            delete process.env.SKIP_COURSE_FETCH;
            fetchCourses.mockResolvedValue();

            require('../fetchCoursesScript');

            expect(fetchCourses).toHaveBeenCalledWith([], true);
            expect(processExitSpy).not.toHaveBeenCalled();
        });

        it('should call fetchCourses when SKIP_COURSE_FETCH is false', () => {
            process.env.SKIP_COURSE_FETCH = 'false';
            fetchCourses.mockResolvedValue();

            require('../fetchCoursesScript');

            expect(fetchCourses).toHaveBeenCalledWith([], true);
        });

        it('should call fetchCourses with logging enabled', () => {
            delete process.env.SKIP_COURSE_FETCH;
            fetchCourses.mockResolvedValue();

            require('../fetchCoursesScript');

            expect(fetchCourses).toHaveBeenCalledWith([], true);
        });
    });

    describe('File reading errors', () => {
        it('should handle file read errors', () => {
            process.env.SKIP_COURSE_FETCH = 'true';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            expect(() => require('../fetchCoursesScript')).toThrow('Permission denied');
        });
    });

    describe('Constants usage', () => {
        it('should use COURSES_FILE_NAME constant', () => {
            process.env.SKIP_COURSE_FETCH = 'true';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('[]');

            require('../fetchCoursesScript');

            expect(fs.existsSync).toHaveBeenCalledWith('courses.json');
            expect(fs.readFileSync).toHaveBeenCalledWith('courses.json', 'utf-8');
        });
    });
});
