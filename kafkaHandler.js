const {Kafka} = require('kafkajs');
const EventEmitter = require('node:events');
const fetchCourses = require('./fetchCourses');
const {
    KAFKA_SERVER,
    KAFKA_SERVER_PORT,
    KAFKA_UPLOAD_MSG,
    KAFKA_UPLOAD_TOPIC,
    KAFKA_CONSUMER_TIMEOUT,
} = require('./constants');
const kafka = new Kafka({
    clientId: 'mydemy',
    brokers: [`${KAFKA_SERVER}:${KAFKA_SERVER_PORT}`],
});

const kafkaEmitter = new EventEmitter();

const runConsumer = async () => {
    const consumer = kafka.consumer({
        groupId: 'null',
        sessionTimeout: KAFKA_CONSUMER_TIMEOUT,
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
                await fetchCourses(msg_json[KAFKA_UPLOAD_MSG]);
                kafkaEmitter.emit('message', msg);
            }
        },
    });
};

runConsumer().catch(console.error);

module.exports = kafkaEmitter;
