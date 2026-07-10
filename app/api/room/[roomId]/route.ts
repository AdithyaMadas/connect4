import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { parseRoomState, roomKey, toPublicState } from '@/lib/room';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const redis = getRedis();
    const raw = await redis.get(roomKey(params.roomId));
    if (!raw) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const state = parseRoomState(raw);
    return NextResponse.json(toPublicState(state));
  } catch (err) {
    console.error('Failed to fetch room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
