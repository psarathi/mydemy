import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AudioSettings from '../../../components/player/AudioSettings';

describe('AudioSettings', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        captionsAvailable: true,
        captionsEnabled: true,
        onCaptionsChange: jest.fn(),
        audioTracks: [],
        selectedAudioTrack: 'original',
        onAudioTrackChange: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    test('does not render while closed', () => {
        const {container} = render(
            <AudioSettings {...defaultProps} isOpen={false} />
        );

        expect(container.firstChild).toBeNull();
    });

    test('lets a learner turn subtitles off', () => {
        render(<AudioSettings {...defaultProps} />);

        fireEvent.change(screen.getByLabelText('Subtitles'), {
            target: {value: 'off'},
        });

        expect(defaultProps.onCaptionsChange).toHaveBeenCalledWith(false);
    });

    test('shows and selects available audio languages', () => {
        const tracks = [
            {id: '0', label: 'English'},
            {id: '1', label: 'Spanish'},
        ];
        render(<AudioSettings {...defaultProps} audioTracks={tracks} />);

        const audioLanguage = screen.getByLabelText('Audio language');
        expect(audioLanguage).toHaveTextContent('English');
        expect(audioLanguage).toHaveTextContent('Spanish');

        fireEvent.change(audioLanguage, {target: {value: '1'}});
        expect(defaultProps.onAudioTrackChange).toHaveBeenCalledWith('1');
    });

    test('explains when no subtitles or alternate audio exist', () => {
        render(<AudioSettings {...defaultProps} captionsAvailable={false} />);

        expect(screen.getByText('Subtitles are not available for this lesson.')).toBeInTheDocument();
        expect(screen.getByText('This video has one audio track.')).toBeInTheDocument();
    });
});
