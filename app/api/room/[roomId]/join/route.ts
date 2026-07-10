import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getRedis } from '@/lib/redis';
import {
  parseRoomState,
  roomKey,
  sanitizeName,
  toPublicState,
  ROOM_TTL_SECONDS,
  SPECTATOR_TIMEOUT_MS,
} from '@/lib/room';

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
    const name = sanitizeName((body as { name?: string }).name, 'Player 2');

    if (!state.p2Token) {
      // Open seat — claim it as player 2.
      const token = randomUUID();
      state.p2Token = token;
      state.p2Name = name;
      state.updatedAt = Date.now();
      await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
      return NextResponse.json({ token, player: 2, state: toPublicState(state) });
    }

    // Both seats are taken — anyone else who opens the link watches as a
    // spectator. Register them (with a heartbeat) so players can see who's watching.
    const token = randomUUID();
    const now = Date.now();
    const spectators = (state.spectators || []).filter(
      (s) => now - s.lastSeen < SPECTATOR_TIMEOUT_MS
    );
    spectators.push({ token, name, lastSeen: now });
    state.spectators = spectators;
    state.updatedAt = now;
    await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    return NextResponse.json({ token, player: 0, state: toPublicState(state) });
  } catch (err) {
    console.error('Failed to join room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
