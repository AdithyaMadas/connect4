import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <h1>Connect 4</h1>
      <p>Play Connect 4 online with a friend. No sign-up — just share a link.</p>
      <Link href="/host" className="button">
        Create New Game
      </Link>
      <Link href="/join" className="button secondary">
        Join a Game
      </Link>
    </main>
  );
}
