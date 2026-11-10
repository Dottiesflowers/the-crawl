# The Crawl

A Dungeon Crawler Carl–style dungeon crawl for five friends, played in the browser.

This repo is one Cloudflare Worker:

- `public/` is the game (one HTML page, Three.js, models and textures).
- `src/worker.js` is the server: accounts with invite codes, sessions, character saves, the party roster, NPC conversation memory, and the relay that calls Claude for the AI host and NPCs.
- All data lives in one SQLite-backed Durable Object (`Campaign`). It is created automatically on first deploy, so there is nothing to set up by hand.

## One-time setup (Cloudflare dashboard)

1. **Workers & Pages → Create → Import a repository**, pick this repo. Keep the defaults (deploy command `npx wrangler deploy`). Every push to `main` redeploys.
2. After the first deploy, open the Worker → **Settings → Variables and Secrets** and add two **secrets**:
   - `ANTHROPIC_API_KEY`: your key from console.anthropic.com. Set a monthly spend limit there.
   - `DM_INVITE`: any code you like, for example `DOTTIE-1970`. It creates the DM account and only works once.
3. Open `https://the-crawl.<your-subdomain>.workers.dev`, choose **I have an invite**, enter your `DM_INVITE` code, and pick a username and password.
4. On the **Sheet** tab, use **DM tools → Make an invite code** once for each friend. Each code works once.

## Costs

- Cloudflare Workers free plan covers a five-player game.
- AI: NPC lines use `claude-haiku-5-5`; character creation uses `claude-sonnet-5-5` (both set in `wrangler.toml`). Each player is capped at 400 AI calls a day.

## Local development

```
npm install
echo "DM_INVITE=TEST-DM01" > .dev.vars      # add ANTHROPIC_API_KEY=... to test AI
npx wrangler dev
```

Without an API key the game still runs; the System falls back to keyword guesses and NPCs use stock lines.

## Security notes

- Passwords are hashed with PBKDF2-SHA256 and a per-user salt. Sessions are random tokens in an HttpOnly, Secure cookie.
- The API key stays in the Worker and never reaches the browser. Only signed-in players can use the AI relay.
- The DM can reset a player's password (`POST /api/dm/reset-password`) and read NPC conversation logs.
