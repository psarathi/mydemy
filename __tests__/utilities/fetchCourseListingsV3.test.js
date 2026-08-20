const fs = require('fs').promises;
const listDirectoriesWithTopics = require('../../utilities/fetchCourseListingsV3');

jest.mock('fs', () => ({
    promises: {
        readdir: jest.fn(),
        stat: jest.fn(),
    },
}));

const directory = (name) => ({
    name,
    isDirectory: () => true,
    isFile: () => false,
});

const file = (name) => ({
    name,
    isDirectory: () => false,
    isFile: () => true,
});

describe('fetchCourseListingsV3', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        listDirectoriesWithTopics.clearCache();
        fs.stat.mockResolvedValue({
            isDirectory: () => true,
            birthtimeMs: 0,
            ctimeMs: 0,
            mtimeMs: 0,
        });
    });

    test('ignores generated HLS directories beside video lessons', async () => {
        fs.readdir
            .mockResolvedValueOnce([directory('Course 1')])
            .mockResolvedValueOnce([
                file('Introduction.mp4'),
                directory('Introduction.mp4.hls'),
            ]);

        const courses = await listDirectoriesWithTopics(
            '/courses',
            [],
            false,
            false,
            false
        );

        expect(courses).toEqual([
            {
                name: 'Course 1',
                addedAt: null,
                topics: [
                    {
                        name: 'Course 1',
                        files: [
                            {
                                fileName: 'Introduction.mp4',
                                name: 'Introduction',
                                ext: '.mp4',
                            },
                        ],
                        isTopicLess: true,
                    },
                ],
            },
        ]);
        expect(fs.readdir).not.toHaveBeenCalledWith(
            '/courses/Course 1/Introduction.mp4.hls',
            expect.anything()
        );
    });
});
