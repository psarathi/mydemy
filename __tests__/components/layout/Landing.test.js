/**
 * @jest-environment jsdom
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Landing from '../../../components/layout/Landing';

// Mock Next.js components
jest.mock('next/link', () => {
    return function MockedLink({children, href, passHref, ...props}) {
        const resolvedHref =
            typeof href === 'string'
                ? href
                : `${href.pathname}?${new URLSearchParams(href.query).toString()}`;
        return <a href={resolvedHref} {...props}>{children}</a>;
    };
});

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('../../../components/common/SwitchCheckbox', () => {
    return function MockSwitchCheckbox({initialState, callback}) {
        return (
            <input 
                type="checkbox" 
                data-testid="switch-checkbox"
                defaultChecked={initialState}
                onChange={(e) => callback && callback(e.target.checked)}
            />
        );
    };
});

jest.mock('../../../components/common/ThemeToggle', () => {
    return function MockThemeToggle() {
        return <div data-testid="theme-toggle">Theme Toggle</div>;
    };
});

jest.mock('../../../components/common/HamburgerMenu', () => {
    return function MockHamburgerMenu() {
        return <div data-testid="hamburger-menu">Hamburger Menu</div>;
    };
});

jest.mock('../../../components/common/FavoriteButton', () => {
    return function MockFavoriteButton({course}) {
        return <div data-testid={`favorite-${course.name}`}>Favorite Button</div>;
    };
});

jest.mock('../../../utils/courseTracking', () => ({
    addToHistory: jest.fn(),
    addCourseToCollection: jest.fn(),
    formatProgressTime: jest.fn(() => '0:00'),
    getCourseCollections: jest.fn(() => []),
    getCourseProgressSummary: jest.fn(() => ({
        completedLessons: 0,
        totalLessons: 0,
        percentComplete: 0,
        activeLesson: null,
    })),
    getMatchingNoteAnnotationsForCourse: jest.fn(() => []),
    getLessonProgress: jest.fn(() => ({})),
    pinCourseCollection: jest.fn(),
    removeCourseFromCollection: jest.fn(),
}));

jest.mock('../../../utils/tagging', () => ({
    addTag: jest.fn(),
    removeTag: jest.fn(),
    getTags: jest.fn(() => []),
    getTagCounts: jest.fn(() => []),
}));

// Mock courses data
const mockCourses = [
    {
        name: 'React Basics',
        addedAt: '2026-08-08T12:01:12.000Z',
        topics: [
            {
                name: 'Introduction',
                files: [{name: 'React overview.mp4', ext: '.mp4'}],
            },
            {
                name: 'Components',
                files: [{name: 'Component state.mp4', ext: '.mp4'}],
            }
        ]
    },
    {
        name: 'JavaScript Advanced',
        addedAt: '2026-08-06T12:01:12.000Z',
        topics: [
            {
                name: 'Closures',
                files: [{name: 'Lexical scope.mp4', ext: '.mp4'}],
            },
            {
                name: 'Async Programming',
                files: [{name: 'Promise chaining.mp4', ext: '.mp4'}],
            }
        ]
    },
    {
        name: 'Node.js Fundamentals',
        addedAt: '2026-08-07T12:01:12.000Z',
        topics: [
            { name: 'Getting Started', files: [] }
        ]
    }
];

jest.mock('../../../hooks/useCourses', () => ({
    useCourses: jest.fn(() => ({
        courses: mockCourses,
        isLoading: false,
        mutate: jest.fn(),
    })),
}));

const mockUseSession = require('next-auth/react').useSession;
const mockAddToHistory = require('../../../utils/courseTracking').addToHistory;
const mockGetMatchingNoteAnnotationsForCourse =
    require('../../../utils/courseTracking').getMatchingNoteAnnotationsForCourse;

describe('Landing', () => {
    const mockSession = {
        user: { name: 'Test User' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        mockGetMatchingNoteAnnotationsForCourse.mockReturnValue([]);
    });

    test('renders landing page with basic components', () => {
        render(<Landing />);

        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
        expect(screen.getAllByTestId('switch-checkbox')).toHaveLength(3);
    });

    test('displays all courses by default', () => {
        render(<Landing />);

        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.getByText('JavaScript Advanced')).toBeInTheDocument();
        expect(screen.getByText('Node.js Fundamentals')).toBeInTheDocument();
    });

    test('orders courses by newest added date first', () => {
        render(<Landing />);

        const courseNames = Array.from(
            document.querySelectorAll('.course-title')
        ).map((heading) => heading.textContent);

        expect(courseNames).toEqual([
            'React Basics',
            'Node.js Fundamentals',
            'JavaScript Advanced',
        ]);
    });

    test('filters courses based on search term', async () => {
        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        await user.type(searchInput, 'React');

        await waitFor(() => {
            expect(screen.getByText('React Basics')).toBeInTheDocument();
            expect(screen.queryByText('JavaScript Advanced')).not.toBeInTheDocument();
            expect(screen.queryByText('Node.js Fundamentals')).not.toBeInTheDocument();
        });
    });

    test('shows all courses when search is cleared', async () => {
        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        
        // Type and then clear
        await user.type(searchInput, 'React');
        await user.clear(searchInput);

        await waitFor(() => {
            expect(screen.getByText('React Basics')).toBeInTheDocument();
            expect(screen.getByText('JavaScript Advanced')).toBeInTheDocument();
            expect(screen.getByText('Node.js Fundamentals')).toBeInTheDocument();
        });
    });

    test('handles exact search toggle', async () => {
        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        const exactToggle = screen.getAllByTestId('switch-checkbox')[0];

        // Test partial match (default behavior)
        await user.type(searchInput, 'Java');
        
        await waitFor(() => {
            expect(screen.getByText('JavaScript Advanced')).toBeInTheDocument();
        });

        // Enable exact search
        await user.click(exactToggle);
        
        // Should not find partial matches
        await waitFor(() => {
            expect(screen.queryByText('JavaScript Advanced')).not.toBeInTheDocument();
        });
    });

    test('initializes with search term prop', () => {
        render(<Landing search_term="React" />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        expect(searchInput.value).toBe('React');
        
        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.queryByText('JavaScript Advanced')).not.toBeInTheDocument();
    });

    test('initializes with exact search enabled', () => {
        render(<Landing exact="true" />);

        const exactToggle = screen.getAllByTestId('switch-checkbox')[0];
        expect(exactToggle.checked).toBe(true);
    });

    test('handles keyboard shortcuts for search focus', async () => {
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);

        // Simulate Cmd+K
        fireEvent.keyDown(document, { 
            key: 'K', 
            metaKey: true 
        });

        expect(searchInput).toHaveFocus();
    });

    test('handles case insensitive keyboard shortcut', async () => {
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);

        // Simulate Cmd+k (lowercase)
        fireEvent.keyDown(document, { 
            key: 'k', 
            metaKey: true 
        });

        expect(searchInput).toHaveFocus();
    });

    test('displays course topic count', () => {
        render(<Landing />);

        expect(screen.getAllByText('2 topics')).toHaveLength(2); // React Basics, JavaScript Advanced
        expect(screen.getByText('1 topics')).toBeInTheDocument(); // Node.js Fundamentals
    });

    test('displays course added date when available', () => {
        render(<Landing />);

        expect(screen.getByText(/Added Aug 8, 2026/)).toBeInTheDocument();
    });

    test('renders course links correctly', () => {
        render(<Landing />);

        const reactLink = screen.getByText('React Basics').closest('a');
        expect(reactLink).toHaveAttribute('href', '/React Basics');
    });

    test('shows favorite buttons when authenticated', () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });

        render(<Landing />);

        expect(screen.getByTestId('favorite-React Basics')).toBeInTheDocument();
        expect(screen.getByTestId('favorite-JavaScript Advanced')).toBeInTheDocument();
        expect(screen.getByTestId('favorite-Node.js Fundamentals')).toBeInTheDocument();
    });

    test('calls addToHistory when course is clicked and user is authenticated', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        const user = userEvent.setup();

        render(<Landing />);

        const courseLink = screen.getByText('React Basics');
        await user.click(courseLink);

        expect(mockAddToHistory).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'React Basics' }),
            mockSession
        );
    });

    test('calls addToHistory even when not authenticated', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        const user = userEvent.setup();

        render(<Landing />);

        const courseLink = screen.getByText('React Basics');
        await user.click(courseLink);

        expect(mockAddToHistory).toHaveBeenCalled();
    });

    test('handles multi-word search terms', async () => {
        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        await user.type(searchInput, 'JavaScript Advanced');

        await waitFor(() => {
            expect(screen.getByText('JavaScript Advanced')).toBeInTheDocument();
            expect(screen.queryByText('React Basics')).not.toBeInTheDocument();
        });
    });

    test('shows matched lesson jump results when searching lessons', async () => {
        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        const lessonSearchToggle = screen.getAllByTestId('switch-checkbox')[1];

        await user.click(lessonSearchToggle);
        await user.type(searchInput, 'Promise');

        await waitFor(() => {
            expect(screen.getByText('JavaScript Advanced')).toBeInTheDocument();
            expect(screen.getByText('1 matched lesson')).toBeInTheDocument();
            expect(screen.getByText('Async Programming')).toBeInTheDocument();
            expect(screen.getByText('Promise chaining.mp4')).toBeInTheDocument();
        });

        expect(screen.getByText('Promise chaining.mp4').closest('a')).toHaveAttribute(
            'href',
            'JavaScript Advanced?topic=Async+Programming&lesson=Promise+chaining.mp4'
        );
    });

    test('shows matched note results when searching notes', async () => {
        const courseTracking = require('../../../utils/courseTracking');
        courseTracking.getMatchingNoteAnnotationsForCourse.mockImplementation(
            (course, searchTermParts) => {
                if (
                    course.name === 'Node.js Fundamentals' &&
                    searchTermParts.includes('streams')
                ) {
                    return [
                        {
                            id: 'note-1',
                            lessonPath: 'streams.mp4',
                            timeSeconds: 42,
                            text: 'Review streams backpressure',
                        },
                    ];
                }

                return [];
            }
        );

        const user = userEvent.setup();
        render(<Landing />);

        const searchInput = screen.getByPlaceholderText(/Search courses/i);
        const noteSearchToggle = screen.getAllByTestId('switch-checkbox')[2];

        await user.click(noteSearchToggle);
        await user.type(searchInput, 'streams');

        await waitFor(() => {
            expect(screen.getByText('Node.js Fundamentals')).toBeInTheDocument();
            expect(screen.getByText('1 matched note')).toBeInTheDocument();
            expect(screen.getByText('Review streams backpressure')).toBeInTheDocument();
            expect(screen.queryByText('React Basics')).not.toBeInTheDocument();
        });
    });

    test('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
        
        const {unmount} = render(<Landing />);
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        
        removeEventListenerSpy.mockRestore();
    });
});
