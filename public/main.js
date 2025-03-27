import * as PARAMS from './params.js';
import boardToString from './render.js';

const drawHLine = (x0, x1, y, board, ch='-') => {
	for(let i=x0; i<=x1; i++)
		board[y][i] = ch;
}

const drawVLine = (y0, y1, x, board, ch='|') => {
	for(let i=y0; i<=y1; i++)
		board[i][x] = ch;
}

const drawRoom = (x, y, w, h, doors, board) => {
	drawVLine(y, y+h-1, x,     board);
	drawVLine(y, y+h-1, x+w-1, board);
	drawHLine(x, x+w-1, y,     board);
	drawHLine(x, x+w-1, y+h-1, board);

	for(let i=1; i<h-1; i++)
		drawHLine(x+1, x+w-2, y+i, board, '.');

	for(const door of doors) {
		switch(door.direction) {
			case 'left':
				board[y+door.index][x] = '+';
				break;
			case 'right':
				board[y+door.index][x+w-1] = '+';
				break;
			case 'up':
				board[y][x+door.index] = '+';
				break;
			case 'down':
				board[y+h-1][x+door.index] = '+';
				break;
		}
	}
}

const drawPath = (points, board) => {


	for(let i=0; i<points.length-1; i++) {
		if(points[i].x === points[i+1].x)
			drawVLine(points[i].y, points[i+1].y, points[i].x, board, '#');
		else if(points[i].y === points[i+1].y) 
			drawHLine(points[i].x, points[i+1].x, points[i].y, board, '#');
		else
			return;
	}
}


const initBoard = () => {
	const newBoard = Array(PARAMS.board_height).fill().map(() => Array(PARAMS.board_width).fill(' '));

	drawRoom(3, 3, 7, 7, [{ direction: 'right', index: 3 }], newBoard);
	drawRoom(20, 10, 7, 7, [{ direction: 'up', index: 3 }], newBoard);

	const path = [
		{ x: 10,  y: 6  },
		{ x: 23, y: 6  },
		{ x: 23, y: 9 }
	]; 

	drawPath(path, newBoard);

	return newBoard;
}


const board = initBoard();
const position = { x: 10, y: 10 };
const player_ch = '@';
const mode = 'walking';
const message = null;
const activeMessages = [];
const activeBalls = [];
const state = {
	board: board,
	position: position,
	player_ch: player_ch,
	mode: mode,
	message: message,
	activeMessages: activeMessages,
	activeBalls: activeBalls
}
const displayString = boardToString(state);

const container = document.getElementById('container');
container.innerText = displayString;

const move = (state, offset) => {
	const p = state.position;
	const newP = { 
		x: p.x + offset.x,
		y: p.y + offset.y
	}
	if(newP.x >= 0 && newP.x < PARAMS.board_width &&
	   newP.y >= 0 && newP.y < PARAMS.board_height)
		state.position = newP;
}

document.addEventListener('keydown', (e) => {
	switch(e.key) {
		case 'h':
			move(state, { x: -1, y: 0 });
			break;
		case 'j':
			move(state, { x: 0, y: 1 });
			break;
		case 'k':
			move(state, { x: 0, y: -1 });
			break;
		case 'l':
			move(state, { x: 1, y: 0 });
			break;
	}
	container.innerText = boardToString(state);
});
