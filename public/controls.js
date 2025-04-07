import * as PARAMS from './params.js';
import { updateBoard } from './render.js';

const changeBoard = (state, xoff, yoff, webSocketServer) => {
	state.prevMode = state.mode;
	state.mode = 'loading';

	// Update board position
	state.boardPosition.x += xoff;
	state.boardPosition.y += yoff;
	const boardMessage = { type: 'boardJump', id: state.id, data: state.boardPosition };
	webSocketServer.send(JSON.stringify(boardMessage));

	// Update player position
	if(xoff === 1) state.position.x = 0;
	if(xoff === -1) state.position.x = PARAMS.board_width-1;
	if(yoff === 1) state.position.y = 0;
	if(yoff === -1) state.position.y = PARAMS.board_height-1;
	const positionMessage = { type: 'position', id: state.id, data: state.position };
	webSocketServer.send(JSON.stringify(positionMessage));
}

export const move = (state, xoff, yoff, webSocketServer) => {
	const p = state.position;
	const newP = { 
		x: p.x + xoff,
		y: p.y + yoff
	}

	const unwalkables = [
		'|',
		'-',
	];

	const directionKey = {
		'0,-1': '^',
		'0,1': 'v',
		'-1,0': '<',
		'1,0': '>',
	}
	const ch = directionKey[`${xoff},${yoff}`];

	const bx = state.boardPosition.x;
	const by = state.boardPosition.y;
	if(newP.x < 0) changeBoard(state, -1, 0, webSocketServer); 
	else if(newP.x >= PARAMS.board_width) changeBoard(state, 1, 0, webSocketServer); 
	else if(newP.y < 0) changeBoard(state, 0, -1, webSocketServer); 
	else if(newP.y >= PARAMS.board_height) changeBoard(state, 0, 1, webSocketServer); 
	else if(newP.x >= 0 && newP.x < PARAMS.board_width &&
	   		newP.y >= 0 && newP.y < PARAMS.board_height &&
	   !unwalkables.includes(state.board[newP.y][newP.x])) {
		state.position = newP;
		if(state.mode === 'building')
			state.player_ch = ch;
		const message = { type: 'position', id: state.id, data: newP };
		webSocketServer.send(JSON.stringify(message));
	}
}

const placeBlock = (e, state, webSocketServer) => {
	state.board[state.position.y][state.position.x] = state.block;
	const edit = { position: state.position, boardPosition: state.boardPosition, ch: state.block };
	const message = { type: 'block', id: state.id, data: edit };
	webSocketServer.send(JSON.stringify(message));
}

const normalControls = (e, state, webSocketServer) => {
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
			state.prevMode = state.mode;
			state.mode = 'typing';
			break;
		case 'b':
			state.mode = 'building';
			state.player_ch = '>';
			break;
	}
}

const postMessage = (state, webSocketServer) => {
	const msg = {
		name: state.name,
		text: state.message
	}
	state.activeMessages.push(msg); // Add new message client-side

	// Reset message and mode
	state.message = '';
	state.mode = state.prevMode;

	// Post to ws
	const JSONmessage = { type: 'message', id: state.id, data: msg };
	webSocketServer.send(JSON.stringify(JSONmessage));
}

const typingControls = (e, state, webSocketServer) => {
	switch(e.key) {
		case 'Enter':
			postMessage(state, webSocketServer);
			break;
		case 'Escape':
			state.message = '';
			state.mode = state.prevMode;
			break;
		case 'Backspace':
			state.message = state.message.slice(0, -1);
			break;
		default:
			if(e.key.length === 1)
				state.message += e.key;
	}
}

const buildingControls = (e, state, webSocketServer) => {
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
		case ' ':
			placeBlock(e, state, webSocketServer);
			break;
		case ':':
			state.prevMode = state.mode;
			state.mode = 'typing';
			break;
		case 'p':
			state.mode = 'pick';
			break;
		case 'Escape':
			state.mode = 'normal';
			state.player_ch = '@';
			break;
	}
}

const pickControls = (e, state, webSocketServer) => {

	if(e.key === 'Escape') {
		state.mode = 'building';
		return;
	}

	if(e.key.length > 1)
		return;

	state.block = e.key;
	state.mode = 'building';
	
}

export const controls = (e, state, webSocketServer) => {

	switch(state.mode) {
		case 'normal':
			normalControls(e, state, webSocketServer);
			break;
		case 'typing': 
			typingControls(e, state, webSocketServer);
			break;
		case 'building':
			buildingControls(e, state, webSocketServer);
			break;
		case 'pick':
			pickControls(e, state, webSocketServer);
			break;
		case 'loading':
			break;
	}
	updateBoard(state);
}
