import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AutoplayCountdown from '../../../components/player/AutoplayCountdown';

describe('AutoplayCountdown', () => {
    const mockOnCancel = jest.fn();
    const mockOnPlayNow = jest.fn();
    const defaultProps = {
        nextVideoInfo: { topic: 'React Basics', lesson: 'Introduction to Hooks' },
        onCancel: mockOnCancel,
        onPlayNow: mockOnPlayNow,
        countdownDuration: 10
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('renders countdown overlay with correct structure', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        const upNextElements = screen.getAllByText('Up Next');
        expect(upNextElements.length).toBeGreaterThan(0);
        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.getByText('Introduction to Hooks')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('renders cancel button', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        const cancelButtons = screen.getAllByText('Cancel');
        expect(cancelButtons.length).toBeGreaterThan(0);
    });

    test('renders play now button', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        expect(screen.getByText('Play Now')).toBeInTheDocument();
    });

    test('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<AutoplayCountdown {...defaultProps} />);

        const cancelButton = screen.getAllByText('Cancel')[0];
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnPlayNow).not.toHaveBeenCalled();
    });

    test('calls onPlayNow when play now button is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<AutoplayCountdown {...defaultProps} />);

        const playNowButton = screen.getByText('Play Now');
        await user.click(playNowButton);

        expect(mockOnPlayNow).toHaveBeenCalledTimes(1);
        expect(mockOnCancel).not.toHaveBeenCalled();
    });

    test('decrements countdown every second', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        expect(screen.getByText('10')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText('9')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText('8')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(3000);
        });
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('calls onPlayNow when countdown reaches 0', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(mockOnPlayNow).toHaveBeenCalledTimes(1);
    });

    test('does not call onPlayNow before countdown finishes', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(mockOnPlayNow).not.toHaveBeenCalled();
    });

    test('renders topic name when provided', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    test('does not render topic name when not provided', () => {
        const propsWithoutTopic = {
            ...defaultProps,
            nextVideoInfo: { topic: '', lesson: 'Introduction to Hooks' }
        };

        render(<AutoplayCountdown {...propsWithoutTopic} />);

        expect(screen.queryByText('React Basics')).not.toBeInTheDocument();
        expect(screen.getByText('Introduction to Hooks')).toBeInTheDocument();
    });

    test('renders lesson name correctly', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        expect(screen.getByText('Introduction to Hooks')).toBeInTheDocument();
    });

    test('renders "Next video" when no video info provided', () => {
        const propsWithNoInfo = {
            ...defaultProps,
            nextVideoInfo: null
        };

        render(<AutoplayCountdown {...propsWithNoInfo} />);

        expect(screen.getByText('Next video')).toBeInTheDocument();
    });

    test('renders with custom countdown duration', () => {
        const propsWithCustomDuration = {
            ...defaultProps,
            countdownDuration: 5
        };

        render(<AutoplayCountdown {...propsWithCustomDuration} />);

        expect(screen.getByText('5')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('clears interval when cancel is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<AutoplayCountdown {...defaultProps} />);

        const cancelButton = screen.getAllByText('Cancel')[0];
        await user.click(cancelButton);

        // Advance time after cancel
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        // Should not call onPlayNow since it was canceled
        expect(mockOnPlayNow).not.toHaveBeenCalled();
    });

    test('clears interval when play now is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<AutoplayCountdown {...defaultProps} />);

        const playNowButton = screen.getByText('Play Now');
        await user.click(playNowButton);

        expect(mockOnPlayNow).toHaveBeenCalledTimes(1);

        // Advance time after play now
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        // Should only be called once (not again after timer)
        expect(mockOnPlayNow).toHaveBeenCalledTimes(1);
    });

    test('cleans up interval on unmount', () => {
        const { unmount } = render(<AutoplayCountdown {...defaultProps} />);

        unmount();

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(mockOnPlayNow).not.toHaveBeenCalled();
    });

    test('renders circular progress SVG', () => {
        const { container } = render(<AutoplayCountdown {...defaultProps} />);

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();

        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBeGreaterThanOrEqual(2); // Background and progress circles
    });

    test('renders close button in header', () => {
        render(<AutoplayCountdown {...defaultProps} />);

        const closeButtons = screen.getAllByLabelText('Cancel autoplay');
        expect(closeButtons.length).toBeGreaterThan(0);
    });

    test('calls onCancel when close button in header is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<AutoplayCountdown {...defaultProps} />);

        const closeButton = screen.getByLabelText('Cancel autoplay');
        await user.click(closeButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    test('countdown starts from provided duration', () => {
        const propsWithDuration15 = {
            ...defaultProps,
            countdownDuration: 15
        };

        render(<AutoplayCountdown {...propsWithDuration15} />);

        expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('handles countdown of 1 second correctly', () => {
        const propsWithDuration1 = {
            ...defaultProps,
            countdownDuration: 1
        };

        render(<AutoplayCountdown {...propsWithDuration1} />);

        expect(screen.getByText('1')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockOnPlayNow).toHaveBeenCalledTimes(1);
    });

    test('renders overlay with correct class names', () => {
        const { container } = render(<AutoplayCountdown {...defaultProps} />);

        expect(container.querySelector('.autoplay-countdown-overlay')).toBeInTheDocument();
        expect(container.querySelector('.autoplay-countdown-container')).toBeInTheDocument();
        expect(container.querySelector('.countdown-header')).toBeInTheDocument();
        expect(container.querySelector('.countdown-content')).toBeInTheDocument();
        expect(container.querySelector('.countdown-actions')).toBeInTheDocument();
    });

    test('renders video details with correct class names', () => {
        const { container } = render(<AutoplayCountdown {...defaultProps} />);

        expect(container.querySelector('.countdown-video-details')).toBeInTheDocument();
        expect(container.querySelector('.countdown-label')).toBeInTheDocument();
        expect(container.querySelector('.countdown-topic-name')).toBeInTheDocument();
        expect(container.querySelector('.countdown-video-name')).toBeInTheDocument();
    });

    test('handles undefined nextVideoInfo gracefully', () => {
        const propsWithUndefined = {
            ...defaultProps,
            nextVideoInfo: undefined
        };

        render(<AutoplayCountdown {...propsWithUndefined} />);

        expect(screen.getByText('Next video')).toBeInTheDocument();
    });

    test('handles nextVideoInfo with missing lesson', () => {
        const propsWithMissingLesson = {
            ...defaultProps,
            nextVideoInfo: { topic: 'React Basics', lesson: '' }
        };

        render(<AutoplayCountdown {...propsWithMissingLesson} />);

        expect(screen.getByText('Next video')).toBeInTheDocument();
        expect(screen.getByText('React Basics')).toBeInTheDocument();
    });
});
