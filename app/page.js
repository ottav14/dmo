'use client'

import Image from 'next/image';
import { Share_Tech_Mono } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

const board_width = 40;
const board_height = 20;

const ball_speed = 5;
const ball_lifespan = 5;

const starting_position = { x: 5, y: 5 };
const walkables = [ ' ', '+', '#', '.' ];

const Home = () => {

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
		const newBoard = Array(board_height).fill().map(() => Array(board_width).fill(' '));

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

	const [ displayString, setDisplayString ] = useState('');
	const [ position, setPosition ] = useState(starting_position);
	const [ board, setBoard ] = useState(initBoard());
	const [ player_ch, setPlayer_ch ] = useState('@');
	const [ mode, setMode ] = useState('normal');
	const [ message, setMessage ] = useState('');
	const [ activeMessages, setActiveMessages ] = useState([]);
	const [ activeBalls, setActiveBalls ] = useState([]);
	const previousPositionRef = useRef(position);

	const boardToString = (board) => {

		// Clone board
		const _board = board.map(row => [...row]);

		// Add player
		_board[position.y][position.x] = player_ch;

		// Add message being typed
		if(mode === 'typing') {
			_board[board_height-1][0] = ':';
			for(let i=0; i<message.length; i++)
				_board[board_height-1][i+1] = message[i];
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
		for(let i=0; i<board_height-1; i++) {
			for(let j=0; j<board_width; j++)
				out += _board[i][j];
			out += '\n';
		}
		for(let i=0; i<board_width; i++)
			out += _board[board_height-1][i];

		return out;
	}

	const validPosition = (x, y) => {
		const inBounds = x >= 0 && x < board_width && y >= 0 && y < board_height;
		const isWalkable = inBounds && walkables.includes(board[y][x]);
		return inBounds && isWalkable;
	}
	
	const generateId = () => {
		return `${Date.now()}-${Math.floor(Math.random()*1000000)}`;
	}

	useEffect(() => {

		const move = (xoff, yoff) => {
			setPosition(prev => {
				previousPositionRef.current = prev;
				if(validPosition(prev.x+xoff, prev.y+yoff)) {
					return {
						x: prev.x + xoff, 
						y: prev.y + yoff 
					}
				}
				return prev;
			});
		}

		const addMessage = (msg) => {

			setActiveMessages(prev => [...prev, msg]);

			setTimeout(() => {
				setActiveMessages(prev => prev.slice(0, prev.length-1));
			}, 2000);
		}

		const addBall = (xoff, yoff) => {
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

		const normalControls = (e) => {
			switch(e.key) {
				case 'h':
					move(-1, 0);
					break;
				case 'j':
					move(0, 1);
					break;
				case 'k':
					move(0, -1);
					break;
				case 'l':
					move(1, 0);
					break;
				case 'b':
					setMode(prev => 'throwing');
					break;
				case ':':
					setMode(prev => 'typing');
					break;
			}
		}

		const typingControls = (e) => {
			const allow_specials = [ 'Escape', 'Backspace', 'Enter' ];
			if(e.key.length > 1 && !allow_specials.includes(e.key))
				return;

			switch(e.key) {
				case 'Escape':
					setMode(prev => 'normal');
					break;
				case 'Backspace':
					setMessage(prev => prev.slice(0, prev.length-1));
					break;
				case 'Enter':
					addMessage({
						text: message,
						x: position.x,
						y: position.y
					});
					setMessage(prev => '');
					setMode(prev => 'normal');
					break;
				default:
					setMessage(prev => prev + e.key);
					break;
			}
		}

		const throwingControls = (e) => {
			switch(e.key) {
				case 'h':
					addBall(-1, 0);
					break;
				case 'j':
					addBall(0, 1);
					break;
				case 'k':
					addBall(0, -1);
					break;
				case 'l':
					addBall(1, 0);
					break;
				case 'Escape':
					setMode(prev => 'normal');
					break;
			}
			setMode(prev => 'normal');
		}

		switch(mode) {
			case 'normal':
				window.addEventListener('keydown', normalControls);
				return () => window.removeEventListener('keydown', normalControls);
				break;
			case 'throwing':
				window.addEventListener('keydown', throwingControls);
				return () => window.removeEventListener('keydown', throwingControls);
				break;
			case 'typing':
				window.addEventListener('keydown', typingControls);
				return () => window.removeEventListener('keydown', typingControls);
				break;
		}

	}, [mode, message, position]);

	useEffect(() => {
		setDisplayString(boardToString(board));
	}, [mode, message, position, activeMessages, activeBalls]);

	useEffect(() => {
		console.log(activeBalls);
	}, [activeBalls]);


	return (
		<div className={styles.page}>
			<pre className={styles.container}>
				{displayString}
			</pre>
		</div>
	);
}
export default Home;
