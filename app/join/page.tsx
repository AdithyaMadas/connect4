'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DataConnection, Peer as PeerType } from 'peerjs';
import { GameBoard } from '@/components/GameBoard';
import { useConnect4Game } from '@/lib/useConnect4Game';

function JoinInner() {
  const searchParams = useSearchParams();
  const hostId = searchParams.get('host');

  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [conn, setConn] = useState<DataConnection | null>(null);
  const peerRef = useRef<PeerType | null>(null);

  const connectTo = (targetId: string) => {
    if (!targetId) return;
    setStatus('connecting');
    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const c = peer.connect(targetId);
        c.on('open', () => {
          setConn(c);
          setStatus('connected');
        });
        c.on('error', () => setStatus('error'));
      });

      peer.on('error', () => setStatus('error'));
    });
  };

  useEffect(() => {
    if (hostId) connectTo(hostId);
    return () => {
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId]);

  const game = useConnect4Game(conn, false);

  if (status !== 'connected') {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        {hostId ? (
          <p className={status === 'error' ? 'error' : ''}>
            {status === 'error'
              ? 'Could not connect. Ask your friend for a new link.'
              : 'Connecting to your friend…'}
          </p>
        ) : (
          <div className="join-form">
            <p>Paste the game link your friend sent you:</p>
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste link here"
            />
            <button
              onClick={() => {
                const match = manualInput.match(/host=([^&]+)/);
                connectTo(match ? match[1] : manualInput.trim());
              }}
            >
              Join Game
            </button>
            {status === 'error' && (
              <p className="error">Could not connect. Check the link and try again.</p>
            )}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Connect 4</h1>
      <GameBoard {...game} isMyTurn={game.currentPlayer === game.myPlayer} />
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p>Loading…</p>
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
