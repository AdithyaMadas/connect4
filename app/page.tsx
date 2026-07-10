'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { unlockAudio } from '@/lib/sound';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async () => {
    if (!name.trim()) return;
    unlockAudio(); // called from a click handler, so this satisfies autoplay policies
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
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
      <div className="join-form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && createGame()}
        />
      </div>
      <button className="button" onClick={createGame} disabled={creating || !name.trim()}>
        {creating ? 'Creating…' : 'Create New Game'}
      </button>
      <Link href="/join" className="button secondary">
        Join a Game
      </Link>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
