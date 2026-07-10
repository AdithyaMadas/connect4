'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DataConnection, Peer as PeerType } from 'peerjs';
import { GameBoard } from '@/components/GameBoard';
import { useConnect4Game } from '@/lib/useConnect4Game';
import { ICE_CONFIG } from '@/lib/iceConfig';

function explainError(errType: string | undefined): string {
  switch (errType) {
    case 'peer-unavailable':
      return "This game isn't active right now. Ask your friend to make sure the \"waiting for opponent\" page is still open, or have them create a new game and send you the fresh link.";
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'Trouble reaching the connection service. Check your internet connection, then try again.';
    case 'webrtc':
      return 'Your network or browser is blocking the direct connection. Try a different network (e.g. switch off a VPN, or try mobile data instead of school/work wifi).';
    case 'browser-incompatible':
      return 'Your browser doesn\u2019t support the required video-calling technology (WebRTC). Try Chrome, Firefox, Edge, or Safari.';
    default:
      return errType
        ? `Could not connect (${errType}). Ask your friend for a fresh link and try again.`
        : 'Could not connect. Ask your friend for a fresh link and try again.';
  }
}

function JoinInner() {
  const searchParams = useSearchParams();
  const hostId = searchParams.get('host');

  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorType, setErrorType] = useState<string | undefined>(undefined);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const peerRef = useRef<PeerType | null>(null);

  const connectTo = (targetId: string) => {
    if (!targetId) return;
    setStatus('connecting');
    setErrorType(undefined);

    peerRef.current?.destroy();

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer({ config: ICE_CONFIG });
      peerRef.current = peer;

      peer.on('open', () => {
        const c = peer.connect(targetId, { reliable: true });

        c.on('open', () => {
          setConn(c);
          setStatus('connected');
        });

        c.on('error', (err: unknown) => {
          console.error('Connection error', err);
          setErrorType((err as { type?: string })?.type);
          setStatus('error');
        });
      });

      peer.on('error', (err: unknown) => {
        console.error('Peer error', err);
        setErrorType((err as { type?: string })?.type);
        setStatus('error');
      });
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
          <>
            <p className={status === 'error' ? 'error' : ''}>
              {status === 'error' ? explainError(errorType) : 'Connecting to your friend…'}
            </p>
            {status === 'error' && (
              <button className="reset" onClick={() => connectTo(hostId)}>
                Try Again
              </button>
            )}
          </>
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
            {status === 'error' && <p className="error">{explainError(errorType)}</p>}
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
