/**
 * @jest-environment jsdom
 */

import {
    addToHistory,
    getHistory,
    toggleFavorite,
    getFavorites,
    isFavorite,
    getLessonAnnotations,
    saveLessonAnnotation,
    deleteLessonAnnotation,
    saveLessonProgress,
    getCourseProgressSummary,
    getLessonKey,
    formatProgressTime,
    getCourseCollections,
    saveCourseCollection,
    addCourseToCollection,
    removeCourseFromCollection,
    pinCourseCollection,
} from '../../utils/courseTracking';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
    value: mockDispatchEvent,
});

describe('courseTracking utilities', () => {
    const mockCourse = {
        name: 'Test Course',
        topics: [],
    };

    const mockSession = {
        user: {name: 'Test User'},
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
    });

    describe('addToHistory', () => {
        test('adds course to history when session exists', () => {
            addToHistory(mockCourse, mockSession);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'courseHistory',
                expect.stringContaining(mockCourse.name)
            );

            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'courseHistoryUpdated',
                })
            );
        });

        test('adds to history even when no session (for logged out users)', () => {
            addToHistory(mockCourse, null);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'courseHistory',
                expect.stringContaining(mockCourse.name)
            );

            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'courseHistoryUpdated',
                })
            );
        });

        test('removes existing course and adds to beginning', () => {
            const existingHistory = [
                {name: 'Other Course', viewedAt: '2023-01-01'},
                {name: 'Test Course', viewedAt: '2023-01-02'},
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(existingHistory)
            );

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedHistory[0].name).toBe('Test Course');
            expect(savedHistory).toHaveLength(2);
        });

        test('limits history to 50 items', () => {
            const longHistory = Array.from({length: 51}, (_, i) => ({
                name: `Course ${i}`,
                viewedAt: '2023-01-01',
            }));
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(longHistory)
            );

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedHistory).toHaveLength(50);
            expect(savedHistory[0].name).toBe('Test Course');
        });

        test('adds timestamp to course entry', () => {
            const mockDate = new Date('2023-01-01T00:00:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedHistory[0].viewedAt).toBe('2023-01-01T00:00:00.000Z');

            global.Date.mockRestore();
        });
    });

    describe('getHistory', () => {
        test('returns empty array when no history', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const result = getHistory();

            expect(result).toEqual([]);
        });

        test('returns parsed history from localStorage', () => {
            const mockHistory = [{name: 'Test Course', viewedAt: '2023-01-01'}];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockHistory)
            );

            const result = getHistory();

            expect(result).toEqual(mockHistory);
            expect(localStorageMock.getItem).toHaveBeenCalledWith(
                'courseHistory'
            );
        });
    });

    describe('course collections', () => {
        test('creates a pinned first collection with unique courses', () => {
            localStorageMock.getItem.mockReturnValue('[]');

            const saved = saveCourseCollection(' Current Focus ', [
                'React Basics',
                'React Basics',
                'Node.js Fundamentals',
            ]);

            expect(saved.name).toBe('Current Focus');
            expect(saved.pinned).toBe(true);
            expect(saved.courses).toEqual([
                'React Basics',
                'Node.js Fundamentals',
            ]);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'mydemyCourseCollections:v1',
                expect.stringContaining('Current Focus')
            );
        });

        test('adds a course to an existing collection without duplicates', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify([
                    {
                        id: 'focus',
                        name: 'Focus',
                        courses: ['React Basics'],
                        pinned: true,
                    },
                ])
            );

            const saved = addCourseToCollection('Focus', 'React Basics');

            expect(saved.courses).toEqual(['React Basics']);
        });

        test('removes a course from a collection', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify([
                    {
                        id: 'focus',
                        name: 'Focus',
                        courses: ['React Basics', 'Node.js Fundamentals'],
                        pinned: true,
                    },
                ])
            );

            const collections = removeCourseFromCollection(
                'focus',
                'React Basics'
            );

            expect(collections[0].courses).toEqual(['Node.js Fundamentals']);
        });

        test('pins one collection at a time', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify([
                    {
                        id: 'focus',
                        name: 'Focus',
                        courses: [],
                        pinned: true,
                    },
                    {
                        id: 'work',
                        name: 'Work',
                        courses: [],
                        pinned: false,
                    },
                ])
            );

            const collections = pinCourseCollection('work');

            expect(collections.find((collection) => collection.id === 'work').pinned).toBe(true);
            expect(collections.find((collection) => collection.id === 'focus').pinned).toBe(false);
        });

        test('returns empty collections on the server', () => {
            const originalWindow = global.window;
            delete global.window;

            expect(getCourseCollections()).toEqual([]);

            global.window = originalWindow;
        });
    });

    describe('toggleFavorite', () => {
        test('adds course to favorites when not already favorite', () => {
            localStorageMock.getItem.mockReturnValue('[]');

            const result = toggleFavorite(mockCourse, mockSession);

            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'courseFavorites',
                expect.stringContaining(mockCourse.name)
            );
            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'courseFavoritesUpdated',
                    detail: expect.objectContaining({
                        course: mockCourse,
                        isFavorite: true,
                    }),
                })
            );
        });

        test('removes course from favorites when already favorite', () => {
            const existingFavorites = [
                {name: 'Test Course', favoritedAt: '2023-01-01'},
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(existingFavorites)
            );

            const result = toggleFavorite(mockCourse, mockSession);

            expect(result).toBe(false);
            const savedFavorites = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedFavorites).toEqual([]);
            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        isFavorite: false,
                    }),
                })
            );
        });

        test('toggles favorite even when no session (for logged out users)', () => {
            localStorageMock.getItem.mockReturnValue('[]');

            const result = toggleFavorite(mockCourse, null);

            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'courseFavorites',
                expect.stringContaining(mockCourse.name)
            );
        });

        test('adds timestamp when adding to favorites', () => {
            const mockDate = new Date('2023-01-01T00:00:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
            localStorageMock.getItem.mockReturnValue('[]');

            toggleFavorite(mockCourse, mockSession);

            const savedFavorites = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedFavorites[0].favoritedAt).toBe(
                '2023-01-01T00:00:00.000Z'
            );

            global.Date.mockRestore();
        });
    });

    describe('getFavorites', () => {
        test('returns empty array when no favorites', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const result = getFavorites();

            expect(result).toEqual([]);
        });

        test('returns parsed favorites from localStorage', () => {
            const mockFavorites = [
                {name: 'Test Course', favoritedAt: '2023-01-01'},
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockFavorites)
            );

            const result = getFavorites();

            expect(result).toEqual(mockFavorites);
            expect(localStorageMock.getItem).toHaveBeenCalledWith(
                'courseFavorites'
            );
        });
    });

    describe('isFavorite', () => {
        test('returns true when course is in favorites', () => {
            const favorites = [{name: 'Test Course'}, {name: 'Other Course'}];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(favorites));

            const result = isFavorite('Test Course');

            expect(result).toBe(true);
        });

        test('returns false when course is not in favorites', () => {
            const favorites = [{name: 'Other Course'}];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(favorites));

            const result = isFavorite('Test Course');

            expect(result).toBe(false);
        });

        test('returns false when no favorites exist', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const result = isFavorite('Test Course');

            expect(result).toBe(false);
        });
    });

    describe('lesson annotations', () => {
        test('saves bookmark annotations sorted by timestamp', () => {
            localStorageMock.getItem.mockReturnValue('{}');

            saveLessonAnnotation('React', 'lesson-1.mp4', {
                type: 'bookmark',
                timeSeconds: 90,
                text: 'Second',
            });

            const firstStore = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(firstStore)
            );

            saveLessonAnnotation('React', 'lesson-1.mp4', {
                type: 'bookmark',
                timeSeconds: 12,
                text: 'First',
            });

            const savedStore = JSON.parse(
                localStorageMock.setItem.mock.calls[1][1]
            );
            const saved = savedStore['React::lesson-1.mp4'];

            expect(saved).toHaveLength(2);
            expect(saved[0].timeSeconds).toBe(12);
            expect(saved[1].timeSeconds).toBe(90);
            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({type: 'lessonAnnotationsUpdated'})
            );
        });

        test('loads annotations for the requested lesson only', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify({
                    'React::lesson-1.mp4': [
                        {id: 'a', type: 'note', timeSeconds: 3},
                    ],
                    'React::lesson-2.mp4': [
                        {id: 'b', type: 'note', timeSeconds: 5},
                    ],
                })
            );

            expect(getLessonAnnotations('React', 'lesson-1.mp4')).toEqual([
                {id: 'a', type: 'note', timeSeconds: 3},
            ]);
        });

        test('updates an existing annotation when id matches', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify({
                    'React::lesson-1.mp4': [
                        {
                            id: 'note-1',
                            type: 'note',
                            timeSeconds: 3,
                            text: 'Old note',
                            createdAt: '2023-01-01T00:00:00.000Z',
                        },
                    ],
                })
            );

            const saved = saveLessonAnnotation('React', 'lesson-1.mp4', {
                id: 'note-1',
                type: 'note',
                timeSeconds: 4,
                text: 'New note',
                createdAt: '2023-01-01T00:00:00.000Z',
            });

            const savedStore = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(saved.id).toBe('note-1');
            expect(savedStore['React::lesson-1.mp4']).toHaveLength(1);
            expect(savedStore['React::lesson-1.mp4'][0].text).toBe('New note');
        });

        test('deletes an annotation by id', () => {
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify({
                    'React::lesson-1.mp4': [
                        {id: 'keep', type: 'bookmark', timeSeconds: 1},
                        {id: 'remove', type: 'note', timeSeconds: 2},
                    ],
                })
            );

            const remaining = deleteLessonAnnotation(
                'React',
                'lesson-1.mp4',
                'remove'
            );

            expect(remaining).toEqual([
                {id: 'keep', type: 'bookmark', timeSeconds: 1},
            ]);
        });
    });

    describe('lesson progress', () => {
        const mockProgressCourse = {
            name: 'Progress Course',
            topics: [
                {
                    name: 'Intro',
                    files: [{name: 'Welcome'}, {name: 'Setup'}],
                },
            ],
        };

        test('saves lesson progress with completion state', () => {
            localStorageMock.getItem.mockReturnValue('{}');
            const mockDate = new Date('2026-01-01T00:00:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const entry = saveLessonProgress({
                courseName: 'Progress Course',
                topicName: 'Intro',
                lessonName: 'Welcome',
                currentTime: 95,
                duration: 100,
            });

            expect(entry).toEqual(
                expect.objectContaining({
                    courseName: 'Progress Course',
                    topicName: 'Intro',
                    lessonName: 'Welcome',
                    currentTime: 95,
                    duration: 100,
                    completed: true,
                    updatedAt: '2026-01-01T00:00:00.000Z',
                })
            );

            const savedProgress = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(
                savedProgress[
                    getLessonKey('Progress Course', 'Intro', 'Welcome')
                ]
            ).toEqual(entry);

            global.Date.mockRestore();
        });

        test('derives course progress summary from stored entries', () => {
            const progress = {
                [getLessonKey('Progress Course', 'Intro', 'Welcome')]: {
                    courseName: 'Progress Course',
                    topicName: 'Intro',
                    lessonName: 'Welcome',
                    currentTime: 120,
                    duration: 120,
                    completed: true,
                    updatedAt: '2026-01-02T00:00:00.000Z',
                },
                [getLessonKey('Progress Course', 'Intro', 'Setup')]: {
                    courseName: 'Progress Course',
                    topicName: 'Intro',
                    lessonName: 'Setup',
                    currentTime: 30,
                    duration: 120,
                    completed: false,
                    updatedAt: '2026-01-03T00:00:00.000Z',
                },
            };

            expect(getCourseProgressSummary(mockProgressCourse, progress)).toEqual(
                {
                    completedLessons: 1,
                    totalLessons: 2,
                    percentComplete: 50,
                    activeLesson:
                        progress[
                            getLessonKey('Progress Course', 'Intro', 'Setup')
                        ],
                }
            );
        });

        test('formats progress timestamps', () => {
            expect(formatProgressTime(0)).toBe('0:00');
            expect(formatProgressTime(125)).toBe('2:05');
        });
    });

    // jsdom exposes window as a non-configurable global in this test setup,
    // so these SSR guard checks cannot reliably simulate a no-window runtime.
    describe.skip('server-side rendering compatibility', () => {
        let originalWindow;

        beforeAll(() => {
            originalWindow = global.window;
        });

        afterAll(() => {
            global.window = originalWindow;
        });

        const withoutWindow = (callback) => {
            Object.defineProperty(global, 'window', {
                value: undefined,
                configurable: true,
            });
            try {
                callback();
            } finally {
                Object.defineProperty(global, 'window', {
                    value: originalWindow,
                    configurable: true,
                });
            }
        };

        test('addToHistory returns early when window is undefined', () => {
            withoutWindow(() => {
                addToHistory(mockCourse, mockSession);

                // Should not throw and should not call localStorage
                expect(true).toBe(true); // Test passes if no error is thrown
            });
        });

        test('getHistory returns empty array when window is undefined', () => {
            withoutWindow(() => {
                const result = getHistory();

                expect(result).toEqual([]);
            });
        });

        test('toggleFavorite returns undefined when window is undefined', () => {
            withoutWindow(() => {
                const result = toggleFavorite(mockCourse, null);

                expect(result).toBeUndefined();
            });
        });

        test('getFavorites returns empty array when window is undefined', () => {
            withoutWindow(() => {
                const result = getFavorites();

                expect(result).toEqual([]);
            });
        });

        test('isFavorite returns false when window is undefined', () => {
            withoutWindow(() => {
                const result = isFavorite('Test Course');

                expect(result).toBe(false);
            });
        });

        test('annotation helpers return safely when window is undefined', () => {
            withoutWindow(() => {
                expect(getLessonAnnotations('React', 'lesson-1.mp4')).toEqual(
                    []
                );
                expect(
                    saveLessonAnnotation('React', 'lesson-1.mp4', {
                        type: 'note',
                        timeSeconds: 1,
                    })
                ).toBeNull();
                expect(
                    deleteLessonAnnotation('React', 'lesson-1.mp4', 'note-1')
                ).toEqual([]);
            });
        });
    });
});
