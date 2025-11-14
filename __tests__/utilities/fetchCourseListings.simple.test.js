const fetchCourseListings = require('@/lib/courses/fetchCourseListings');

describe('fetchCourseListings integration tests', () => {
    let consoleLogSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('handles non-existent directory gracefully', () => {
        const nonExistentPath = '/path/that/does/not/exist/123456789';
        
        const result = fetchCourseListings(nonExistentPath);

        expect(result).toEqual([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(nonExistentPath);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('no such file or directory')
        }));
    });

    test('returns function when called', () => {
        expect(typeof fetchCourseListings).toBe('function');
    });

    test('returns an array', () => {
        const nonExistentPath = '/path/that/does/not/exist';
        const result = fetchCourseListings(nonExistentPath);
        expect(Array.isArray(result)).toBe(true);
    });
});