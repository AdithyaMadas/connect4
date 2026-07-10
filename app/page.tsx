'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/room', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const { roomId, token } = await res.json();
      localStorage.setItem(`connect4:${roomId}`, JSON.stringify({ token, player: 1 }));
      router.push(`/room/${roomId}`);
    } catch {
      setError('Could not create a game. Please try again.');
      setCreating(false);
    }
  };

  return (
    <main className="container">
      <h1>Connect 4</h1>
      <p>Play Connect 4 online with a friend. No sign-up — just share a link.</p>
      <button className="button" onClick={createGame} disabled={creating}>
        {creating ? 'Creating…' : 'Create New Game'}
      </button>
      <Link href="/join" className="button secondary">
        Join a Game
      </Link>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
