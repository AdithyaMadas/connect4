'use client';

import { useEffect, useRef, useState } from 'react';
import type { DataConnection, Peer as PeerType } from 'peerjs';
import { GameBoard } from '@/components/GameBoard';
import { useConnect4Game } from '@/lib/useConnect4Game';
import { ICE_CONFIG } from '@/lib/iceConfig';

export default function HostPage() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const peerRef = useRef<PeerType | null>(null);

  useEffect(() => {
    let mounted = true;
    import('peerjs').then(({ default: Peer }) => {
      if (!mounted) return;
      const peer = new Peer({ config: ICE_CONFIG });
      peerRef.current = peer;

      peer.on('open', (id) => {
        if (mounted) setPeerId(id);
      });

      peer.on('connection', (c) => {
        c.on('open', () => {
          if (!mounted) return;
          setConn(c);
          setConnected(true);
        });
      });

      peer.on('error', (err) => {
        console.error('Peer error', err.type, err);
      });
    });

    return () => {
      mounted = false;
      peerRef.current?.destroy();
    };
  }, []);

  const game = useConnect4Game(conn, true);

  const shareLink =
    peerId && typeof window !== 'undefined' ? `${window.location.origin}/join?host=${peerId}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; user can select and copy manually
    }
  };

  if (!connected) {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        {!peerId ? (
          <p>Setting up your game…</p>
        ) : (
          <>
            <p>Share this link with your friend:</p>
            <div className="link-box">
              <input readOnly value={shareLink} onFocus={(e) => e.target.select()} />
              <button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <p>Waiting for your friend to join…</p>
          </>
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
