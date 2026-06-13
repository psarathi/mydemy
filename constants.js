// Use environment variables with fallbacks
// BASE_CDN_PATH needs NEXT_PUBLIC_ prefix since it's used in client-side code
exports.BASE_CDN_PATH = process.env.NEXT_PUBLIC_BASE_CDN_PATH || 'http://192.168.1.141:5555';

// The browser-facing base for media (video/subtitle) URLs.
//
// On the web build we serve media through a same-origin "/cdn" path that
// next.config.js rewrites to the real CDN server-side. That way the media URL
// always inherits whatever host the client used to reach the app — the
// `mydemy.learn` hostname on machines that have it in /etc/hosts, the LAN IP on
// a phone that doesn't — so playback never depends on the client being able to
// resolve the CDN hostname itself.
//
// The Tauri desktop build is a static export with no server to proxy through,
// so it must point straight at the absolute CDN URL.
exports.getCdnBase = function getCdnBase() {
    if (typeof window !== 'undefined' && window.__TAURI__ !== undefined) {
        return exports.BASE_CDN_PATH;
    }
    return '/cdn';
};
// COURSES_FOLDER is server-side only
exports.COURSES_FOLDER = process.env.COURSES_FOLDER || '/Volumes/medianas/Videos';
exports.LOCAL_CDN = 'Videos';
exports.COURSE_PATH = 'courses';
exports.KAFKA_SERVER = process.env.KAFKA_SERVER || '192.168.1.141';
exports.KAFKA_SERVER_PORT = process.env.KAFKA_SERVER_PORT || '9092';
exports.KAFKA_CONSUMER_TIMEOUT = 5 * 60 * 1000; // 5 minutes as it takes about 3 minutes to pro
// cess the courses
exports.KAFKA_UPLOAD_TOPIC = 'upload';
exports.KAFKA_UPLOAD_MSG = 'new_uploads';
exports.CONSOLE_COLOR_THEME = {
    info: 'blue',
    help: 'cyan',
    warn: 'yellow',
    success: 'green',
    error: 'red',
};
exports.COURSES_FILE_NAME = 'courses.json';

// Supported video file extensions (must match VIDEO_FILE_EXTENSIONS in fetchCourseListingsV3.js)
exports.SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.mpeg', '.mpg', '.3gp', '.ogv', '.ts'];

// Video MIME types mapping
exports.VIDEO_MIME_TYPES = {
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.m4v': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
    '.3gp': 'video/3gpp',
    '.ogv': 'video/ogg',
    '.ts': 'video/mp2t'
};
