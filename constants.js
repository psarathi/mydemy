// Use environment variables with fallbacks
// BASE_CDN_PATH needs NEXT_PUBLIC_ prefix since it's used in client-side code
exports.BASE_CDN_PATH = process.env.NEXT_PUBLIC_BASE_CDN_PATH || 'http://192.168.1.141:5555';
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

// Supported video file extensions
exports.SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];

// Video MIME types mapping
exports.VIDEO_MIME_TYPES = {
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.m4v': 'video/mp4'
};
