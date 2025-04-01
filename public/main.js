import * as PARAMS from './params.js';
import { updateBoard, initBoard } from './render.js';
import connectWS from './connectWS.js';
import { move, controls } from './controls.js';

const loginWindow = document.getElementById('login');
const nameInput = document.getElementById('input');
const container = document.getElementById('container');

const getName = (e) => {
	if(e.key === 'Enter') {
		loginWindow.style.display = 'none';
		start(nameInput.value);
		nameInput.removeEventListener('keypress', getName);
	}
}
nameInput.addEventListener('keypress', getName);

const start = (name) => {
	const state = {
		name: name,
		board: initBoard(),
		container: container,
		position: { x: 10, y: 10 },
		player_ch: '@',
		mode: 'walking',
		message: '',
		activeMessages: [],
		activeBalls: [],
		otherPlayers: []
	}

	// Open ws connection
	const webSocketServer = connectWS(state);


	updateBoard(state);

	document.addEventListener('keydown', (e) => controls(e, state, webSocketServer));
}
