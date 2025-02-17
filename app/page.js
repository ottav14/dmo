'use client'

import Image from 'next/image';
import { Share_Tech_Mono } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

const board_width = 15;
const board_height = 10;

const player_ch = '@';


const Home = () => {

	const drawHLine = (x0, x1, y, board) => {
		for(let i=x0; i<=x1; i++)
			board[y][i] = '-';
	}

	const drawVLine = (y0, y1, x, board) => {
		for(let i=y0; i<=y1; i++)
			board[i][x] = '|';
	}

	const initBoard = () => {
		const newBoard = Array(board_height).fill().map(() => Array(board_width).fill(' '));

		drawVLine(3, 9, 3, newBoard);
		drawVLine(3, 9, 9, newBoard);
		drawHLine(3, 9, 3, newBoard);
		drawHLine(3, 9, 9, newBoard);

		newBoard[3][6] = ' ';

		return newBoard;
	}

	const [ displayString, setDisplayString ] = useState('');
	const [ position, setPosition ] = useState({ x: 0, y: 0 });
	const [ board, setBoard ] = useState(initBoard());
	const previousPositionRef = useRef(position);


	const boardToString = (board) => {

		// Clone board
		const _board = board.map(row => [...row]);

		// Add player
		_board[position.y][position.x] = player_ch;

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
		const isAir = inBounds && board[y][x] === ' ';
		return inBounds && isAir;
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

		const handleKeyDown = (e) => {
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
			}
		}
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListeneer('keydown', handleKeyDown);
		};
	}, []);

	useEffect(() => {
		setDisplayString(boardToString(board));
	}, [position]);

	useEffect(() => {
	}, [board]);

	useEffect(() => {
		//console.log(displayString);
	}, [displayString]);


	return (
		<div className={styles.page}>
			<pre className={styles.container}>
				{displayString}
			</pre>
		</div>
	);
}
export default Home;
