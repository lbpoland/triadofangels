// server.js

const WebSocket = require('ws');
const net = require('net');
const url = require('url');

const wss = new WebSocket.Server({ port: 8080 });

console.log('🌐 WebSocket server running on ws://localhost:8080');

wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const mudAddress = decodeURIComponent(parsedUrl.pathname.slice(1));

    const [host, port] = mudAddress.split(':');
    if (!host || !port) {
        ws.close(1008, 'Invalid server address.');
        return;
    }

    console.log(`🔌 Connecting to MUD server ${host}:${port}`);

    const mudSocket = net.createConnection({ host, port: parseInt(port) }, () => {
        ws.send(`Connected to MUD ${host}:${port}\r\n`);
    });

    mudSocket.on('data', (data) => {
        ws.send(data.toString());
    });

    mudSocket.on('error', (err) => {
        console.error(`❌ MUD connection error: ${err.message}`);
        ws.send(`Error: ${err.message}\r\n`);
        ws.close();
    });

    mudSocket.on('end', () => {
        ws.send('Connection closed by MUD server.\r\n');
        ws.close();
    });

    ws.on('message', (msg) => {
        mudSocket.write(msg);
    });

    ws.on('close', () => {
        console.log('💨 WebSocket client disconnected.');
        mudSocket.end();
    });
});
