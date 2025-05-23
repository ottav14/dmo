import * as PARAMS from './params.js';

const addGUI = (board, state) => {

	const width = PARAMS.display_width;
	const height = PARAMS.display_height;

	const display = Array(height).fill().map((val, i) => {
		if(i < PARAMS.board_height)
			return [...board[i]];
		else
			return Array(width).fill(' ');
	});

	drawHLine(0, PARAMS.board_width-1, PARAMS.board_height, display);
	drawVLine(0, height-1, PARAMS.board_width, display);

	addModeDisplay(display, state.mode);
	addBlockDisplay(display, state.block);

	return display;

}

const addMessages = (board, activeMessages) => {
	let yoff = 0;
	for(let i=activeMessages.length-1; i>=0; i--) {
		let x = PARAMS.board_width+2;
		let y = 2*(activeMessages.length-i) - 1 + yoff;

		const name = activeMessages[i].name;
		for(let j=0; j<name.length; j++)
			board[y][x+j] = name[j];

		x += name.length;
		board[y][x] = ':';
		x += 2;

		const msg = activeMessages[i].text;
		for(let j=0; j<msg.length; j++) {
			// Line wrap
			if(x >= PARAMS.display_width-1) {
				x = PARAMS.board_width+2;
				y++;
				yoff++;
			}
			board[y][x] = msg[j];
			x++;
		}
	}
}

const addChatInput = (board, message) => {
	const y = PARAMS.display_height-2;
	board[y][1] = ':';
	for(let i=0; i<message.length; i++)
		board[y][i+3] = message[i];
}

const addModeDisplay = (board, mode) => {
	const x = PARAMS.board_width-12;
	const y = PARAMS.display_height-2;
	for(let i=0; i<mode.length; i++)
		board[y][x+i] = mode[i];
}

const addBlockDisplay = (board, block) => {
	const x = PARAMS.board_width-2;
	const y = PARAMS.display_height-2;
	board[y][x] = block;
}

const validBoard = (board) => {
	for(const row of board)
		for(const item of row)
			if(item === null)
				return false
	return true
}

export const updateBoard = (state) => {

	if(state.board.length < 1)
		return;

	if(state.mode === 'loading' || !validBoard(state.board)) {
		state.container.innerText = 'Loading...';
		return;
	}

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
			const { id, position, boardPosition, player_ch } = other;
			if(boardPosition.x === state.boardPosition.x &&
			   boardPosition.y === state.boardPosition.y)
				_board[position.y][position.x] = player_ch;
		}
	}


	// GUI 
	const display = addGUI(_board, state);

	// Message being typed
	if(mode === 'typing')
		addChatInput(display, state.message); 

	// Typed messages
	addMessages(display, state.activeMessages);

	// Construct display string
	let out = '';
	for(let i=0; i<PARAMS.display_height-1; i++) {
		for(let j=0; j<PARAMS.display_width; j++)
			out += display[i][j];
		out += '\n';
	}
	for(let i=0; i<PARAMS.display_width; i++)
		out += display[PARAMS.display_height-1][i];

	state.container.innerText = out;
}

export const drawHLine = (x0, x1, y, board, ch='-') => {
	const l = Math.min(x0, x1);
	const r = Math.max(x0, x1);
	for(let i=l; i<=r; i++)
		board[y][i] = ch;
}

export const drawVLine = (y0, y1, x, board, ch='|') => {
	for(let i=y0; i<=y1; i++)
		board[i][x] = ch;
}

export const drawRoom = (x, y, w, h, doors, board, fill=true) => {
	drawVLine(y, y+h-1, x,     board);
	drawVLine(y, y+h-1, x+w-1, board);
	drawHLine(x, x+w-1, y,     board);
	drawHLine(x, x+w-1, y+h-1, board);

	if(fill)
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
	}
}
