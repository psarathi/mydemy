import {
    parseVttCues,
    parseVttTimestamp,
    searchTranscriptCues,
} from '../../utils/transcripts';

describe('transcripts utilities', () => {
    test('parses VTT timestamps with and without hours', () => {
        expect(parseVttTimestamp('00:12.500')).toBe(12.5);
        expect(parseVttTimestamp('01:02:03.250')).toBe(3723.25);
    });

    test('parses cue timings and cleans cue text', () => {
        const cues = parseVttCues(`WEBVTT

00:00:01.000 --> 00:00:03.000
<v Instructor>Welcome to the lesson.

2
00:00:05.000 --> 00:00:07.000 align:start
Use the dashboard {metadata} to review concepts.
`);

        expect(cues).toEqual([
            {
                startSeconds: 1,
                endSeconds: 3,
                text: 'Welcome to the lesson.',
            },
            {
                startSeconds: 5,
                endSeconds: 7,
                text: 'Use the dashboard to review concepts.',
            },
        ]);
    });

    test('searches cues using all query terms', () => {
        const cues = [
            {startSeconds: 1, text: 'Search the transcript index'},
            {startSeconds: 4, text: 'Review dashboard reminders'},
        ];

        expect(searchTranscriptCues(cues, 'transcript search')).toEqual([
            cues[0],
        ]);
        expect(searchTranscriptCues(cues, 'search reminders')).toEqual([]);
    });
});
