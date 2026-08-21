import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoPlayer from '../../../components/player/VideoPlayer';

// Mock the child components
jest.mock('../../../components/player/AutoplayCountdown', () => {
    return function MockAutoplayCountdown({ nextVideoInfo, onCancel, onPlayNow }) {
        return (
            <div data-testid="autoplay-countdown">
                <span>{nextVideoInfo?.lesson || 'Next video'}</span>
                <button onClick={onCancel}>Cancel</button>
                <button onClick={onPlayNow}>Play Now</button>
            </div>
        );
    };
});

jest.mock('../../../components/player/VideoSettings', () => {
    return function MockVideoSettings({ isOpen, onClose }) {
        if (!isOpen) return null;
        return (
            <div data-testid="video-settings">
                <button onClick={onClose}>Close</button>
            </div>
        );
    };
});

jest.mock('../../../components/player/AudioSettings', () => {
    return function MockAudioSettings({ isOpen, onClose, captionsEnabled, onCaptionsChange }) {
        if (!isOpen) return null;
        return (
            <div data-testid="audio-settings">
                <span>{captionsEnabled ? 'Captions on' : 'Captions off'}</span>
                <button onClick={() => onCaptionsChange(false)}>Disable captions</button>
                <button onClick={onClose}>Close audio settings</button>
            </div>
        );
    };
});

