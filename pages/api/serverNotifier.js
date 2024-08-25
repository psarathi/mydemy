import kafkaEmitter from '../../kafkaHandler';

export default function handler(req, res) {
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Encoding', 'none');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const onMessage = (msg) => {
            // console.log(`emitting message: ${msg}`);
            res.write(`data: ${msg}\n\n`);
        };

        kafkaEmitter.on('message', onMessage);

        req.on('close', () => {
            kafkaEmitter.off('message', onMessage);
        });
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}
