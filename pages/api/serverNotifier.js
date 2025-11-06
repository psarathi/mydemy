import kafkaEmitter from '../../kafkaHandler';

export default function handler(req, res) {
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Encoding', 'none');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        console.log('[SSE] Client connected');

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
            res.write(`:heartbeat\n\n`);
        }, 30000);

        const onMessage = (msg) => {
            console.log(`[SSE] Sending message to client: ${msg}`);
            res.write(`data: ${msg}\n\n`);
        };

        kafkaEmitter.on('message', onMessage);

        req.on('close', () => {
            console.log('[SSE] Client disconnected');
            clearInterval(heartbeat);
            kafkaEmitter.off('message', onMessage);
        });
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}
