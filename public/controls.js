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
