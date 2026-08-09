function isEnglishAudioLanguage(language) {
    const normalizedLanguage = (language || '').toLowerCase();
    return (
        normalizedLanguage === 'en' ||
        normalizedLanguage === 'eng' ||
        normalizedLanguage.startsWith('en-')
    );
}

module.exports = {isEnglishAudioLanguage};
