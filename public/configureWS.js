import { updateBoard } from './render.js';

const configureWS = (state) => {
	const ws = new WebSocket('wss://ottavhq.com:443');

	ws.onopen = () => {
		console.log('Connected to server');
	};

	ws.onmessage = (event) => {
		const { type, id, data } = JSON.parse(event.data);
		if(type === 'id')
			state.id = data;

		if(type === 'initialGameState') {
			const gameState = JSON.parse(data);
			state.otherPlayers = gameState.playerData;
			state.board = gameState.board.map(row => [...row]);
			state.mode = 'normal';
		}

		if(type === 'playerUpdate') {
			for(let i=0; i<state.otherPlayers.length; i++) {
				if(parseInt(state.otherPlayers[i].id) === id) {
					state.otherPlayers[i].position = data.position;
					state.otherPlayers[i].player_ch = data.player_ch;
					state.otherPlayers[i].boardPosition = data.boardPosition;
				}
			}
		}

		if(type === 'connection') {
			state.otherPlayers.push({
				id: id,
				position: data.position,
				player_ch: data.player_ch,
				boardPosition: data.boardPosition,
			});
		}

		if(type === 'disconnection')
			for(let i=0; i<state.otherPlayers.length; i++)
				if(parseInt(state.otherPlayers[i].id) === id)
					state.otherPlayers.splice(i, 1);

		if(type === 'message') {
			const msg = {
				name: data.name,
				text: data.text
			}
			state.activeMessages.push(msg);
		}

		if(type === 'block') {
			console.log('block:', data);
			state.board[data.position.y][data.position.x] = data.ch;
		}

		if(type === 'board') {
			state.board = data;
			state.mode = state.prevMode;
		}

		updateBoard(state);
		console.log('Message from server:', JSON.parse(event.data));
	};

	ws.onclose = () => {
		console.log('Disconnected from server');
		const message = { type: 'disconnection', id: state.id, data: state.name };
		ws.send(JSON.stringify(message));
	};

	ws.onerror = (error) => {
		console.error('WebSocket error:', error);
	};

	return ws;
}
export default configureWS;
