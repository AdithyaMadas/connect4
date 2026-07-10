import { Board, Cell, createBoard } from './connect4';

export interface SpectatorEntry {
  token: string;
  name: string;
  lastSeen: number;
}

export interface RoomState {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  p1Token: string;
  p2Token: string | null;
  p1Name: string;
  p2Name: string | null;
  lastMove: { row: number; col: number } | null;
  spectators: SpectatorEntry[];
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
  p1Name: string;
  p2Name: string | null;
  lastMove: { row: number; col: number } | null;
  spectatorNames: string[];
  updatedAt: number;
}

/** A spectator not heard from in this long is considered gone. */
export const SPECTATOR_TIMEOUT_MS = 6000;

export const ROOM_TTL_SECONDS = 60 * 60 * 6; // rooms expire after 6 hours
const MAX_NAME_LENGTH = 20;

export function roomKey(roomId: string): string {
  return `connect4:room:${roomId.toUpperCase()}`;
}

/** Trims/validates a player-supplied display name, falling back to a default. */
export function sanitizeName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
}

export function newRoomState(p1Token: string, p1Name: string): RoomState {
  return {
    board: createBoard(),
    currentPlayer: 1,
    winner: 0,
    isDraw: false,
    p1Token,
    p2Token: null,
    p1Name,
    p2Name: null,
    lastMove: null,
    spectators: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function toPublicState(room: RoomState): PublicRoomState {
  const now = Date.now();
  const activeSpectators = (room.spectators || []).filter(
    (s) => now - s.lastSeen < SPECTATOR_TIMEOUT_MS
  );
  return {
    board: room.board,
    currentPlayer: room.currentPlayer,
    winner: room.winner,
    isDraw: room.isDraw,
    opponentJoined: !!room.p2Token,
    p1Name: room.p1Name,
    p2Name: room.p2Name,
    lastMove: room.lastMove,
    spectatorNames: activeSpectators.map((s) => s.name),
    updatedAt: room.updatedAt,
  };
}

/** Upstash sometimes returns the stored value already parsed, sometimes as a string. */
export function parseRoomState(raw: unknown): RoomState {
  return typeof raw === 'string' ? (JSON.parse(raw) as RoomState) : (raw as RoomState);
}
