'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const [input, setInput] = useState('');

  const go = () => {
    const match = input.match(/room\/([A-Za-z0-9]+)/);
    const roomId = (match ? match[1] : input.trim()).toUpperCase();
    if (roomId) router.push(`/room/${roomId}`);
  };

  return (
    <main className="container">
      <h1>Connect 4</h1>
      <div className="join-form">
        <p>Paste the game link (or code) your friend sent you:</p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste link or code"
          onKeyDown={(e) => e.key === 'Enter' && go()}
        />
        <button onClick={go}>Join Game</button>
      </div>
    </main>
  );
}
