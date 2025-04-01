import * as PARAMS from './params.js';
import { updateBoard } from './render.js';

export const move = (state, xoff, yoff, webSocketServer) => {
	const p = state.position;
	const newP = { 
		x: p.x + xoff,
		y: p.y + yoff
	}

	const walkables = [
		' ',
		'.',
		'#',
		'+',
		'@',
	];

	if(newP.x >= 0 && newP.x < PARAMS.board_width &&
	   newP.y >= 0 && newP.y < PARAMS.board_height &&
	   walkables.includes(state.board[newP.y][newP.x])) {
		state.position = newP;
		const message = { type: 'position', id: state.id, data: newP };
		webSocketServer.send(JSON.stringify(message));
	}
}

const walkingControls = (e, state, webSocketServer) => {
	switch(e.key) {
		case 'ArrowLeft':
		case 'a':
		case 'h':
			move(state, -1, 0, webSocketServer);
			break;
		case 'ArrowDown':
		case 's':
		case 'j':
			move(state, 0, 1, webSocketServer);
			break;
		case 'ArrowUp':
		case 'w':
		case 'k':
			move(state, 0, -1, webSocketServer);
			break;
		case 'ArrowRight':
		case 'd':
		case 'l':
			move(state, 1, 0, webSocketServer);
			break;
		case ':':
			state.mode = 'typing';
			break;
	}
}

const typingControls = (e, state, webSocketServer) => {
	switch(e.key) {
		case 'Enter':
		case 'Escape':
			state.message = '';
			state.mode = 'walking';
			break;
		default:
			if(e.key.length === 1)
				state.message += e.key;
	}
}

export const controls = (e, state, webSocketServer) => {
	switch(state.mode) {
		case 'walking':
			walkingControls(e, state, webSocketServer);
			break;
		case 'typing': 
			typingControls(e, state, webSocketServer);
	}
	updateBoard(state);
}
