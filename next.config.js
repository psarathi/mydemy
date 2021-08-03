const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');
const {BASE_PATH} = require('./constants');

module.exports = (phase) => {
    if (phase === PHASE_DEVELOPMENT_SERVER) {
        return {
            basePath: '',
            env: {
                basePath: '',
            },
        };
    }
    return {
        reactStrictMode: true,
        basePath: BASE_PATH,
        env: {
            basePath: BASE_PATH,
        },
    };
};
