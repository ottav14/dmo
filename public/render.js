import * as PARAMS from './params.js';

export const updateBoard = (state) => {

	const board = state.board;
	const position = state.position;
	const player_ch = state.player_ch;
	const mode = state.mode;
	const message = state.message;
	const activeMessages = state.activeMessages;
	const activeBalls = state.activeBalls;
	// Clone board
	const _board = board.map(row => [...row]);

	// Add player
	_board[position.y][position.x] = player_ch;

	// Add other players
	if(state.otherPlayers) {
		for(const other of state.otherPlayers) {
			const { id, position } = other;
			_board[position.y][position.x] = player_ch;
		}
	}

	// Add message being typed
	if(mode === 'typing') {
		_board[PARAMS.board_height-1][0] = ':';
		for(let i=0; i<message.length; i++)
			_board[PARAMS.board_height-1][i+1] = message[i];
	}

	// Add typed messages
	for(const msg of activeMessages) {
		for(let i=0; i<msg.text.length; i++) {
			_board[msg.y-1][msg.x+1] = '/';
			_board[msg.y-2][msg.x+i+2] = msg.text[i];
		}
	}

	// Add balls
	for(const ball of activeBalls) {
		_board[ball.y][ball.x] = 'O';
	}

	// Construct display string
	let out = '';
	for(let i=0; i<PARAMS.board_height-1; i++) {
		for(let j=0; j<PARAMS.board_width; j++)
			out += _board[i][j];
		out += '\n';
	}
	for(let i=0; i<PARAMS.board_width; i++)
		out += _board[PARAMS.board_height-1][i];

	state.container.innerText = out;
}

export const drawHLine = (x0, x1, y, board, ch='-') => {
	for(let i=x0; i<=x1; i++)
		board[y][i] = ch;
}

export const drawVLine = (y0, y1, x, board, ch='|') => {
	for(let i=y0; i<=y1; i++)
		board[i][x] = ch;
}

export const drawRoom = (x, y, w, h, doors, board) => {
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

export const drawPath = (points, board) => {
	for(let i=0; i<points.length-1; i++) {
		if(points[i].x === points[i+1].x)
			drawVLine(points[i].y, points[i+1].y, points[i].x, board, '#');
		else if(points[i].y === points[i+1].y) 
			drawHLine(points[i].x, points[i+1].x, points[i].y, board, '#');
		else
			return;
	}
}

export const initBoard = () => {
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
