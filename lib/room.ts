import { Board, Cell, createBoard } from './connect4';

export interface RoomState {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  p1Token: string;
  p2Token: string | null;
  createdAt: number;
  updatedAt: number;
}

/** What we send to clients — never includes the secret player tokens. */
export interface PublicRoomState {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  opponentJoined: boolean;
  updatedAt: number;
}

export const ROOM_TTL_SECONDS = 60 * 60 * 6; // rooms expire after 6 hours

export function roomKey(roomId: string): string {
  return `connect4:room:${roomId.toUpperCase()}`;
}

export function newRoomState(p1Token: string): RoomState {
  return {
    board: createBoard(),
    currentPlayer: 1,
    winner: 0,
    isDraw: false,
    p1Token,
    p2Token: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function toPublicState(room: RoomState): PublicRoomState {
  return {
    board: room.board,
    currentPlayer: room.currentPlayer,
    winner: room.winner,
    isDraw: room.isDraw,
    opponentJoined: !!room.p2Token,
    updatedAt: room.updatedAt,
  };
}

/** Upstash sometimes returns the stored value already parsed, sometimes as a string. */
export function parseRoomState(raw: unknown): RoomState {
  return typeof raw === 'string' ? (JSON.parse(raw) as RoomState) : (raw as RoomState);
}
