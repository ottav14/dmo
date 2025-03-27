import * as PARAMS from './params.js';

const boardToString = (state) => {

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

	return out;
}
export default boardToString;
