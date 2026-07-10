# Connect 4 Online

Play Connect 4 with a friend in real time — no database, no accounts, no server to run.
It works by connecting two browsers directly (peer-to-peer, via [PeerJS](https://peerjs.com)),
so all you need is Vercel hosting for the app itself.

## How it works

1. One person clicks **Create New Game** — this generates a shareable link.
2. They send the link to a friend.
3. The friend opens it and the two browsers connect directly to each other.
4. Moves are sent instantly between the two players — no polling, no backend database.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Deploy to Vercel

**Option A — via GitHub (recommended)**
1. Create a new GitHub repo and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Connect 4 online"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, import the repo, and click **Deploy**.
   No environment variables or extra configuration needed — Vercel auto-detects Next.js.

**Option B — via Vercel CLI**
```bash
npm install -g vercel
vercel
```
Follow the prompts. That's it — running `vercel` again (or `vercel --prod`) redeploys.

Once deployed, you'll get a URL like `https://your-app.vercel.app`. Share that with friends —
whoever clicks "Create New Game" gets a link to send to the other player.

## Notes & limitations

- Both players need to have the tab open at the same time to connect (it's a live P2P link,
  not an async turn-based game with saved state).
- Connections use PeerJS's free public signaling/STUN server. This works for the vast majority
  of home networks. If a friend is on a strict corporate/school network, the peer connection can
  occasionally fail to establish — there's no fallback TURN server configured (adding one, e.g.
  via a free tier from metered.ca, is possible if you want full reliability).
- Game state lives only in the two browsers' memory — refreshing the page resets the game.
