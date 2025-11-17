import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagList from '../../../components/common/TagList';

// Mock tagging utilities
jest.mock('../../../utils/tagging');

const mockGetUniqueTags = require('../../../utils/tagging').getUniqueTags;

describe('TagList', () => {
    const mockOnTagClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUniqueTags.mockReturnValue([]);
    });

    test('renders empty state when there are no tags', () => {
        mockGetUniqueTags.mockReturnValue([]);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByText('No tags yet.')).toBeInTheDocument();
    });

    test('renders list of tags when tags exist', () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react', 'nodejs']);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getByText('Tags')).toBeInTheDocument();
        expect(screen.getByText('#javascript')).toBeInTheDocument();
        expect(screen.getByText('#react')).toBeInTheDocument();
        expect(screen.getByText('#nodejs')).toBeInTheDocument();
        expect(screen.queryByText('No tags yet.')).not.toBeInTheDocument();
    });

    test('calls onTagClick when a tag is clicked', async () => {
        const user = userEvent.setup();
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        const javascriptButton = screen.getByText('#javascript');
        await user.click(javascriptButton);

        expect(mockOnTagClick).toHaveBeenCalledWith('javascript');
        expect(mockOnTagClick).toHaveBeenCalledTimes(1);
    });

    test('calls onTagClick with correct tag for each tag clicked', async () => {
        const user = userEvent.setup();
        mockGetUniqueTags.mockReturnValue(['javascript', 'react', 'nodejs']);

        render(<TagList onTagClick={mockOnTagClick} />);

        await user.click(screen.getByText('#javascript'));
        expect(mockOnTagClick).toHaveBeenCalledWith('javascript');

        await user.click(screen.getByText('#react'));
        expect(mockOnTagClick).toHaveBeenCalledWith('react');

        await user.click(screen.getByText('#nodejs'));
        expect(mockOnTagClick).toHaveBeenCalledWith('nodejs');

        expect(mockOnTagClick).toHaveBeenCalledTimes(3);
    });

    test('renders tags in a list', () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(2);
    });

    test('each tag has a button element', () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveTextContent('#javascript');
        expect(buttons[1]).toHaveTextContent('#react');
    });

    test('updates tags when courseTagsUpdated event is dispatched', async () => {
        mockGetUniqueTags.mockReturnValue(['javascript']);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getByText('#javascript')).toBeInTheDocument();
        expect(screen.queryByText('#react')).not.toBeInTheDocument();

        // Update mock to return new tags
        mockGetUniqueTags.mockReturnValue(['javascript', 'react', 'nodejs']);

        // Dispatch the event
        const event = new CustomEvent('courseTagsUpdated');
        fireEvent(window, event);

        await waitFor(() => {
            expect(screen.getByText('#javascript')).toBeInTheDocument();
            expect(screen.getByText('#react')).toBeInTheDocument();
            expect(screen.getByText('#nodejs')).toBeInTheDocument();
        });
    });

    test('updates to empty state when all tags are removed', async () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getByText('#javascript')).toBeInTheDocument();

        // Update mock to return no tags
        mockGetUniqueTags.mockReturnValue([]);

        // Dispatch the event
        const event = new CustomEvent('courseTagsUpdated');
        fireEvent(window, event);

        await waitFor(() => {
            expect(screen.queryByText('#javascript')).not.toBeInTheDocument();
            expect(screen.getByText('No tags yet.')).toBeInTheDocument();
        });
    });

    test('renders tags with # prefix', () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        const javascriptButton = screen.getByText('#javascript');
        expect(javascriptButton).toBeInTheDocument();
        expect(javascriptButton.textContent).toBe('#javascript');

        const reactButton = screen.getByText('#react');
        expect(reactButton).toBeInTheDocument();
        expect(reactButton.textContent).toBe('#react');
    });

    test('cleans up event listener on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        mockGetUniqueTags.mockReturnValue(['javascript']);

        const { unmount } = render(<TagList onTagClick={mockOnTagClick} />);

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('courseTagsUpdated', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    test('handles single tag correctly', () => {
        mockGetUniqueTags.mockReturnValue(['javascript']);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getByText('#javascript')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    test('handles many tags correctly', () => {
        const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
        mockGetUniqueTags.mockReturnValue(manyTags);

        render(<TagList onTagClick={mockOnTagClick} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(20);
        expect(screen.getByText('#tag0')).toBeInTheDocument();
        expect(screen.getByText('#tag19')).toBeInTheDocument();
    });

    test('does not call onTagClick when tag is not clicked', () => {
        mockGetUniqueTags.mockReturnValue(['javascript', 'react']);

        render(<TagList onTagClick={mockOnTagClick} />);

        // Just render, don't click
        expect(mockOnTagClick).not.toHaveBeenCalled();
    });

    test('tag container has correct className', () => {
        mockGetUniqueTags.mockReturnValue(['javascript']);

        const { container } = render(<TagList onTagClick={mockOnTagClick} />);

        const tagList = container.querySelector('.tag-list');
        expect(tagList).toBeInTheDocument();
    });
});
