'use client'

import Image from 'next/image';
import { Share_Tech_Mono } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

const board_width = 15;
const board_height = 10;

const boardToString = (board) => {
	let out = '';
	for(let i=0; i<board_height-1; i++) {
		for(let j=0; j<board_width; j++)
			out += board[i][j];
		out += '\n';
	}
	for(let i=0; i<board_width; i++)
		out += board[board_height-1][i];

	return out;
}

const validPosition = (x, y) => {
	return x >= 0 && x < board_width && y >= 0 && y < board_height;
}

const Home = () => {

	const emptyBoard = () => {
		const newBoard = Array(board_height).fill().map(() => Array(board_width).fill(' '));
		newBoard[position.y][position.x] = '*';
		return newBoard;
	}

	const [ displayString, setDisplayString ] = useState('');
	const [ position, setPosition ] = useState({ x: 0, y: 0 });
	const [ board, setBoard ] = useState(emptyBoard());
	const previousPositionRef = useRef(position);

	useEffect(() => {

		const move = (xoff, yoff) => {
			setPosition(prev => {
				previousPositionRef.current = prev;
				return {
					x: Math.min(board_width-1, Math.max(prev.x + xoff, 0)), 
					y: Math.min(board_height-1, Math.max(prev.y + yoff, 0)) 
				}
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
		const prev = previousPositionRef.current;
		setBoard(prev => {
			const newBoard = prev.map(row => Array(board_width).fill(' '));
			newBoard[position.y][position.x] = '*';
			return newBoard;
		});
		console.log('Position: ', position);
	}, [position]);

	useEffect(() => {
		setDisplayString(boardToString(board));
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
