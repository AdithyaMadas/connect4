import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRedis } from '@/lib/redis';
import { newRoomState, roomKey, sanitizeName, ROOM_TTL_SECONDS } from '@/lib/room';

function generateRoomId(length = 6): string {
  // Avoid ambiguous characters (0/O, 1/I) so codes are easy to read/type aloud.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedis();
    const roomId = generateRoomId();
    const token = randomUUID();
    const body = await req.json().catch(() => ({}));
    const name = sanitizeName((body as { name?: string }).name, 'Player 1');
    const state = newRoomState(token, name);

    await redis.set(roomKey(roomId), JSON.stringify(state), { ex: ROOM_TTL_SECONDS });

    return NextResponse.json({ roomId, token });
  } catch (err) {
    console.error('Failed to create room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
