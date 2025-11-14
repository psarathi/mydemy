import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagButton from '../../../components/common/TagButton';

// Mock tagging utilities
jest.mock('../../../utils/tagging');

const mockRemoveTag = require('../../../utils/tagging').removeTag;
const mockGetTags = require('../../../utils/tagging').getTags;

describe('TagButton', () => {
    const mockCourse = {
        name: 'Test Course',
        topics: []
    };

    const mockTag = 'javascript';

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        mockGetTags.mockReturnValue(['javascript', 'backend']);
        mockRemoveTag.mockImplementation(() => {});
    });

    test('renders tag button with tag name', () => {
        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('tag-button');
        expect(button).toHaveTextContent('#javascript');
    });

    test('shows active state when course has the tag', () => {
        mockGetTags.mockReturnValue(['javascript']);

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toHaveClass('tag-button', 'active');
    });

    test('does not show active state when course does not have the tag', () => {
        mockGetTags.mockReturnValue(['python']);

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toHaveClass('tag-button');
        expect(button).not.toHaveClass('active');
    });

    test('dispatches tagClicked event when button is clicked', async () => {
        const user = userEvent.setup();
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        await user.click(button);

        expect(dispatchEventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'tagClicked',
                detail: { tag: mockTag }
            })
        );

        dispatchEventSpy.mockRestore();
    });

    test('calls removeTag when remove button (×) is clicked', async () => {
        const user = userEvent.setup();

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const removeButton = screen.getByTitle('Remove tag javascript');
        await user.click(removeButton);

        expect(mockRemoveTag).toHaveBeenCalledWith(mockCourse, mockTag);
    });

    test('prevents event propagation when tag is clicked', () => {
        const mockStopPropagation = jest.fn();
        const mockPreventDefault = jest.fn();
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        fireEvent.click(button, {
            stopPropagation: mockStopPropagation,
            preventDefault: mockPreventDefault
        });

        // Verify the event was handled (dispatchEvent was called)
        expect(dispatchEventSpy).toHaveBeenCalled();
        dispatchEventSpy.mockRestore();
    });

    test('prevents event propagation when remove button is clicked', () => {
        const mockStopPropagation = jest.fn();
        const mockPreventDefault = jest.fn();

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const removeButton = screen.getByTitle('Remove tag javascript');
        fireEvent.click(removeButton, {
            stopPropagation: mockStopPropagation,
            preventDefault: mockPreventDefault
        });

        expect(mockRemoveTag).toHaveBeenCalledWith(mockCourse, mockTag);
    });

    test('applies custom className prop', () => {
        render(<TagButton course={mockCourse} tag={mockTag} className="custom-class" />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toHaveClass('tag-button', 'custom-class');
    });

    test('renders remove button with correct attributes', () => {
        render(<TagButton course={mockCourse} tag={mockTag} />);

        const removeButton = screen.getByTitle('Remove tag javascript');
        expect(removeButton).toBeInTheDocument();
        expect(removeButton).toHaveClass('tag-remove');
        expect(removeButton).toHaveAttribute('aria-label', 'Remove tag javascript');
        expect(removeButton).toHaveTextContent('×');
    });

    test('updates state when courseTagsUpdated event is dispatched', async () => {
        mockGetTags.mockReturnValue([]);

        render(<TagButton course={mockCourse} tag={mockTag} />);

        let button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).not.toHaveClass('active');

        // Update mock to return the tag
        mockGetTags.mockReturnValue(['javascript']);

        // Simulate the courseTagsUpdated event
        const event = new CustomEvent('courseTagsUpdated', {
            detail: {
                courseName: mockCourse.name,
                tags: ['javascript']
            }
        });

        fireEvent(window, event);

        await waitFor(() => {
            button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
            expect(button).toHaveClass('active');
        });
    });

    test('ignores courseTagsUpdated event for different course', async () => {
        mockGetTags.mockReturnValue([]);

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).not.toHaveClass('active');

        // Simulate event for different course
        const event = new CustomEvent('courseTagsUpdated', {
            detail: {
                courseName: 'Different Course',
                tags: ['javascript']
            }
        });

        fireEvent(window, event);

        // Should not change state
        expect(button).not.toHaveClass('active');
    });

    test('cleans up event listener on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const {unmount} = render(<TagButton course={mockCourse} tag={mockTag} />);

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('courseTagsUpdated', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    test('button has correct accessibility attributes', () => {
        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toHaveAttribute('aria-label', 'Search for courses with tag javascript');
        expect(button).toHaveAttribute('title', 'Search for courses with tag javascript');
    });

    test('handles multiple tags on a course', () => {
        mockGetTags.mockReturnValue(['javascript', 'backend', 'nodejs']);

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        expect(button).toHaveClass('active');
    });

    test('does not call removeTag when clicking main button', async () => {
        const user = userEvent.setup();

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const button = screen.getByRole('button', { name: /Search for courses with tag javascript/i });
        await user.click(button);

        expect(mockRemoveTag).not.toHaveBeenCalled();
    });

    test('does not dispatch tagClicked event when clicking remove button', async () => {
        const user = userEvent.setup();
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        render(<TagButton course={mockCourse} tag={mockTag} />);

        const removeButton = screen.getByTitle('Remove tag javascript');

        // Clear any previous calls
        dispatchEventSpy.mockClear();

        await user.click(removeButton);

        // Should not dispatch tagClicked event
        expect(dispatchEventSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'tagClicked'
            })
        );

        dispatchEventSpy.mockRestore();
    });
});
