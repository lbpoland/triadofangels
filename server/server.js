// server.js - Triad of Angels Website Server with WebSocket MUD Proxy

// ========== REQUIRED MODULES ==========
const WebSocket = require('ws'); // WebSocket for MUD proxy
const net = require('net'); // TCP socket for connecting to MUD servers
const url = require('url'); // URL parsing for WebSocket requests
const express = require('express'); // Express for serving static files
const path = require('path'); // Path handling for serving static files
const fs = require('fs').promises; // File system for reading files
const os = require('os'); // To get local IP address

// ========== EXPRESS SERVER FOR STATIC FILES ==========
const app = express();
const port = process.env.PORT || 8080; // Port for the server (default 8080)

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`📡 Request received: ${req.method} ${req.url}`);
  next();
});

// Serve static files (HTML, CSS, JS, JSON) from the parent directory
const staticPath = path.join(__dirname, '..');
console.log(`📂 Serving static files from: ${staticPath}`);
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.json')) {
      console.log(`📤 Serving JSON file via static middleware: ${filePath}`);
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Explicit route for data/album.json to ensure it's served
app.get('/data/album.json', async (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'album.json');
  console.log(`📤 Attempting to explicitly serve: ${filePath}`);

  try {
    // Read the file directly
    const fileContent = await fs.readFile(filePath, 'utf-8');
    console.log(`✅ Successfully read file: ${filePath}`);
    
    // Set the Content-Type and send the file content
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(fileContent);
    console.log(`📤 Successfully served data/album.json`);
  } catch (err) {
    console.error(`❌ Error reading data/album.json: ${err.message}`);
    res.status(500).send(`Error reading album.json: ${err.message}`);
  }
});

// Fallback to serve index.html for any unmatched routes (SPA support)
app.get('*', (req, res) => {
  console.log(`🔄 Fallback route triggered for: ${req.url}`);
  res.sendFile(path.join(__dirname, '..', 'index.html'), (err) => {
    if (err) {
      console.error(`❌ Error serving index.html: ${err.message}`);
      res.status(500).send('Error serving index.html');
    }
  });
});

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

// Create an HTTP server instance for Express
const server = app.listen(port, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`🌐 Server running on http://localhost:${port}`);
  console.log(`🌐 Accessible on your network at http://${localIP}:${port}`);
});

// ========== WEBSOCKET SERVER FOR MUD PROXY ==========
const wss = new WebSocket.Server({ server }); // Attach WebSocket to the same Express server

console.log(`🌐 WebSocket server running on ws://localhost:${port}`);

wss.on('connection', (ws, req) => {
  // Parse the WebSocket URL to extract the MUD server address (e.g., /host:port)
  const parsedUrl = url.parse(req.url, true);
  const mudAddress = decodeURIComponent(parsedUrl.pathname.slice(1));

  // Split the address into host and port (e.g., mud.example.com:4000)
  const [host, port] = mudAddress.split(':');
  if (!host || !port) {
    ws.close(1008, 'Invalid server address.');
    return;
  }

  console.log(`🔌 Connecting to MUD server ${host}:${port}`);

  // Create a TCP connection to the MUD server
  const mudSocket = net.createConnection({ host, port: parseInt(port) }, () => {
    ws.send(`Connected to MUD ${host}:${port}\r\n`);
  });

  // Relay data from MUD server to WebSocket client
  mudSocket.on('data', (data) => {
    ws.send(data.toString());
  });

  // Handle MUD server connection errors
  mudSocket.on('error', (err) => {
    console.error(`❌ MUD connection error: ${err.message}`);
    ws.send(`Error: ${err.message}\r\n`);
    ws.close();
  });

  // Handle MUD server disconnection
  mudSocket.on('end', () => {
    ws.send('Connection closed by MUD server.\r\n');
    ws.close();
  });

  // Relay messages from WebSocket client to MUD server
  ws.on('message', (msg) => {
    mudSocket.write(msg);
  });

  // Handle WebSocket client disconnection
  ws.on('close', () => {
    console.log('💨 WebSocket client disconnected.');
    mudSocket.end();
  });
});