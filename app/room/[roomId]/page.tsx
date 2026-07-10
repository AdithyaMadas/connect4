'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameBoard } from '@/components/GameBoard';
import type { Board, Cell } from '@/lib/connect4';
import { unlockAudio } from '@/lib/sound';

interface PublicState {
  board: Board;
  currentPlayer: Cell;
  winner: Cell | 0;
  isDraw: boolean;
  opponentJoined: boolean;
  p1Name: string;
  p2Name: string | null;
  updatedAt: number;
}

type LocalAuth = { token: string; player: Cell | 0 };
type Phase = 'loading' | 'enter_name' | 'joining' | 'ready' | 'not_found' | 'error';

function storageKey(roomId: string) {
  return `connect4:${roomId}`;
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = (params.roomId as string).toUpperCase();
  const router = useRouter();

  const [auth, setAuth] = useState<LocalAuth | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Establish identity: reconnect using a saved token, or ask for a name
  // before claiming the open seat (or falling back to spectating).
  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem(storageKey(roomId));
    if (saved) {
      try {
        const parsed: LocalAuth = JSON.parse(saved);
        if (!cancelled) {
          setAuth(parsed);
          setPhase('ready');
        }
        return;
      } catch {
        localStorage.removeItem(storageKey(roomId));
      }
    }
    if (!cancelled) setPhase('enter_name');
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const joinRoom = useCallback(async () => {
    unlockAudio(); // called from a click handler, so this satisfies autoplay policies
    setPhase('joining');
    try {
      const res = await fetch(`/api/room/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (res.status === 404) {
        setPhase('not_found');
        return;
      }
      if (!res.ok) throw new Error('join failed');
      const data = await res.json();
      const newAuth: LocalAuth = { token: data.token, player: data.player };
      // Spectators get an empty token (nothing to reconnect to) — only
      // persist real seats so a refresh doesn't strand a player.
      if (data.player !== 0) {
        localStorage.setItem(storageKey(roomId), JSON.stringify(newAuth));
      }
      setAuth(newAuth);
      if (data.state) setState(data.state);
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, [roomId, nameInput]);

  // Poll for game state once identity is established.
  useEffect(() => {
    if (phase !== 'ready') return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/room/${roomId}`, { cache: 'no-store' });
        if (res.status === 404) {
          if (!cancelled) setPhase('not_found');
          return;
        }
        if (!res.ok) return;
        const data: PublicState = await res.json();
        if (!cancelled) setState(data);
      } catch {
        // transient network hiccup — the next poll will retry
      }
    }

    poll();
    pollRef.current = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, roomId]);

  const makeMove = useCallback(
    async (col: number) => {
      if (!auth || !state) return;
      unlockAudio();
      if (state.currentPlayer !== auth.player || state.winner || state.isDraw) return;
      try {
        const res = await fetch(`/api/room/${roomId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: auth.token, col }),
        });
        const data = await res.json();
        if (data.state) setState(data.state);
      } catch {
        // next poll resyncs
      }
    },
    [auth, state, roomId]
  );

  const resetGame = useCallback(async () => {
    if (!auth) return;
    unlockAudio();
    try {
      const res = await fetch(`/api/room/${roomId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.token }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch {
      // next poll resyncs
    }
  }, [auth, roomId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; user can select and copy manually
    }
  };

  if (phase === 'loading') {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <p>Connecting…</p>
      </main>
    );
  }

  if (phase === 'enter_name' || phase === 'joining') {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <div className="join-form">
          <p>What&apos;s your name?</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && nameInput.trim() && joinRoom()}
          />
          <button onClick={joinRoom} disabled={!nameInput.trim() || phase === 'joining'}>
            {phase === 'joining' ? 'Joining…' : 'Join Game'}
          </button>
        </div>
      </main>
    );
  }

  if (phase === 'not_found') {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <p className="error">This game link has expired or doesn&apos;t exist.</p>
        <button className="button" onClick={() => router.push('/')}>
          Create a New Game
        </button>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <p className="error">Something went wrong connecting to this game. Please try again.</p>
      </main>
    );
  }

  if (!state || !auth) {
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <p>Loading game…</p>
      </main>
    );
  }

  if (!state.opponentJoined && auth.player !== 0) {
    const shareLink = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <main className="container">
        <h1>Connect 4</h1>
        <p>Share this link with your friend:</p>
        <div className="link-box">
          <input readOnly value={shareLink} onFocus={(e) => e.target.select()} />
          <button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <p>Waiting for your friend to join…</p>
        <p className="hint">Anyone else who opens this link once the game is full can watch live.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Connect 4</h1>
      <GameBoard
        board={state.board}
        currentPlayer={state.currentPlayer}
        winner={state.winner}
        isDraw={state.isDraw}
        myPlayer={auth.player}
        isMyTurn={state.currentPlayer === auth.player}
        p1Name={state.p1Name || 'Red'}
        p2Name={state.p2Name || 'Yellow'}
        canReset={auth.player !== 0}
        makeMove={makeMove}
        resetGame={resetGame}
      />
    </main>
  );
}
