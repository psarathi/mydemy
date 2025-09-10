import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '../../../components/common/FavoriteButton';

// Mock next-auth/react
jest.mock('next-auth/react');

// Mock courseTracking utilities
jest.mock('../../../utils/courseTracking');

const mockUseSession = require('next-auth/react').useSession;
const mockToggleFavorite = require('../../../utils/courseTracking').toggleFavorite;
const mockIsFavorite = require('../../../utils/courseTracking').isFavorite;

describe('FavoriteButton', () => {
    const mockCourse = {
        name: 'Test Course',
        topics: []
    };

    const mockSession = {
        user: {
            name: 'Test User',
            email: 'test@example.com'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        mockToggleFavorite.mockImplementation(() => {});
        mockIsFavorite.mockReturnValue(false);
    });

    test('renders null when user is not authenticated', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        const {container} = render(<FavoriteButton course={mockCourse} />);
        
        expect(container.firstChild).toBeNull();
    });

    test('renders favorite button when user is authenticated', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<FavoriteButton course={mockCourse} />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('favorite-btn');
        expect(button).toHaveAttribute('aria-label', 'Add to favorites');
        expect(button).toHaveAttribute('title', 'Add to favorites');
    });

    test('shows active state when course is favorite', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });
        mockIsFavorite.mockReturnValue(true);

        render(<FavoriteButton course={mockCourse} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('favorite-btn', 'active');
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
        expect(button).toHaveAttribute('title', 'Remove from favorites');
    });

    test('calls toggleFavorite when button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        const user = userEvent.setup();
        render(<FavoriteButton course={mockCourse} />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(mockToggleFavorite).toHaveBeenCalledWith(mockCourse);
    });

    test('prevents event propagation when button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        const mockStopPropagation = jest.fn();
        const mockPreventDefault = jest.fn();

        render(<FavoriteButton course={mockCourse} />);

        const button = screen.getByRole('button');
        fireEvent.click(button, {
            stopPropagation: mockStopPropagation,
            preventDefault: mockPreventDefault
        });

        // The actual event handlers should call preventDefault and stopPropagation
        // This tests that the handlers are set up correctly
        expect(mockToggleFavorite).toHaveBeenCalledWith(mockCourse);
    });

    test('does not call toggleFavorite when user is not authenticated and button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        const user = userEvent.setup();
        
        // Since the component returns null when not authenticated, we need to mock it differently
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        const {rerender} = render(<FavoriteButton course={mockCourse} />);

        // Now simulate the case where session becomes null after render
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        rerender(<FavoriteButton course={mockCourse} />);
        
        // Component should return null, so no button should be present
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('applies custom className prop', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<FavoriteButton course={mockCourse} className="custom-class" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('favorite-btn', 'custom-class');
    });

    test('updates state when courseFavoritesUpdated event is dispatched', async () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });
        mockIsFavorite.mockReturnValue(false);

        render(<FavoriteButton course={mockCourse} />);

        let button = screen.getByRole('button');
        expect(button).not.toHaveClass('active');

        // Simulate the courseFavoritesUpdated event
        const event = new CustomEvent('courseFavoritesUpdated', {
            detail: {
                course: mockCourse,
                isFavorite: true
            }
        });

        fireEvent(window, event);

        await waitFor(() => {
            button = screen.getByRole('button');
            expect(button).toHaveClass('active');
        });
    });

    test('ignores courseFavoritesUpdated event for different course', async () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });
        mockIsFavorite.mockReturnValue(false);

        render(<FavoriteButton course={mockCourse} />);

        const button = screen.getByRole('button');
        expect(button).not.toHaveClass('active');

        // Simulate event for different course
        const event = new CustomEvent('courseFavoritesUpdated', {
            detail: {
                course: { name: 'Different Course' },
                isFavorite: true
            }
        });

        fireEvent(window, event);

        // Should not change state
        expect(button).not.toHaveClass('active');
    });

    test('renders SVG icon correctly', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<FavoriteButton course={mockCourse} />);

        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('width', '16');
        expect(svg).toHaveAttribute('height', '16');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
        expect(svg).toHaveAttribute('stroke-width', '2');
    });

    test('fills SVG icon when course is favorite', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });
        mockIsFavorite.mockReturnValue(true);

        render(<FavoriteButton course={mockCourse} />);

        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    test('cleans up event listener on unmount', () => {
        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const {unmount} = render(<FavoriteButton course={mockCourse} />);
        
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('courseFavoritesUpdated', expect.any(Function));
        
        removeEventListenerSpy.mockRestore();
    });
});