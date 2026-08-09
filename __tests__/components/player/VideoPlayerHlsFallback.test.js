import React from 'react';
import {render, waitFor} from '@testing-library/react';
import VideoPlayer from '../../../components/player/VideoPlayer';

jest.mock('hls.js', () => {
    class Hls {
        static isSupported = jest.fn(() => true);
        static Events = {
            MANIFEST_PARSED: 'manifestParsed',
            AUDIO_TRACKS_UPDATED: 'audioTracksUpdated',
            ERROR: 'error',
        };
        static ErrorTypes = {NETWORK_ERROR: 'networkError'};

        on = jest.fn();
        loadSource = jest.fn();
        attachMedia = jest.fn();
        destroy = jest.fn();
    }

    return Hls;
});

describe('VideoPlayer HLS fallback', () => {
    const props = {
        videoFile: 'courses/react/basics/intro.mp4',
        subtitlesFile: '',
        getNextVideo: jest.fn(),
    };

    let fetchSpy;
    let originalFetch;

    beforeEach(() => {
        window.HTMLMediaElement.prototype.load = jest.fn();
        window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
        originalFetch = global.fetch;
        fetchSpy = jest.fn().mockResolvedValue({ok: false});
        global.fetch = fetchSpy;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('plays the original video when its HLS playlist is missing', async () => {
        render(<VideoPlayer {...props} />);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                '/cdn/courses/react/basics/intro.mp4.hls/master.m3u8'
            );
        });

        expect(window.HTMLMediaElement.prototype.load).toHaveBeenCalled();
        expect(document.querySelector('source')).toHaveAttribute(
            'src',
            '/cdn/courses/react/basics/intro.mp4'
        );
    });
});
