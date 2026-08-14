/**
 * @jest-environment jsdom
 */

import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseName from '../../pages/[courseName]';

jest.mock('next/link', () => {
    return function MockedLink({children, href, ...props}) {
        const resolvedHref =
            typeof href === 'string'
                ? href
                : `${href.pathname}?${new URLSearchParams(href.query).toString()}`;
        return <a href={resolvedHref} {...props}>{children}</a>;
    };
});

jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({data: null, status: 'unauthenticated'})),
}));

jest.mock('../../hooks/useCourses', () => ({
    useCourses: jest.fn(),
}));

jest.mock('../../components/player/VideoPlayer', () => {
    return function MockVideoPlayer({onCaptureNote}) {
        return (
            <button
                type='button'
                onClick={() => onCaptureNote(67)}
                aria-label='Add note at current timestamp'
            >
                Add note
            </button>
        );
    };
});

jest.mock('../../utils/courseTracking', () => ({
    addToHistory: jest.fn(),
    addLessonToPlaylist: jest.fn(),
    deleteLessonAnnotation: jest.fn(),
    formatProgressTime: jest.fn(() => '0:00'),
    getCourseProgressSummary: jest.fn(() => ({
        completedLessons: 0,
        totalLessons: 1,
        percentComplete: 0,
        activeLesson: null,
    })),
    getCourseResumeUrl: jest.fn(() => '/React%20Basics'),
    getLearningPlaylist: jest.fn(() => []),
    getLessonAnnotations: jest.fn(() => []),
    getLessonProgress: jest.fn(() => ({})),
    getLessonProgressEntry: jest.fn(() => null),
    getPlaylistLessonId: jest.fn(() => 'lesson-id'),
    isLessonInPlaylist: jest.fn(() => false),
    movePlaylistLesson: jest.fn(),
    removeLessonFromPlaylist: jest.fn(),
    saveLessonAnnotation: jest.fn(),
    saveLessonProgress: jest.fn(),
}));

const {useCourses} = require('../../hooks/useCourses');

describe('CourseName page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 800,
        });
        Element.prototype.scrollIntoView = jest.fn();
        useCourses.mockReturnValue({
            courses: [
                {
                    name: 'React Basics',
                    topics: [
                        {
                            name: 'Introduction',
                            files: [
                                {
                                    name: 'Welcome.mp4',
                                    fileName: 'Welcome.mp4',
                                    ext: '.mp4',
                                },
                            ],
                        },
                    ],
                },
            ],
            isLoading: false,
        });
    });

    test('opens the sidebar and focuses the note textarea when capturing a note', async () => {
        const user = userEvent.setup();
        render(<CourseName courseName='React Basics' />);

        await user.click(screen.getByLabelText('Collapse sidebar'));
        const sidebar = screen.getByLabelText('Collapse sidebar').closest('aside');
        expect(sidebar).toHaveClass('hidden');

        await user.click(screen.getByLabelText('Add note at current timestamp'));

        expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
        expect(sidebar).not.toHaveClass('hidden');
        const textarea = screen.getByLabelText('Note at 1:07');
        await waitFor(() => expect(textarea).toHaveFocus());
    });
});
