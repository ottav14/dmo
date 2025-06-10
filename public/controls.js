import * as PARAMS from './params.js';
import { updateBoard } from './render.js';

const sendPlayerUpdate = (state, webSocketServer) => {
	const data = {
		position: state.position,
		boardPosition: state.boardPosition,
		player_ch: state.player_ch,
	}
	const message = { type: 'playerUpdate', id: state.id, data: data };
	webSocketServer.send(JSON.stringify(message));
}

const changeBoard = (state, xoff, yoff, webSocketServer) => {
	state.prevMode = state.mode;
	state.mode = 'loading';

	// Update board position
	state.boardPosition.x += xoff;
	state.boardPosition.y += yoff;

	// Update player position
	if(xoff === 1) state.position.x = 0;
	if(xoff === -1) state.position.x = PARAMS.board_width-1;
	if(yoff === 1) state.position.y = 0;
	if(yoff === -1) state.position.y = PARAMS.board_height-1;

	// Update server side data
	sendPlayerUpdate(state, webSocketServer);
}

const getChar = (direction) => {
	switch(direction) {
		case 'up':    return '^';
		case 'down':  return 'v';
		case 'left':  return '<';
		case 'right': return '>';
	}
	return null;
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
		'0,-1': 'up',
		'0,1':  'down',
		'-1,0': 'left',
		'1,0':  'right',
	}
	const direction = directionKey[`${xoff},${yoff}`];
	state.direction = direction;
	const ch = getChar(state.direction);

	if(state.mode !== 'normal')
		state.player_ch = ch;

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
		sendPlayerUpdate(state, webSocketServer);
	}
}

const placeBlock = (state, webSocketServer) => {

	if(state.shiftHeld) {
		const x = state.position.x;
		const y = state.position.y;
		state.board[y][x] = state.block;
		const edit = { position: { x: x, y: y }, boardPosition: state.boardPosition, ch: state.block };
		const message = { type: 'block', id: state.id, data: edit };
		webSocketServer.send(JSON.stringify(message));
		return;
	}

	const directionKey = {
		'up': [0, -1],
		'down': [0, 1],
		'left': [-1, 0],
		'right': [1, 0]
	}
	const x = state.position.x + directionKey[state.direction][0];
	const y = state.position.y + directionKey[state.direction][1];
	const w = PARAMS.board_width;
	const h = PARAMS.board_height;
	if(x >= 0 && x < w && y >= 0 && y < h) {
		state.board[y][x] = state.block;
		const edit = { position: { x: x, y: y }, boardPosition: state.boardPosition, ch: state.block };
		const message = { type: 'block', id: state.id, data: edit };
		webSocketServer.send(JSON.stringify(message));
	}
}

const shoot = (e, state, webSocketServer) => {

	const directionKey = {
		'up': [0, -1],
		'down': [0, 1],
		'left': [-1, 0],
		'right': [1, 0]
	}
	const x = state.position.x + directionKey[state.direction][0];
	const y = state.position.y + directionKey[state.direction][1];
	const w = PARAMS.board_width;
	const h = PARAMS.board_height;
	if(x >= 0 && x < w && y >= 0 && y < h) {
		state.board[y][x] = 'o';
		const edit = { position: { x: x, y: y }, boardPosition: state.boardPosition, ch: state.block };
		const message = { type: 'block', id: state.id, data: edit };
		webSocketServer.send(JSON.stringify(message));
	}
	

}

const toggleDirectional = (e, state, webSocketServer) => {
	state.player_ch = state.player_ch === '@' ? getChar(state.direction) : '@';
	sendPlayerUpdate(state, webSocketServer);
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
			toggleDirectional(e, state, webSocketServer);
			break;
		case 'g':
			state.mode = 'shooting';
			toggleDirectional(e, state, webSocketServer);
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
			if(e.key.length === 1 && state.message.length <= PARAMS.max_msg_len)
				state.message += e.key;
	}
}

const buildingControls = (e, state, webSocketServer) => {

	switch(e.key.toLowerCase()) {
		case 'arrowleft':
		case 'a':
		case 'h':
			move(state, -1, 0, webSocketServer);
			break;
		case 'arrowdown':
		case 's':
		case 'j':
			move(state, 0, 1, webSocketServer);
			break;
		case 'arrowup':
		case 'w':
		case 'k':
			move(state, 0, -1, webSocketServer);
			break;
		case 'arrowright':
		case 'd':
		case 'l':
			move(state, 1, 0, webSocketServer);
			break;
		case ' ':
			placeBlock(state, webSocketServer);
			break;
		case ':':
			state.prevMode = state.mode;
			state.mode = 'typing';
			break;
		case 'p':
			state.mode = 'pick';
			break;
		case 'g':
			state.mode = 'shooting';
			break;
		case 'escape':
			state.mode = 'normal';
			toggleDirectional(e, state, webSocketServer);
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

const shootingControls = (e, state, webSocketServer) => {
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
			shoot(e, state, webSocketServer);
			break;
		case 'b':
			state.mode = 'building';
			break;
		case ':':
			state.prevMode = state.mode;
			state.mode = 'typing';
			break;
		case 'Escape':
			state.mode = 'normal';
			toggleDirectional(e, state, webSocketServer);
			break;
	}
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
		case 'shooting':
			shootingControls(e, state, webSocketServer);
			break;
		case 'loading':
			break;
	}
	updateBoard(state);
}
