import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { parseRoomState, roomKey, toPublicState, ROOM_TTL_SECONDS } from '@/lib/room';
import { createBoard } from '@/lib/connect4';

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
    const { token } = body as { token?: string };

    if (token !== state.p1Token && token !== state.p2Token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    state.board = createBoard();
    state.currentPlayer = 1;
    state.winner = 0;
    state.isDraw = false;
    state.lastMove = null;
    state.updatedAt = Date.now();

    await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    return NextResponse.json({ state: toPublicState(state) });
  } catch (err) {
    console.error('Failed to reset room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
