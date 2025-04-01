const express = require('express');
const path = require('path');
const https =  require('https');
const fs = require('fs');
const WebSocket = require('ws');
const Redis = require('ioredis');
const app = express();

const PORT = 443;
const options = {
	  key: fs.readFileSync("/etc/letsencrypt/live/ottavhq.com/privkey.pem"),
	  cert: fs.readFileSync("/etc/letsencrypt/live/ottavhq.com/fullchain.pem"),
};

const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({ server: httpsServer });
const redis = new Redis();
const clients = new Map();

const clearRedis = async () => {
	await redis.flushdb();
}
clearRedis();

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
	const playerId = Date.now(); // Generate player id
	clients.set(playerId, ws);
	console.log(`Player ${playerId} connected`); // Log player connection

	const keys = await redis.keys('*');
	const playerData = [];
	if(keys) {
		for(const key of keys) {
			const data = await redis.hget(key, 'position');
			const currentPos = JSON.parse(data);
			playerData.push({ id: key, position: currentPos });
		}
	}
	const strdata = JSON.stringify(playerData);
	ws.send(JSON.stringify({ type: 'initialGameState', id: parseInt(playerId), data: strdata })); // Send initial game state

	const idMessage = { type: 'id', id: playerId, data: playerId };
	ws.send(JSON.stringify(idMessage)); // Send client their id
	
	const position = { x: 10, y: 10 };
	redis.hset(playerId, 'position', JSON.stringify(position)); // Add position to redis
	

	// Tell other players someone connected
	clients.forEach(client => {
		if(client !== ws && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ type: 'connection', id: playerId, data: position }));
		}
	});

	ws.on('message', async (message) => {
		const { type, id, data } = JSON.parse(message);
		console.log('Received:', JSON.parse(message));

		if(type === 'position') {
			clients.forEach(client => {
				if(client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: 'position', id: id, data: data }));
				}
			});
			await redis.hset(id, 'position', JSON.stringify(data));
		}

	});

	ws.on('close', () => {
		console.log(`Player ${playerId} connected`);
		clients.delete(playerId);
		redis.del(playerId);

		// Tell other players someone disconnected
		clients.forEach(client => {
			if(client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ type: 'disconnection', id: playerId, data: null }));
			}
		});
	});
});

app.use(express.static('public'));

app.get('/', (req, res) => {
	  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start web server
httpsServer.listen(PORT, () => {
	console.log('https server running on https://ottavhq.com:443');
});
