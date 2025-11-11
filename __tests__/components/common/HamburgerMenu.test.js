/**
 * @jest-environment jsdom
 */

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HamburgerMenu from '../../../components/common/HamburgerMenu';

// Mock next-auth/react
jest.mock('next-auth/react');

// Mock AuthButton component
jest.mock('../../../components/common/AuthButton', () => {
    return function MockAuthButton() {
        return <div data-testid="auth-button">Auth Button</div>;
    };
});

const mockUseSession = require('next-auth/react').useSession;

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

describe('HamburgerMenu', () => {
    const mockSession = {
        user: {
            name: 'Test User',
            email: 'test@example.com'
        }
    };

    const mockHistory = [
        { name: 'Course 1', viewedAt: '2023-01-01T00:00:00.000Z', topics: [] },
        { name: 'Course 2', viewedAt: '2023-01-02T00:00:00.000Z', topics: [] }
    ];

    const mockFavorites = [
        { name: 'Favorite Course 1', topics: [{}, {}] },
        { name: 'Favorite Course 2', topics: [{}] }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
    });

    test('renders hamburger menu button', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

        render(<HamburgerMenu />);

        const button = screen.getByRole('button', { name: 'Toggle menu' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('hamburger-btn');
        expect(button.querySelectorAll('.hamburger-line')).toHaveLength(3);
    });

    test('opens and closes menu when hamburger button is clicked', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        const user = userEvent.setup();

        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        
        // Initially closed
        expect(toggleButton).not.toHaveClass('open');
        // Menu content is rendered but sidebar is not shown with 'open' class

        // Open menu
        await user.click(toggleButton);
        expect(toggleButton).toHaveClass('open');
        expect(screen.getByTestId('auth-button')).toBeInTheDocument();

        // Close menu
        await user.click(toggleButton);
        expect(toggleButton).not.toHaveClass('open');
    });

    test('renders overlay when menu is open', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        const user = userEvent.setup();

        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const overlay = document.querySelector('.hamburger-overlay');
        expect(overlay).toBeInTheDocument();
    });

    test('closes menu when overlay is clicked', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        const user = userEvent.setup();

        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const overlay = document.querySelector('.hamburger-overlay');
        await user.click(overlay);

        expect(toggleButton).not.toHaveClass('open');
    });

    test('closes menu when close button is clicked', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        const user = userEvent.setup();

        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const closeButton = screen.getByRole('button', { name: 'Close menu' });
        await user.click(closeButton);

        expect(toggleButton).not.toHaveClass('open');
    });

    test('loads history and favorites from localStorage on mount', () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem
            .mockReturnValueOnce(JSON.stringify(mockHistory))
            .mockReturnValueOnce(JSON.stringify(mockFavorites));

        render(<HamburgerMenu />);

        expect(localStorageMock.getItem).toHaveBeenCalledWith('courseHistory');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('courseFavorites');
    });

    test('shows favorites section even when not authenticated', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

        const {container} = render(<HamburgerMenu />);

        // Open menu to check content
        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        fireEvent.click(toggleButton);

        expect(screen.queryByText(/Favorites/)).toBeInTheDocument();
        expect(screen.queryByText(/Recently Viewed/)).toBeInTheDocument();
    });

    test('shows favorites section when authenticated', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFavorites));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.getByText(/Favorites \(2\)/)).toBeInTheDocument();
        expect(screen.getAllByText('Favorite Course 1')).toHaveLength(1);
        expect(screen.getAllByText('Favorite Course 2')).toHaveLength(1);
        expect(screen.getByText('2 topics')).toBeInTheDocument();
        expect(screen.getByText('1 topics')).toBeInTheDocument();
    });

    test('shows empty favorites state', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue('[]');
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.getByText(/Favorites \(0\)/)).toBeInTheDocument();
        expect(screen.getByText('No favorites yet')).toBeInTheDocument();
        expect(screen.getByText('Mark courses as favorites to see them here')).toBeInTheDocument();
    });

    test('shows recently viewed section when authenticated', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem
            .mockReturnValueOnce('[]')
            .mockReturnValueOnce(JSON.stringify(mockHistory));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.getByText(/Recently Viewed \(2\)/)).toBeInTheDocument();
        expect(screen.getByText('Course 1')).toBeInTheDocument();
        expect(screen.getByText('Course 2')).toBeInTheDocument();
        expect(screen.getByText('Viewed 1/1/2023')).toBeInTheDocument();
    });

    test('shows empty history state', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue('[]');
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.getByText(/Recently Viewed \(0\)/)).toBeInTheDocument();
        expect(screen.getByText('No recent courses')).toBeInTheDocument();
        expect(screen.getByText('Courses you view will appear here')).toBeInTheDocument();
    });

    test('limits history display to 10 items', async () => {
        const longHistory = Array.from({length: 15}, (_, i) => ({
            name: `Course ${i}`,
            viewedAt: '2023-01-01T00:00:00.000Z',
            topics: []
        }));

        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem
            .mockReturnValueOnce('[]')
            .mockReturnValueOnce(JSON.stringify(longHistory));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.getByText(/Recently Viewed \(15\)/)).toBeInTheDocument();
        
        // Should only display first 10 items
        expect(screen.getByText('Course 0')).toBeInTheDocument();
        expect(screen.getByText('Course 9')).toBeInTheDocument();
        expect(screen.queryByText('Course 10')).not.toBeInTheDocument();
    });

    test('clears history when clear button is clicked', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem
            .mockReturnValueOnce('[]')
            .mockReturnValueOnce(JSON.stringify(mockHistory));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const clearButton = screen.getByTitle('Clear history');
        await user.click(clearButton);

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('courseHistory');
        
        await waitFor(() => {
            expect(screen.getByText(/Recently Viewed \(0\)/)).toBeInTheDocument();
        });
    });

    test('does not show clear button when history is empty', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue('[]');
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        expect(screen.queryByTitle('Clear history')).not.toBeInTheDocument();
    });

    test('toggles favorite when favorite button is clicked', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFavorites));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const favoriteButtons = screen.getAllByRole('button', { name: 'Remove from favorites' });
        await user.click(favoriteButtons[0]);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'courseFavorites',
            expect.stringContaining('Favorite Course 2')
        );
    });

    test('can toggle favorites even when not authenticated', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFavorites));

        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        // Favorites should be visible
        expect(screen.getByText(/Favorites \(2\)/)).toBeInTheDocument();
        expect(screen.getByText('Favorite Course 1')).toBeInTheDocument();

        // Click remove favorite button
        const favoriteButtons = screen.getAllByLabelText('Remove from favorites');
        await user.click(favoriteButtons[0]);

        // Should update localStorage
        expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('updates state when courseHistoryUpdated event is fired', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue('[]');
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        // Initially no history
        expect(screen.getByText(/Recently Viewed \(0\)/)).toBeInTheDocument();

        // Fire custom event
        const event = new CustomEvent('courseHistoryUpdated', {
            detail: { history: mockHistory }
        });
        fireEvent(window, event);

        await waitFor(() => {
            expect(screen.getByText(/Recently Viewed \(2\)/)).toBeInTheDocument();
        });
    });

    test('updates state when courseFavoritesUpdated event is fired', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem.mockReturnValue('[]');
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        // Initially no favorites
        expect(screen.getByText(/Favorites \(0\)/)).toBeInTheDocument();

        // Fire custom event
        const event = new CustomEvent('courseFavoritesUpdated', {
            detail: { favorites: mockFavorites }
        });
        fireEvent(window, event);

        await waitFor(() => {
            expect(screen.getByText(/Favorites \(2\)/)).toBeInTheDocument();
        });
    });

    test('renders course links correctly', async () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        localStorageMock.getItem
            .mockReturnValueOnce(JSON.stringify(mockFavorites))
            .mockReturnValueOnce(JSON.stringify(mockHistory));
        
        const user = userEvent.setup();
        render(<HamburgerMenu />);

        const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
        await user.click(toggleButton);

        const favoriteLinks = screen.getAllByText('Favorite Course 1')[0].closest('a');
        expect(favoriteLinks).toHaveAttribute('href', '/Favorite Course 1');

        const historyLinks = screen.getAllByText('Course 1')[0].closest('a');
        expect(historyLinks).toHaveAttribute('href', '/Course 1');
    });

    test('cleans up event listeners on unmount', () => {
        mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
        
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        
        const {unmount} = render(<HamburgerMenu />);
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('courseHistoryUpdated', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('courseFavoritesUpdated', expect.any(Function));
        
        removeEventListenerSpy.mockRestore();
    });
});