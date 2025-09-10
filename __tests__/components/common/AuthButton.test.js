import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthButton from '../../../components/common/AuthButton';

// Mock next-auth/react
jest.mock('next-auth/react');

const mockUseSession = require('next-auth/react').useSession;
const mockSignIn = require('next-auth/react').signIn;
const mockSignOut = require('next-auth/react').signOut;

// Create mock functions
jest.mocked(mockSignIn);
jest.mocked(mockSignOut);

describe('AuthButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows loading state when session is loading', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading'
        });

        render(<AuthButton />);

        const loadingButton = screen.getByRole('button');
        expect(loadingButton).toHaveTextContent('Loading...');
        expect(loadingButton).toHaveClass('auth-btn--loading');
        expect(loadingButton).toBeDisabled();
        expect(screen.getByTestId || screen.querySelector('.auth-spinner')).toBeInTheDocument;
    });

    test('shows sign in button when no session', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        render(<AuthButton />);

        const signInButton = screen.getByRole('button');
        expect(signInButton).toHaveTextContent('Sign in');
        expect(signInButton).toHaveClass('auth-btn--signin');
        expect(signInButton).not.toBeDisabled();
    });

    test('calls signIn when sign in button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        const user = userEvent.setup();
        render(<AuthButton />);

        const signInButton = screen.getByRole('button');
        await user.click(signInButton);

        expect(mockSignIn).toHaveBeenCalledTimes(1);
    });

    test('shows user info and sign out button when session exists', () => {
        const mockSession = {
            user: {
                name: 'John Doe',
                email: 'john@example.com',
                image: 'https://example.com/avatar.jpg'
            }
        };

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<AuthButton />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        expect(screen.getByRole('img')).toHaveAttribute('alt', 'John Doe');
        
        const signOutButton = screen.getByText('Sign out');
        expect(signOutButton).toHaveClass('auth-btn--signout');
    });

    test('shows user info without image when no image provided', () => {
        const mockSession = {
            user: {
                name: 'Jane Doe',
                email: 'jane@example.com'
                // No image property
            }
        };

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<AuthButton />);

        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('calls signOut when sign out button is clicked', async () => {
        const mockSession = {
            user: {
                name: 'John Doe',
                email: 'john@example.com'
            }
        };

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        const user = userEvent.setup();
        render(<AuthButton />);

        const signOutButton = screen.getByText('Sign out');
        await user.click(signOutButton);

        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    test('has correct CSS classes for different states', () => {
        // Test loading state
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading'
        });

        const {rerender} = render(<AuthButton />);
        expect(screen.getByRole('button')).toHaveClass('auth-btn', 'auth-btn--loading');

        // Test unauthenticated state
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        rerender(<AuthButton />);
        expect(screen.getByRole('button')).toHaveClass('auth-btn', 'auth-btn--signin');

        // Test authenticated state
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test', email: 'test@example.com' } },
            status: 'authenticated'
        });

        rerender(<AuthButton />);
        const signOutButton = screen.getByText('Sign out');
        expect(signOutButton).toHaveClass('auth-btn', 'auth-btn--signout');
    });

    test('renders correct structure for authenticated user', () => {
        const mockSession = {
            user: {
                name: 'Test User',
                email: 'test@example.com',
                image: 'https://example.com/avatar.jpg'
            }
        };

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated'
        });

        render(<AuthButton />);

        const userInfo = screen.getByText('Test User').closest('.auth-user-info');
        expect(userInfo).toBeInTheDocument();
        
        const userDetails = screen.getByText('Test User').closest('.auth-user-details');
        expect(userDetails).toBeInTheDocument();
        
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveClass('auth-user-avatar');
        
        const userText = screen.getByText('Test User').closest('.auth-user-text');
        expect(userText).toBeInTheDocument();
        
        const userName = screen.getByText('Test User');
        expect(userName).toHaveClass('auth-user-name');
        
        const userEmail = screen.getByText('test@example.com');
        expect(userEmail).toHaveClass('auth-user-email');
    });
});