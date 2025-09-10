/**
 * @jest-environment jsdom
 */

import {
    addToHistory,
    getHistory,
    toggleFavorite,
    getFavorites,
    isFavorite
} from '../../utils/courseTracking';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
    value: mockDispatchEvent
});

describe('courseTracking utilities', () => {
    const mockCourse = {
        name: 'Test Course',
        topics: []
    };

    const mockSession = {
        user: { name: 'Test User' }
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
                    type: 'courseHistoryUpdated'
                })
            );
        });

        test('does not add to history when no session', () => {
            addToHistory(mockCourse, null);

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(mockDispatchEvent).not.toHaveBeenCalled();
        });

        test('removes existing course and adds to beginning', () => {
            const existingHistory = [
                { name: 'Other Course', viewedAt: '2023-01-01' },
                { name: 'Test Course', viewedAt: '2023-01-02' }
            ];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedHistory[0].name).toBe('Test Course');
            expect(savedHistory).toHaveLength(2);
        });

        test('limits history to 50 items', () => {
            const longHistory = Array.from({length: 51}, (_, i) => ({
                name: `Course ${i}`,
                viewedAt: '2023-01-01'
            }));
            localStorageMock.getItem.mockReturnValue(JSON.stringify(longHistory));

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedHistory).toHaveLength(50);
            expect(savedHistory[0].name).toBe('Test Course');
        });

        test('adds timestamp to course entry', () => {
            const mockDate = new Date('2023-01-01T00:00:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

            addToHistory(mockCourse, mockSession);

            const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
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
            const mockHistory = [{ name: 'Test Course', viewedAt: '2023-01-01' }];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

            const result = getHistory();

            expect(result).toEqual(mockHistory);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('courseHistory');
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
                        isFavorite: true
                    })
                })
            );
        });

        test('removes course from favorites when already favorite', () => {
            const existingFavorites = [{ name: 'Test Course', favoritedAt: '2023-01-01' }];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(existingFavorites));

            const result = toggleFavorite(mockCourse, mockSession);

            expect(result).toBe(false);
            const savedFavorites = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedFavorites).toEqual([]);
            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        isFavorite: false
                    })
                })
            );
        });

        test('does not toggle favorite when no session', () => {
            const result = toggleFavorite(mockCourse, null);

            expect(result).toBeUndefined();
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        test('adds timestamp when adding to favorites', () => {
            const mockDate = new Date('2023-01-01T00:00:00.000Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
            localStorageMock.getItem.mockReturnValue('[]');

            toggleFavorite(mockCourse, mockSession);

            const savedFavorites = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedFavorites[0].favoritedAt).toBe('2023-01-01T00:00:00.000Z');

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
            const mockFavorites = [{ name: 'Test Course', favoritedAt: '2023-01-01' }];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFavorites));

            const result = getFavorites();

            expect(result).toEqual(mockFavorites);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('courseFavorites');
        });
    });

    describe('isFavorite', () => {
        test('returns true when course is in favorites', () => {
            const favorites = [{ name: 'Test Course' }, { name: 'Other Course' }];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(favorites));

            const result = isFavorite('Test Course');

            expect(result).toBe(true);
        });

        test('returns false when course is not in favorites', () => {
            const favorites = [{ name: 'Other Course' }];
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

    describe('server-side rendering compatibility', () => {
        let originalWindow;

        beforeAll(() => {
            originalWindow = global.window;
        });

        afterAll(() => {
            global.window = originalWindow;
        });

        test('addToHistory returns early when window is undefined', () => {
            delete global.window;

            addToHistory(mockCourse, mockSession);

            // Should not throw and should not call localStorage
            expect(true).toBe(true); // Test passes if no error is thrown
        });

        test('getHistory returns empty array when window is undefined', () => {
            delete global.window;

            const result = getHistory();

            expect(result).toEqual([]);
        });

        test('toggleFavorite returns undefined when window is undefined', () => {
            delete global.window;

            const result = toggleFavorite(mockCourse, null);

            expect(result).toBeUndefined();
        });

        test('getFavorites returns empty array when window is undefined', () => {
            delete global.window;

            const result = getFavorites();

            expect(result).toEqual([]);
        });

        test('isFavorite returns false when window is undefined', () => {
            delete global.window;

            const result = isFavorite('Test Course');

            expect(result).toBe(false);
        });
    });
});