describe('VideoPlayer', () => {
    const mockGetNextVideo = jest.fn();
    const defaultProps = {
        videoFile: 'courses/react/basics/intro.mp4',
        subtitlesFile: 'courses/react/basics/intro.vtt',
        getNextVideo: mockGetNextVideo
    };

    let localStorageGetItemSpy;
    let localStorageSetItemSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageGetItemSpy = jest.spyOn(Storage.prototype, 'getItem');
        localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
        localStorageGetItemSpy.mockReturnValue(null);

        mockGetNextVideo.mockReturnValue({
            name: 'courses/react/hooks/useState.mp4',
            subtitles: 'courses/react/hooks/useState.vtt'
        });

        // Mock video element methods
        window.HTMLMediaElement.prototype.load = jest.fn();
        window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
        window.HTMLMediaElement.prototype.pause = jest.fn();

        // Mock textTracks
        Object.defineProperty(window.HTMLMediaElement.prototype, 'textTracks', {
            get: () => [{mode: 'disabled'}],
            configurable: true
        });
    });

    afterEach(() => {
        localStorageGetItemSpy.mockRestore();
        localStorageSetItemSpy.mockRestore();
    });

    test('renders video player with video element', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        expect(video).toBeInTheDocument();
    });

    test('renders video title', () => {
        render(<VideoPlayer {...defaultProps} />);

        expect(screen.getByText(/intro/i)).toBeInTheDocument();
    });

    test('renders play/pause button', () => {
        render(<VideoPlayer {...defaultProps} />);

        const playPauseButton = screen.getByLabelText('Toggle play/pause');
        expect(playPauseButton).toBeInTheDocument();
    });

    test('renders next video button', () => {
        render(<VideoPlayer {...defaultProps} />);

        const nextButton = screen.getByLabelText('Next video');
        expect(nextButton).toBeInTheDocument();
    });

    test('renders settings button', () => {
        render(<VideoPlayer {...defaultProps} />);

        const settingsButton = screen.getByLabelText('Video settings');
        expect(settingsButton).toBeInTheDocument();
    });

    test('opens audio and subtitles settings', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        await user.click(screen.getByLabelText('Audio and subtitles settings'));

        expect(screen.getByTestId('audio-settings')).toBeInTheDocument();
        expect(screen.getByText('Captions on')).toBeInTheDocument();
    });

    test('allows captions to be disabled from audio settings', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        await user.click(screen.getByLabelText('Audio and subtitles settings'));
        await user.click(screen.getByText('Disable captions'));

        expect(screen.getByText('Captions off')).toBeInTheDocument();
    });

    test('opens settings modal when settings button is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const settingsButton = screen.getByLabelText('Video settings');
        await user.click(settingsButton);

        expect(screen.getByTestId('video-settings')).toBeInTheDocument();
    });

    test('closes settings modal when close is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const settingsButton = screen.getByLabelText('Video settings');
        await user.click(settingsButton);

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        expect(screen.queryByTestId('video-settings')).not.toBeInTheDocument();
    });

    test('shows countdown when video ends', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        expect(screen.getByTestId('autoplay-countdown')).toBeInTheDocument();
    });

    test('calls getNextVideo when video ends', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        expect(mockGetNextVideo).toHaveBeenCalled();
    });

    test('hides countdown when cancel is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(screen.queryByTestId('autoplay-countdown')).not.toBeInTheDocument();
    });

    test('plays next video when Play Now is clicked in countdown', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        const playNowButton = screen.getByText('Play Now');
        await user.click(playNowButton);

        expect(video.load).toHaveBeenCalled();
        expect(screen.queryByTestId('autoplay-countdown')).not.toBeInTheDocument();
    });

    test('waits for next source to render before playing from countdown', async () => {
        const user = userEvent.setup();
        const playedSources = [];
        window.HTMLMediaElement.prototype.play = jest.fn(() => {
            playedSources.push(document.querySelector('source')?.getAttribute('src'));
            return Promise.resolve();
        });
        render(<VideoPlayer {...defaultProps} />);
        playedSources.length = 0;

        const video = document.querySelector('video');
        fireEvent.ended(video);

        await user.click(screen.getByText('Play Now'));
        await waitFor(() => {
            expect(playedSources.some((src) => src?.includes('useState.mp4'))).toBe(true);
        });
        expect(playedSources).not.toContain(
            expect.stringContaining('intro.mp4')
        );
    });

    test('shows next video button when clicking next', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const nextButton = screen.getByLabelText('Next video');
        await user.click(nextButton);

        expect(mockGetNextVideo).toHaveBeenCalled();
        expect(screen.queryByTestId('autoplay-countdown')).not.toBeInTheDocument();
        expect(screen.getByText(/useState/i)).toBeInTheDocument();
    });

    test('does not reload the same video when progress start time changes', () => {
        const {rerender} = render(<VideoPlayer {...defaultProps} startTime={0} />);
        const video = document.querySelector('video');
        video.load.mockClear();
        video.play.mockClear();

        rerender(<VideoPlayer {...defaultProps} startTime={42} />);

        expect(video.load).not.toHaveBeenCalled();
        expect(video.play).not.toHaveBeenCalled();
        expect(document.querySelector('source').getAttribute('src')).toContain('intro.mp4');
    });

    test('does not reload the same video when parent callbacks change', () => {
        const firstGetNextVideo = jest.fn(() => ({
            name: 'courses/react/hooks/useState.mp4',
            subtitles: 'courses/react/hooks/useState.vtt',
        }));
        const secondGetNextVideo = jest.fn(() => ({
            name: 'courses/react/hooks/useEffect.mp4',
            subtitles: 'courses/react/hooks/useEffect.vtt',
        }));
        const {rerender} = render(
            <VideoPlayer {...defaultProps} getNextVideo={firstGetNextVideo} />
        );
        const video = document.querySelector('video');
        video.load.mockClear();
        video.play.mockClear();

        rerender(
            <VideoPlayer {...defaultProps} getNextVideo={secondGetNextVideo} />
        );

        expect(video.load).not.toHaveBeenCalled();
        expect(video.play).not.toHaveBeenCalled();
        expect(document.querySelector('source').getAttribute('src')).toContain('intro.mp4');
    });

    test('keeps beforeunload progress handler stable across parent rerenders', () => {
        const firstProgress = jest.fn();
        const secondProgress = jest.fn();
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const {rerender, unmount} = render(
            <VideoPlayer {...defaultProps} onProgress={firstProgress} />
        );
        firstProgress.mockClear();
        addEventListenerSpy.mockClear();
        removeEventListenerSpy.mockClear();

        rerender(<VideoPlayer {...defaultProps} onProgress={secondProgress} />);

        expect(removeEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
        expect(firstProgress).not.toHaveBeenCalled();

        fireEvent(window, new Event('beforeunload'));
        expect(secondProgress).toHaveBeenCalled();

        unmount();
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    test('loads countdown duration from localStorage', () => {
        localStorageGetItemSpy.mockReturnValue('15');

        render(<VideoPlayer {...defaultProps} />);

        expect(localStorageGetItemSpy).toHaveBeenCalledWith('autoplayCountdownDuration');
    });

    test('listens for autoplaySettingsUpdated event', () => {
        render(<VideoPlayer {...defaultProps} />);

        const event = new CustomEvent('autoplaySettingsUpdated', {
            detail: { countdownDuration: 25 }
        });

        fireEvent(window, event);

        // Countdown duration should be updated (verified in next countdown display)
        const video = document.querySelector('video');
        fireEvent.ended(video);

        // The component should have received the new duration
        expect(screen.getByTestId('autoplay-countdown')).toBeInTheDocument();
    });

    test('renders placeholder when no video is provided', () => {
        const propsWithNoVideo = {
            ...defaultProps,
            videoFile: null
        };

        render(<VideoPlayer {...propsWithNoVideo} />);

        expect(screen.getByText('Ready to Learn')).toBeInTheDocument();
        expect(screen.getByText('Select a lesson from the sidebar to start watching')).toBeInTheDocument();
    });

    test('video has correct attributes', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        expect(video).toHaveAttribute('controls');
        expect(video).toHaveAttribute('autoPlay');
        expect(video).toHaveAttribute('playsInline');
        expect(video).toHaveAttribute('controlsList', 'nodownload');
    });

    test('renders video source with correct path', () => {
        render(<VideoPlayer {...defaultProps} />);

        const source = document.querySelector('source');
        expect(source).toBeInTheDocument();
        expect(source.getAttribute('src')).toContain('intro.mp4');
    });

    test('updates playing state when video plays', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.play(video);

        // Button should show pause icon (check aria-label stays the same but icon changes)
        const playPauseButton = screen.getByLabelText('Toggle play/pause');
        expect(playPauseButton).toBeInTheDocument();
    });

    test('updates playing state when video pauses', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.play(video);
        fireEvent.pause(video);

        const playPauseButton = screen.getByLabelText('Toggle play/pause');
        expect(playPauseButton).toBeInTheDocument();
    });

    test('toggles play/pause when button is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        Object.defineProperty(video, 'paused', { value: true, writable: true });

        const playPauseButton = screen.getByLabelText('Toggle play/pause');
        await user.click(playPauseButton);

        expect(video.play).toHaveBeenCalled();
    });

    test('toggles play/pause with keyboard shortcuts', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        Object.defineProperty(video, 'paused', { value: true, writable: true });

        fireEvent.keyDown(document, {key: 'k'});

        expect(video.play).toHaveBeenCalled();
    });

    test('seeks with keyboard shortcuts', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        Object.defineProperty(video, 'currentTime', { value: 20, writable: true });
        Object.defineProperty(video, 'duration', { value: 125, writable: true });

        fireEvent.keyDown(document, {key: 'l'});
        expect(video.currentTime).toBe(30);

        fireEvent.keyDown(document, {key: 'j'});
        expect(video.currentTime).toBe(20);
    });

    test('moves between lessons with keyboard shortcuts', () => {
        const getPreviousVideo = jest.fn(() => ({
            name: 'courses/react/setup/install.mp4',
            subtitles: 'courses/react/setup/install.vtt',
        }));
        render(
            <VideoPlayer
                {...defaultProps}
                getPreviousVideo={getPreviousVideo}
            />
        );

        fireEvent.keyDown(document, {key: 'n'});
        expect(mockGetNextVideo).toHaveBeenCalled();
        expect(screen.getByText(/useState/i)).toBeInTheDocument();

        fireEvent.keyDown(document, {key: 'p'});
        expect(getPreviousVideo).toHaveBeenCalled();
        expect(screen.getByText(/install/i)).toBeInTheDocument();
    });

    test('shows keyboard shortcuts help', () => {
        render(<VideoPlayer {...defaultProps} />);

        fireEvent.keyDown(document, {key: '?'});

        expect(screen.getByRole('dialog', {name: 'Keyboard shortcuts'})).toBeInTheDocument();
        expect(screen.getByText('Space / K')).toBeInTheDocument();
    });

    test('does not trigger player shortcuts from editable fields', () => {
        render(
            <>
                <textarea aria-label='Draft note' />
                <VideoPlayer {...defaultProps} />
            </>
        );

        window.HTMLMediaElement.prototype.play.mockClear();
        const textarea = screen.getByLabelText('Draft note');
        textarea.focus();
        fireEvent.keyDown(textarea, {key: 'k'});

        expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    });

    test('pauses the video before capturing a note', async () => {
        const user = userEvent.setup();
        const onCaptureNote = jest.fn();
        render(<VideoPlayer {...defaultProps} onCaptureNote={onCaptureNote} />);

        const video = document.querySelector('video');
        Object.defineProperty(video, 'currentTime', {value: 67, writable: true});

        await user.click(screen.getByLabelText('Add note at current timestamp'));

        expect(video.pause).toHaveBeenCalled();
        expect(onCaptureNote).toHaveBeenCalledWith(67);
    });

    test('displays video duration when loaded', () => {
        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        Object.defineProperty(video, 'duration', { value: 125, writable: false });

        fireEvent.loadedMetadata(video);

        // Duration should be displayed as (2:05)
        expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });

    test('renders next video info correctly in countdown', () => {
        mockGetNextVideo.mockReturnValue({
            name: 'courses/react/hooks/useState.mp4',
            subtitles: 'courses/react/hooks/useState.vtt'
        });

        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        // Should show lesson name from path
        expect(screen.getByText('useState')).toBeInTheDocument();
    });

    test('extracts topic name from video path', () => {
        mockGetNextVideo.mockReturnValue({
            name: 'courses/react/advanced-patterns/useState.mp4',
            subtitles: 'courses/react/advanced-patterns/useState.vtt'
        });

        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.ended(video);

        const countdown = screen.getByTestId('autoplay-countdown');
        expect(countdown).toBeInTheDocument();
    });

    test('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const { unmount } = render(<VideoPlayer {...defaultProps} />);

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('autoplaySettingsUpdated', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    test('renders video fallback message', () => {
        render(<VideoPlayer {...defaultProps} />);

        expect(screen.getByText(/Your browser doesn't support HTML5 video/)).toBeInTheDocument();
    });

    test('shows default message when no lesson is selected', () => {
        const propsWithNoVideo = {
            ...defaultProps,
            videoFile: null
        };

        render(<VideoPlayer {...propsWithNoVideo} />);

        expect(screen.getByText('Select a lesson to start watching')).toBeInTheDocument();
    });

    test('handles video error gracefully', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<VideoPlayer {...defaultProps} />);

        const video = document.querySelector('video');
        fireEvent.error(video);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Video error:', expect.any(Object));

        consoleErrorSpy.mockRestore();
    });
});
