# PolarisBot — Welcome + Ticket System

A Discord bot for PolarisSMP: welcome messages **and** a full ticket system
(Support, Partnership, Rank Support, Website Issues, Claim a Prize). Built to be
extended — add new ticket types in `tickets.js`.

## Setup

1. **Create the bot:** https://discord.com/developers/applications → New Application →
   **Bot** → *Reset Token* → copy the token.
2. **Enable the Server Members Intent** (Bot tab → Privileged Gateway Intents →
   *Server Members Intent* ON) — needed for welcome messages.
3. **Invite it** with the *bot* + *applications.commands* scopes and permissions:
   Manage Channels, Manage Roles, Send Messages, Embed Links, Read Message History.
   (OAuth2 → URL Generator, or use an invite link with admin for simplicity.)
4. **Deploy on Railway:** push this folder as a repo → New Project → Deploy from repo.
   Railway auto-detects Node and runs `npm start`.
5. **Set the Variables** in Railway (see `.env.example`): `DISCORD_TOKEN`, `GUILD_ID`,
   `STAFF_ROLE_ID`, optionally the category IDs + welcome settings.
6. In Discord, run **`/panel`** in the channel where the ticket panel should live.

## How it works

- **/panel** posts the ticket panel (buttons per type).
- A player clicks a button → a short **questions form** (modal) pops up.
- On submit, a **private ticket channel** is created in that type's category, the
  **@Staff role + the player** are pinged, and their answers are posted.
- **Close / Close with reason** (red) — usable by the opener or staff. Closing:
  - removes the opener's access (they can no longer see the ticket),
  - shows **Open / Delete** controls (staff only),
  - **DMs the opener** who closed it + the reason.
- **Open** reopens (restores the opener's access). **Delete** removes the channel.

## Add a new ticket type

Edit `tickets.js` — copy an existing entry, change the label/emoji/questions, and
(optionally) add a `<TYPE>_CATEGORY_ID` env var. The panel button + form update
automatically. Max 5 questions per type (Discord limit).

## Get IDs (need Developer Mode: User Settings → Advanced → Developer Mode)
- Server ID: right-click server icon → Copy Server ID
- Role ID: Server Settings → Roles → right-click role → Copy Role ID
- Category ID: right-click a category → Copy Channel ID
