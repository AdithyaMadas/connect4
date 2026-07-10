'use client';

import { useEffect, useRef } from 'react';
import { Board, Cell } from '@/lib/connect4';
import { playDropSound, playDrawSound, playTurnChime, playWinFanfare } from '@/lib/sound';
import { Confetti } from './Confetti';

interface GameBoardProps {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  myPlayer: Cell | 0; // 0 = spectator
  isMyTurn: boolean;
  p1Name: string;
  p2Name: string;
  lastMove: { row: number; col: number } | null;
  spectatorNames: string[];
  canReset: boolean;
  makeMove: (col: number) => void;
  resetGame: () => void;
}

const COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f5a524' };
const COLOR_NAMES: Record<number, string> = { 1: 'Red', 2: 'Yellow' };

export function GameBoard({
  board,
  currentPlayer,
  winner,
  isDraw,
  myPlayer,
  isMyTurn,
  p1Name,
  p2Name,
  lastMove,
  spectatorNames,
  canReset,
  makeMove,
  resetGame,
}: GameBoardProps) {
  const isSpectator = myPlayer === 0;
  const names: Record<number, string> = { 1: p1Name, 2: p2Name };
  const winnerName = winner ? names[winner] : '';
  const currentTurnName = names[currentPlayer];

  // Turn chime — fires whenever it becomes this player's turn.
  useEffect(() => {
    if (!isSpectator && isMyTurn && !winner && !isDraw) {
      playTurnChime();
    }
  }, [isMyTurn, isSpectator, winner, isDraw]);

  // Win fanfare — fires once when a winner is decided.
  useEffect(() => {
    if (winner) playWinFanfare();
  }, [winner]);

  // Draw sound — fires once when the board fills up with no winner.
  useEffect(() => {
    if (isDraw) playDrawSound();
  }, [isDraw]);

  // Piece-drop tap — compares piece counts so it only fires on real moves,
  // not on every poll tick.
  const pieceCountRef = useRef<number>(-1);
  useEffect(() => {
    const count = board.reduce((sum, row) => sum + row.filter((c) => c !== 0).length, 0);
    if (pieceCountRef.current !== -1 && count !== pieceCountRef.current) {
      playDropSound();
    }
    pieceCountRef.current = count;
  }, [board]);

  let status: string;
  if (winner) {
    status = isSpectator
      ? `${winnerName} wins!`
      : winner === myPlayer
        ? 'You won! 🎉'
        : `${winnerName} won.`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else if (isSpectator) {
    status = `${currentTurnName}'s turn`;
  } else {
    status = isMyTurn ? 'Your turn' : `${currentTurnName}'s turn…`;
  }

  return (
    <div>
      <Confetti active={!!winner} />

      {isSpectator && <p className="spectator-badge">👀 Spectating</p>}

      <p className="status">
        {!isSpectator && (
          <>
            You are{' '}
            <span style={{ color: COLORS[myPlayer], fontWeight: 700 }}>
              {names[myPlayer]} ({COLOR_NAMES[myPlayer]})
            </span>
            {' — '}
          </>
        )}
        {status}
      </p>

      {!isSpectator && spectatorNames.length > 0 && (
        <p className="spectators-list">
          👀 Watching: {spectatorNames.join(', ')}
        </p>
      )}

      <div className={`board ${!isSpectator && isMyTurn && !winner && !isDraw ? 'board-your-turn' : ''}`}>
        {board[0].map((_, col) => (
          <button
            key={col}
            className="column"
            disabled={isSpectator || !isMyTurn || !!winner || isDraw || board[0][col] !== 0}
            onClick={() => makeMove(col)}
            aria-label={`Drop piece in column ${col + 1}`}
          >
            {board.map((row, rowIdx) => (
              <span
                key={rowIdx}
                className={`cell ${lastMove && lastMove.row === rowIdx && lastMove.col === col ? 'cell-last-move' : ''}`}
                style={{ background: row[col] ? COLORS[row[col]] : undefined }}
              />
            ))}
          </button>
        ))}
      </div>

      {winner && (
        <div className={`win-banner ${!isSpectator && winner === myPlayer ? 'win-banner-you' : ''}`}>
          <div className="win-banner-emoji">🏆</div>
          <div className="win-banner-text">
            {!isSpectator && winner === myPlayer ? 'You Won!' : `${winnerName} Wins!`}
          </div>
        </div>
      )}

      {canReset && (winner || isDraw) && (
        <button className="reset" onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  );
}
