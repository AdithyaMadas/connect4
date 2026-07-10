import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Connect 4 Online',
  description: 'Play Connect 4 with a friend — just share a link.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
