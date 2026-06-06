const {Kafka} = require('kafkajs');
const EventEmitter = require('node:events');
const path = require('node:path');
const {spawn} = require('node:child_process');
const fetchCourses = require('./fetchCourses');
const {
    KAFKA_SERVER,
    KAFKA_SERVER_PORT,
    KAFKA_UPLOAD_MSG,
    KAFKA_UPLOAD_TOPIC,
    KAFKA_CONSUMER_TIMEOUT,
} = require('./constants');

// Use global to persist across Next.js hot-reloads
if (!global.kafkaClient) {
    global.kafkaClient = new Kafka({
        clientId: 'mydemy',
        brokers: [`${KAFKA_SERVER}:${KAFKA_SERVER_PORT}`],
    });
}

if (!global.kafkaEmitter) {
    global.kafkaEmitter = new EventEmitter();
}

if (!global.kafkaConsumerRunning) {
    global.kafkaConsumerRunning = false;
}

const kafka = global.kafkaClient;
const kafkaEmitter = global.kafkaEmitter;

/**
 * Push the freshly-updated courses.json to the CDN so the redundant copy
 * (used by the desktop app and as a fallback) stays in sync with the local
 * file the web app serves. Runs in a separate process so a failed/unconfigured
 * upload only logs — it never crashes the long-running server. No-op unless an
 * upload endpoint is configured.
 */
const uploadCoursesToCDN = () => {
    if (!process.env.COURSES_UPLOAD_ENDPOINT) {
        console.log('[Kafka] COURSES_UPLOAD_ENDPOINT not set; skipping CDN sync');
        return;
    }

    console.log('[Kafka] Syncing courses.json to CDN...');
    const child = spawn('node', [path.join(__dirname, 'uploadCoursesToCDN.js')], {
        cwd: __dirname,
        stdio: 'inherit',
    });
    child.on('error', (err) => {
        console.error('[Kafka] Failed to start CDN sync:', err.message);
    });
    child.on('exit', (code) => {
        if (code === 0) {
            console.log('[Kafka] CDN sync complete');
        } else {
            console.error(`[Kafka] CDN sync exited with code ${code} (local file is still updated)`);
        }
    });
};

const runConsumer = async () => {
    if (global.kafkaConsumerRunning) {
        console.log('[Kafka] Consumer already running, skipping initialization');
        return;
    }

    global.kafkaConsumerRunning = true;
    console.log('[Kafka] Starting consumer...');

    const consumer = kafka.consumer({
        groupId: 'mydemy-web-consumer',
        sessionTimeout: KAFKA_CONSUMER_TIMEOUT,
        heartbeatInterval: 3000,
        rebalanceTimeout: 60000,
    });

    await consumer.connect();
    await consumer.subscribe({
        topics: [KAFKA_UPLOAD_TOPIC],
        fromBeginning: false,
    });

    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            let msg = message.value.toString();
            let msg_json = JSON.parse(message.value);
            if (msg_json[KAFKA_UPLOAD_MSG]?.length) {
                console.log('[Kafka] Processing message, courses to add:', msg_json[KAFKA_UPLOAD_MSG]);
                await fetchCourses(msg_json[KAFKA_UPLOAD_MSG]);
                // Keep the CDN's redundant copy in sync with the freshly appended local file.
                uploadCoursesToCDN();
                console.log('[Kafka] Emitting message to clients');
                kafkaEmitter.emit('message', msg);
                console.log('[Kafka] Message emitted, active listeners:', kafkaEmitter.listenerCount('message'));
            }
        },
    });

    console.log('[Kafka] Consumer successfully started and subscribed');
};

// Only run if not already running
if (!global.kafkaConsumerRunning) {
    runConsumer().catch((error) => {
        console.error('[Kafka] Consumer error:', error);
        global.kafkaConsumerRunning = false;
    });
}

module.exports = kafkaEmitter;
