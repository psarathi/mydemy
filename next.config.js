const {PHASE_DEVELOPMENT_SERVER} = require('next/constants');
const {BASE_PATH} = require('./constants');

module.exports = (phase, {defaultConfig}) => {
    if (phase !== PHASE_DEVELOPMENT_SERVER) {
        return {
            reactStrictMode: true,
            basePath: BASE_PATH,
            assetPrefix: BASE_PATH,
        };
    }
};
