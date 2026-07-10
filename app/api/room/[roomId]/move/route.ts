import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { parseRoomState, roomKey, toPublicState, ROOM_TTL_SECONDS } from '@/lib/room';
import { checkWin, cloneBoard, dropPiece, isBoardFull, Cell } from '@/lib/connect4';

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const redis = getRedis();
    const key = roomKey(params.roomId);
    const raw = await redis.get(key);
    if (!raw) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const state = parseRoomState(raw);

    const body = await req.json().catch(() => ({}));
    const { token, col } = body as { token?: string; col?: number };

    let player: Cell | null = null;
    if (token && token === state.p1Token) player = 1;
    else if (token && token === state.p2Token) player = 2;

    if (!player) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }
    if (state.winner || state.isDraw) {
      return NextResponse.json({ error: 'game_over', state: toPublicState(state) }, { status: 409 });
    }
    if (state.currentPlayer !== player) {
      return NextResponse.json({ error: 'not_your_turn', state: toPublicState(state) }, { status: 409 });
    }
    if (typeof col !== 'number' || col < 0 || col > 6) {
      return NextResponse.json({ error: 'invalid_move' }, { status: 400 });
    }

    const board = cloneBoard(state.board);
    const landedRow = dropPiece(board, col, player);
    if (landedRow === -1) {
      return NextResponse.json({ error: 'column_full', state: toPublicState(state) }, { status: 409 });
    }

    state.board = board;
    state.lastMove = { row: landedRow, col };
    if (checkWin(board, landedRow, col)) {
      state.winner = player;
    } else if (isBoardFull(board)) {
      state.isDraw = true;
    } else {
      state.currentPlayer = player === 1 ? 2 : 1;
    }
    state.updatedAt = Date.now();

    await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    return NextResponse.json({ state: toPublicState(state) });
  } catch (err) {
    console.error('Failed to apply move', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
