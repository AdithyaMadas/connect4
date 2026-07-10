# Connect 4 Online

Play Connect 4 with a friend in real time — just share a link. No peer-to-peer/WebRTC,
so it works reliably across any two networks (home wifi, mobile data, corporate/school
firewalls, etc.) — all traffic is plain HTTPS to your own Vercel app.

## How it works

1. One person clicks **Create New Game** — a room is created and a link is shown.
2. They send the link to a friend.
3. The friend opens it and is seated as player 2.
4. Each move is sent to a small serverless API, saved to a Redis database, and the other
   player's browser picks it up the next time it polls (about once a second).

## One-time setup: add a Redis database

This app needs a tiny key-value store to hold game state between moves. Vercel doesn't
bundle one anymore, but adding one takes under a minute and is free for this use case:

1. Open your project on vercel.com → **Storage** tab
2. Click **Create Database** (or **Browse Marketplace**) and choose **Upstash** → **Redis**
   (free tier is plenty)
3. Follow the prompts to create it and **connect it to this project** — this automatically
   adds the right environment variables
4. Go to **Deployments** and redeploy (or just push a new commit) so the app picks up the
   new environment variables

Without this step, creating a game will fail with a "server_error".

## Run locally

```bash
npm install
vercel env pull .env.local   # pulls the Redis credentials from your Vercel project
npm run dev
```

Then open http://localhost:3000

## Deploy to Vercel

**Option A — via GitHub (recommended)**
1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Connect 4 online"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, import the repo, and click **Deploy**.
3. Follow the Redis setup steps above, then redeploy.

**Option B — via Vercel CLI**
```bash
npm install -g vercel
vercel
```
Then add the Redis integration from the dashboard as above, and run `vercel --prod` again.

Once deployed, share your **production** URL (not a preview/deployment-hash URL — those
require login by default). Whoever clicks "Create New Game" gets a link to send the other
player.

## Notes & limitations

- Rooms expire automatically after 6 hours of being created.
- State updates are polled roughly once a second, so there's a small (~1s) delay before you
  see your friend's move — this trade-off is what makes the connection reliable everywhere,
  instead of depending on direct peer-to-peer networking.
- If a player closes their tab, their token is remembered in their browser's local storage,
  so reopening the same link reconnects them to the same seat.
