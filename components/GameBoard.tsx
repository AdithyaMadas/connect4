'use client';

import { Board, Cell } from '@/lib/connect4';

interface GameBoardProps {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  myPlayer: Cell;
  isMyTurn: boolean;
  makeMove: (col: number) => void;
  resetGame: () => void;
}

const COLORS: Record<number, string> = { 1: '#ef4444', 2: '#eab308' };
const NAMES: Record<number, string> = { 1: 'Red', 2: 'Yellow' };

export function GameBoard({
  board,
  currentPlayer,
  winner,
  isDraw,
  myPlayer,
  isMyTurn,
  makeMove,
  resetGame,
}: GameBoardProps) {
  let status: string;
  if (winner) status = winner === myPlayer ? 'You won! 🎉' : 'Your friend won.';
  else if (isDraw) status = "It's a draw!";
  else status = isMyTurn ? 'Your turn' : "Friend's turn…";

  return (
    <div>
      <p className="status">
        You are <span style={{ color: COLORS[myPlayer], fontWeight: 700 }}>{NAMES[myPlayer]}</span>
        {' — '}
        {status}
      </p>
      <div className="board">
        {board[0].map((_, col) => (
          <button
            key={col}
            className="column"
            disabled={!isMyTurn || !!winner || isDraw || board[0][col] !== 0}
            onClick={() => makeMove(col)}
            aria-label={`Drop piece in column ${col + 1}`}
          >
            {board.map((row, rowIdx) => (
              <span
                key={rowIdx}
                className="cell"
                style={{ background: row[col] ? COLORS[row[col]] : undefined }}
              />
            ))}
          </button>
        ))}
      </div>
      {(winner || isDraw) && (
        <button className="reset" onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  );
}
