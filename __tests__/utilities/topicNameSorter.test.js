const topicNameSorter = require('@/lib/courses/topicNameSorter');

describe('topicNameSorter', () => {
    test('sorts topics by name in ascending order', () => {
        const topics = [
            {name: 'Chapter 3. Advanced Concepts'},
            {name: 'Chapter 1. Introduction'},
            {name: 'Chapter 2. Basics'}
        ];

        const sorted = topics.sort(topicNameSorter);

        expect(sorted).toEqual([
            {name: 'Chapter 1. Introduction'},
            {name: 'Chapter 2. Basics'},
            {name: 'Chapter 3. Advanced Concepts'}
        ]);
    });

    test('handles topics with same names', () => {
        const topics = [
            {name: 'Same Topic'},
            {name: 'Same Topic'},
            {name: 'Different Topic'}
        ];

        const sorted = topics.sort(topicNameSorter);

        expect(sorted[0].name).toBe('Different Topic');
        expect(sorted[1].name).toBe('Same Topic');
        expect(sorted[2].name).toBe('Same Topic');
    });

    test('handles empty array', () => {
        const topics = [];
        const sorted = topics.sort(topicNameSorter);
        expect(sorted).toEqual([]);
    });

    test('handles single item array', () => {
        const topics = [{name: 'Only Topic'}];
        const sorted = topics.sort(topicNameSorter);
        expect(sorted).toEqual([{name: 'Only Topic'}]);
    });

    test('sorts topics with special characters correctly', () => {
        const topics = [
            {name: 'Topic C - Special'},
            {name: 'Topic A & B'},
            {name: 'Topic Z (Final)'}
        ];

        const sorted = topics.sort(topicNameSorter);

        expect(sorted[0].name).toBe('Topic A & B');
        expect(sorted[1].name).toBe('Topic C - Special');
        expect(sorted[2].name).toBe('Topic Z (Final)');
    });

    test('sorts topics with numbers in names', () => {
        const topics = [
            {name: '10. Advanced Topics'},
            {name: '2. Basic Topics'},
            {name: '1. Introduction'}
        ];

        const sorted = topics.sort(topicNameSorter);

        expect(sorted[0].name).toBe('1. Introduction');
        expect(sorted[1].name).toBe('10. Advanced Topics');
        expect(sorted[2].name).toBe('2. Basic Topics');
    });
});