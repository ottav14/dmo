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

const fetchBoard = async (x, y) => {
	const board_width = 100;
	const board_height = 40;
	const redisBoardRes = await redis.hgetall(`board:${x},${y}`);
	const board = Array(board_height).fill().map(() => Array(board_width).fill());
	for(const [key, value] of Object.entries(redisBoardRes)) {
		const [x, y] = key.split(',').map(Number);
		board[y][x] = value;
	}
	return board;
}

const initBoard = async (x, y) => {
	for(let i=0; i<40; i++)
		for(let j=0; j<100; j++)
			await redis.hset(`board:${x},${y}`, `${j},${i}`, ' ');
}

const initRedis = async () => {
	await redis.flushdb();
	await initBoard(0, 0);

}
initRedis();

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
	const playerId = Date.now(); // Generate player id
	clients.set(playerId, ws);
	console.log(`Player ${playerId} connected`); // Log player connection

	const keys = await redis.keys('*');
	const playerData = [];
	if(keys) {
		for(const key of keys) {
			if(!key.startsWith('board')) {
				const data = await redis.hget(key, 'position');
				const currentPos = JSON.parse(data);
				playerData.push({ id: key, position: currentPos });
			}
		}
	}

	const board = await fetchBoard(0, 0);

	const gameState = { playerData: playerData, board: board };
	const strdata = JSON.stringify(gameState);
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

		if(type === 'block') {
			clients.forEach(client => {
				if(client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: 'block', id: id, data: data }));
				}
			});
			const x = data.position.x;
			const y = data.position.y;
			const boardX = data.boardPosition.x;
			const boardY = data.boardPosition.y;
			await redis.hset(`board:${boardX},${boardY}`, `${x},${y}`, data.ch);
			console.log('location:', boardX, boardY);
		}

		if(type === 'message') {
			clients.forEach(client => {
				if(client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: 'message', id: id, data: data }));
				}
			});
		}

		if(type === 'boardJump') {
			if(!(await redis.exists(`board:${data.x},${data.y}`)))
				await initBoard(data.x, data.y);

			const newBoard = await fetchBoard(data.x, data.y);
			ws.send(JSON.stringify({ type: 'board', id: id, data: newBoard }));
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
