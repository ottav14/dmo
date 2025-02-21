'use client'

import Image from 'next/image';
import { Share_Tech_Mono } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import globalParams from './params.js';
import addBall from './ball.js';
import addMessage from './message.js';
import boardToString from './render.js';

const board_width = globalParams.board_width;
const board_height = globalParams.board_height;
const ball_speed = globalParams.ball_speed;
const ball_lifespan = globalParams.ball_lifespan;

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

	const state = {
		position: position,
		board: board,
		mode: mode,
		player_ch: player_ch,
		message: message,
		activeMessages: activeMessages,
		activeBalls: activeBalls,
		setActiveMessages: setActiveMessages,
		setActiveBalls: setActiveBalls
	}

	const validPosition = (x, y) => {
		const inBounds = x >= 0 && x < board_width && y >= 0 && y < board_height;
		const isWalkable = inBounds && walkables.includes(board[y][x]);
		return inBounds && isWalkable;
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
					}, state);
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
		setDisplayString(boardToString(state));
	}, [mode, message, position, activeMessages, activeBalls]);

	return (
		<div className={styles.page}>
			<pre className={styles.container}>
				{displayString}
			</pre>
		</div>
	);
}
export default Home;
