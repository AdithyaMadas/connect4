import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRedis } from '@/lib/redis';
import { parseRoomState, roomKey, toPublicState, ROOM_TTL_SECONDS } from '@/lib/room';

export async function POST(_req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const redis = getRedis();
    const key = roomKey(params.roomId);
    const raw = await redis.get(key);
    if (!raw) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const state = parseRoomState(raw);

    if (state.p2Token) {
      return NextResponse.json({ error: 'room_full' }, { status: 409 });
    }

    const token = randomUUID();
    state.p2Token = token;
    state.updatedAt = Date.now();
    await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });

    return NextResponse.json({ token, player: 2, state: toPublicState(state) });
  } catch (err) {
    console.error('Failed to join room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
