import globalParams from './params.js';

const board_width = globalParams.board_width;
const board_height = globalParams.board_height;
const ball_speed = globalParams.ball_speed;
const ball_lifespan = globalParams.ball_lifespan;

const generateId = () => {
	return `${Date.now()}-${Math.floor(Math.random()*1000000)}`;
}

const addBall = (xoff, yoff, state) => {
	const position = state.position;
	const setActiveBalls = state.setActiveBalls;
	const ball = { 
		x: position.x + xoff, 
		y: position.y + yoff,
		vx: xoff,
		vy: yoff,
		id: generateId()
	};
	setActiveBalls(prev => [...prev, ball]);

	const intervalId = setInterval(() => {	
		setActiveBalls(prev => {
			const newBalls = [...prev];
			let ix = 0;
			for(let i=0; i<newBalls.length; i++) {
				if(newBalls[i].id === ball.id) {
					ix = i;
					break;
				}
			}

			const newX = newBalls[ix].x + newBalls[ix].vx;
			const newY = newBalls[ix].y + newBalls[ix].vy;
			if(newX >= board_width || newX < 0) {
				newBalls[ix].vx *= -1;
				newBalls[ix].x += 2 * newBalls[ix].vx;
			}
			else {
				newBalls[ix].x += newBalls[ix].vx;
			}
			if(newY >= board_height || newY < 0) {
				newBalls[ix].vy *= -1;
				newBalls[ix].y += 2 * newBalls[ix].vy;
			}
			else {
				newBalls[ix].y += newBalls[ix].vy;
			}

			return newBalls;
		});
	}, 1000 / ball_speed);

	setTimeout(() => {
		clearInterval(intervalId);
		setActiveBalls(prev => {
			const newBalls = [...prev];
			for(let i=0; i<newBalls.length; i++)
				if(newBalls[i].id === ball.id)
					newBalls.pop(i);
			return newBalls;
		});
	}, 1000 * ball_lifespan);
}
export default addBall;
