import * as PARAMS from './params.js';
import { updateBoard } from './render.js';
import configureWS from './configureWS.js';
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
		board: [],
		boardPosition: { x: 0, y: 0 },
		container: container,
		position: { x: 10, y: 10 },
		player_ch: '@',
		mode: 'normal',
		prevMode: 'normal',
		direction: 'right',
		shiftHeld: false,
		block: '.',
		message: '',
		activeMessages: [],
		activeBalls: [],
		otherPlayers: []
	}

	document.addEventListener('keydown', (e) => {
		if(e.key === 'Shift') state.shiftHeld = true;
	});

	document.addEventListener('keyup', (e) => {
		if(e.key === 'Shift') state.shiftHeld = false;
	});


	// Open ws connection
	const webSocketServer = configureWS(state);

	updateBoard(state);

	document.addEventListener('keydown', (e) => controls(e, state, webSocketServer));
}
