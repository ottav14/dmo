import addMessage from './message.js';
import addBall from './ball.js';

const validPosition = (x, y, state) => {
	const inBounds = x >= 0 && x < state.board_width && y >= 0 && y < state.board_height;
	const isWalkable = inBounds && walkables.includes(state.board[y][x]);
	return inBounds && isWalkable;
}

const move = (xoff, yoff, state) => {
	state.setPosition(prev => {
		state.previousPositionRef.current = prev;
		if(validPosition(prev.x+xoff, prev.y+yoff, state)) {
			return {
				x: prev.x + xoff, 
				y: prev.y + yoff 
			}
		}
		return prev;
	});
}

export const normalControls = (e, state) => {
	switch(e.key) {
		case 'h':
			move(-1, 0, state);
			break;
		case 'j':
			move(0, 1, state);
			break;
		case 'k':
			move(0, -1, state);
			break;
		case 'l':
			move(1, 0, state);
			break;
		case 'b':
			state.setMode(prev => 'throwing');
			break;
		case ':':
			state.setMode(prev => 'typing');
			break;
	}
}

export const typingControls = (e, state) => {
	const allow_specials = [ 'Escape', 'Backspace', 'Enter' ];
	if(e.key.length > 1 && !allow_specials.includes(e.key))
		return;

	switch(e.key) {
		case 'Escape':
			state.setMode(prev => 'normal');
			break;
		case 'Backspace':
			state.setMessage(prev => prev.slice(0, prev.length-1));
			break;
		case 'Enter':
			state.addMessage({
				text: state.message,
				x: state.position.x,
				y: state.position.y
			});
			state.setMessage(prev => '');
			state.setMode(prev => 'normal');
			break;
		default:
			state.setMessage(prev => prev + e.key);
			break;
	}
}

export const throwingControls = (e, state) => {
	switch(e.key) {
		case 'h':
			addBall(-1, 0, state);
			break;
		case 'j':
			addBall(0, 1, state);
			break;
		case 'k':
			addBall(0, -1, state);
			break;
		case 'l':
			addBall(1, 0, state);
			break;
		case 'Escape':
			state.setMode(prev => 'normal');
			break;
	}
	state.setMode(prev => 'normal');
}
