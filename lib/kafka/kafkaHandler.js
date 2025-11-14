const { Kafka } = require('kafkajs');
const EventEmitter = require('node:events');
const fetchCourses = require('../courses/fetchCourses');
const {
    KAFKA_SERVER,
    KAFKA_SERVER_PORT,
    KAFKA_UPLOAD_MSG,
    KAFKA_UPLOAD_TOPIC,
    KAFKA_CONSUMER_TIMEOUT,
} = require('../constants');

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
        eachMessage: async ({ topic, partition, message }) => {
            let msg = message.value.toString();
            let msg_json = JSON.parse(message.value);
            if (msg_json[KAFKA_UPLOAD_MSG]?.length) {
                console.log('[Kafka] Processing message, courses to add:', msg_json[KAFKA_UPLOAD_MSG]);
                await fetchCourses(msg_json[KAFKA_UPLOAD_MSG]);
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
