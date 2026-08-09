const {isEnglishAudioLanguage} = require('../../utilities/audioLanguage');

describe('isEnglishAudioLanguage', () => {
    test.each(['en', 'eng', 'en-US', 'EN'])('%s is English', (language) => {
        expect(isEnglishAudioLanguage(language)).toBe(true);
    });

    test.each(['ru', 'rus', 'es', undefined])(
        '%s is not English',
        (language) => {
            expect(isEnglishAudioLanguage(language)).toBe(false);
        }
    );
});
