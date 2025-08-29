exports.BASE_CDN_PATH = 'http://192.168.1.141:5555'; // internal IP
// exports.BASE_CDN_PATH = 'http://98.45.192.254:5555'; // external IP and port
// exports.COURSES_FOLDER = '/public/courses';
exports.COURSES_FOLDER = '/Volumes/medianas/Videos';
exports.LOCAL_CDN = 'Videos';
exports.COURSE_PATH = 'courses';
exports.KAFKA_SERVER = '192.168.1.141';
exports.KAFKA_SERVER_PORT = '9092';
exports.KAFKA_CONSUMER_TIMEOUT = 5 * 60 * 1000; // 5 minutes as it takes about 3 minutes to process the courses
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
