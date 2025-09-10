import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../components/common/ThemeToggle';

// Mock the ThemeContext
jest.mock('../../../contexts/ThemeContext');

const mockUseTheme = require('../../../contexts/ThemeContext').useTheme;

describe('ThemeToggle', () => {
    const mockToggleTheme = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders theme toggle button with light theme', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('theme-toggle');
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
        expect(button).toHaveAttribute('title', 'Switch to dark mode');
        expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    test('renders theme toggle button with dark theme', () => {
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            isDark: true
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
        expect(button).toHaveAttribute('title', 'Switch to light mode');
        expect(screen.getByText('Light')).toBeInTheDocument();
    });

    test('calls toggleTheme when button is clicked', async () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        const user = userEvent.setup();
        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    test('renders correct structure and CSS classes', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('theme-toggle');

        const track = button.querySelector('.theme-toggle-track');
        expect(track).toBeInTheDocument();

        const thumb = track.querySelector('.theme-toggle-thumb');
        expect(thumb).toBeInTheDocument();

        const label = button.querySelector('.theme-toggle-label');
        expect(label).toBeInTheDocument();
        expect(label).toHaveTextContent('Dark');
    });

    test('displays sun icon when in dark mode', () => {
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            isDark: true
        });

        render(<ThemeToggle />);

        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('width', '14');
        expect(svg).toHaveAttribute('height', '14');
        
        // Check for sun icon elements
        const circle = svg.querySelector('circle[cx="12"][cy="12"][r="5"]');
        expect(circle).toBeInTheDocument();
        
        const sunRays = svg.querySelector('path[d*="M12 1v2"]');
        expect(sunRays).toBeInTheDocument();
    });

    test('displays moon icon when in light mode', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        render(<ThemeToggle />);

        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toBeInTheDocument();
        
        // Check for moon icon
        const moonPath = svg.querySelector('path[d*="M21 12.79A9 9 0 1 1 11.21 3"]');
        expect(moonPath).toBeInTheDocument();
    });

    test('has consistent SVG properties for both icons', () => {
        // Test light mode (moon icon)
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        const {rerender} = render(<ThemeToggle />);

        let svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveAttribute('width', '14');
        expect(svg).toHaveAttribute('height', '14');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
        expect(svg).toHaveAttribute('stroke-width', '2');

        // Test dark mode (sun icon)
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            isDark: true
        });

        rerender(<ThemeToggle />);

        svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveAttribute('width', '14');
        expect(svg).toHaveAttribute('height', '14');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
        expect(svg).toHaveAttribute('stroke-width', '2');
    });

    test('updates label text based on current theme', () => {
        // Test light mode shows "Dark" label
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        const {rerender} = render(<ThemeToggle />);
        expect(screen.getByText('Dark')).toBeInTheDocument();

        // Test dark mode shows "Light" label
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            isDark: true
        });

        rerender(<ThemeToggle />);
        expect(screen.getByText('Light')).toBeInTheDocument();
    });

    test('updates accessibility attributes based on current theme', () => {
        // Test light mode accessibility
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
            isDark: false
        });

        const {rerender} = render(<ThemeToggle />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
        expect(button).toHaveAttribute('title', 'Switch to dark mode');

        // Test dark mode accessibility
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
            isDark: true
        });

        rerender(<ThemeToggle />);
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
        expect(button).toHaveAttribute('title', 'Switch to light mode');
    });

    test('throws error when used outside ThemeProvider', () => {
        mockUseTheme.mockImplementation(() => {
            throw new Error('useTheme must be used within a ThemeProvider');
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        expect(() => render(<ThemeToggle />)).toThrow('useTheme must be used within a ThemeProvider');

        consoleSpy.mockRestore();
    });
});