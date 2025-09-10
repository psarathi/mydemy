const topicFileNameSorter = require('../../utilities/topicFileNameSorter');

describe('topicFileNameSorter', () => {
    test('sorts files by name in ascending order', () => {
        const files = [
            {name: '03 Advanced Video', fileName: '03 Advanced Video.mp4', ext: '.mp4'},
            {name: '01 Introduction', fileName: '01 Introduction.mp4', ext: '.mp4'},
            {name: '02 Basics', fileName: '02 Basics.mp4', ext: '.mp4'}
        ];

        const sorted = files.sort(topicFileNameSorter);

        expect(sorted).toEqual([
            {name: '01 Introduction', fileName: '01 Introduction.mp4', ext: '.mp4'},
            {name: '02 Basics', fileName: '02 Basics.mp4', ext: '.mp4'},
            {name: '03 Advanced Video', fileName: '03 Advanced Video.mp4', ext: '.mp4'}
        ]);
    });

    test('handles files with same names', () => {
        const files = [
            {name: 'duplicate', fileName: 'duplicate.mp4', ext: '.mp4'},
            {name: 'duplicate', fileName: 'duplicate.srt', ext: '.srt'},
            {name: 'unique', fileName: 'unique.mp4', ext: '.mp4'}
        ];

        const sorted = files.sort(topicFileNameSorter);

        expect(sorted[0].name).toBe('duplicate');
        expect(sorted[1].name).toBe('duplicate');
        expect(sorted[2].name).toBe('unique');
    });

    test('handles empty array', () => {
        const files = [];
        const sorted = files.sort(topicFileNameSorter);
        expect(sorted).toEqual([]);
    });

    test('handles single item array', () => {
        const files = [{name: 'onlyFile', fileName: 'onlyFile.mp4', ext: '.mp4'}];
        const sorted = files.sort(topicFileNameSorter);
        expect(sorted).toEqual([{name: 'onlyFile', fileName: 'onlyFile.mp4', ext: '.mp4'}]);
    });

    test('sorts files with mixed video and subtitle files', () => {
        const files = [
            {name: '02 Video', fileName: '02 Video.mp4', ext: '.mp4'},
            {name: '01 Video', fileName: '01 Video.srt', ext: '.srt'},
            {name: '02 Video', fileName: '02 Video.srt', ext: '.srt'},
            {name: '01 Video', fileName: '01 Video.mp4', ext: '.mp4'}
        ];

        const sorted = files.sort(topicFileNameSorter);

        expect(sorted[0].name).toBe('01 Video');
        expect(sorted[1].name).toBe('01 Video');
        expect(sorted[2].name).toBe('02 Video');
        expect(sorted[3].name).toBe('02 Video');
    });

    test('sorts files with special characters in names', () => {
        const files = [
            {name: 'Video C - Special', fileName: 'Video C - Special.mp4', ext: '.mp4'},
            {name: 'Video A & B', fileName: 'Video A & B.mp4', ext: '.mp4'},
            {name: 'Video Z (Final)', fileName: 'Video Z (Final).mp4', ext: '.mp4'}
        ];

        const sorted = files.sort(topicFileNameSorter);

        expect(sorted[0].name).toBe('Video A & B');
        expect(sorted[1].name).toBe('Video C - Special');
        expect(sorted[2].name).toBe('Video Z (Final)');
    });
});