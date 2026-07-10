'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DataConnection } from 'peerjs';
import { Board, Cell, checkWin, cloneBoard, createBoard, dropPiece, isBoardFull } from './connect4';

type Message = { type: 'move'; col: number } | { type: 'reset' };

export function useConnect4Game(conn: DataConnection | null, isHost: boolean) {
  const myPlayer: Cell = isHost ? 1 : 2;
  const [board, setBoard] = useState<Board>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Cell>(1);
  const [winner, setWinner] = useState<Cell | 0>(0);
  const [isDraw, setIsDraw] = useState(false);

  const applyMove = useCallback((col: number, player: Cell) => {
    setBoard((prev) => {
      const next = cloneBoard(prev);
      const landedRow = dropPiece(next, col, player);
      if (landedRow === -1) return prev; // invalid move, ignore
      if (checkWin(next, landedRow, col)) {
        setWinner(player);
      } else if (isBoardFull(next)) {
        setIsDraw(true);
      } else {
        setCurrentPlayer(player === 1 ? 2 : 1);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!conn) return;
    const handler = (data: unknown) => {
      const msg = data as Message;
      if (msg.type === 'move') {
        const opponent: Cell = isHost ? 2 : 1;
        applyMove(msg.col, opponent);
      } else if (msg.type === 'reset') {
        setBoard(createBoard());
        setCurrentPlayer(1);
        setWinner(0);
        setIsDraw(false);
      }
    };
    conn.on('data', handler);
    return () => {
      conn.off('data', handler);
    };
  }, [conn, isHost, applyMove]);

  const makeMove = useCallback(
    (col: number) => {
      if (winner || isDraw) return;
      if (currentPlayer !== myPlayer) return;
      if (board[0][col] !== 0) return; // column full
      applyMove(col, myPlayer);
      conn?.send({ type: 'move', col } as Message);
    },
    [winner, isDraw, currentPlayer, myPlayer, board, applyMove, conn]
  );

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinner(0);
    setIsDraw(false);
    conn?.send({ type: 'reset' } as Message);
  }, [conn]);

  return { board, currentPlayer, winner, isDraw, myPlayer, makeMove, resetGame };
}
