import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { parseRoomState, roomKey, toPublicState, ROOM_TTL_SECONDS, SPECTATOR_TIMEOUT_MS } from '@/lib/room';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const redis = getRedis();
    const key = roomKey(params.roomId);
    const raw = await redis.get(key);
    if (!raw) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const state = parseRoomState(raw);

    // Spectators send their token with each poll as a heartbeat, so the
    // "watching" list players see stays current without needing sockets.
    const spectatorToken = req.nextUrl.searchParams.get('spectatorToken');
    if (spectatorToken) {
      const now = Date.now();
      const spectators = (state.spectators || []).filter(
        (s) => now - s.lastSeen < SPECTATOR_TIMEOUT_MS
      );
      const existing = spectators.find((s) => s.token === spectatorToken);
      if (existing) {
        existing.lastSeen = now;
      }
      state.spectators = spectators;
      state.updatedAt = now;
      await redis.set(key, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    }

    return NextResponse.json(toPublicState(state));
  } catch (err) {
    console.error('Failed to fetch room', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
