// ── Editable content for /ip, /rules and /media ──────────────────────────────
// Change any text here; {ip} is replaced with the SERVER_IP env var.

module.exports = {
  ip: {
    title: '🌐 Java IP Address',
    steps: [
      '**1.** Click **Multiplayer → Add Server**',
      '**2.** Name it anything (e.g., PolarisSMP)',
      '**3.** Enter the IP: `{ip}`',
      '**4.** Click **Done → Join Server**',
    ],
  },

  rules: {
    title: '📜 PolarisSMP — Rules',
    minecraft: [
      'No hacked clients or cheating software.',
      'No movement, inventory, or crafting mods that give unfair advantages.',
      'No health bars, radar, x-ray, or freecam.',
      'No auto-place, auto-clickers, macros, or scripts.',
      'No mouse tweaks or scroll features that automate actions.',
      'No bug/glitch abuse of any kind.',
      'No item duping (not even attempts).',
      'No IRL trading or external rewards (Discord boosts, invite rewards, gambling, etc.).',
      'No cross-server trading.',
      'No staff impersonation.',
      'Maximum 3 accounts per player.',
      'Do not attempt to find or use the server seed.',
      'Report bugs, glitches, and cheaters immediately.',
      'Do not intentionally lag or crash the server.',
      'Keep chat in-game friendly and appropriate.',
    ],
    discord: [
      'No spamming in text or voice chat.',
      'No harassment, bullying, or toxicity.',
      'No advertising/promotion.',
      'No discrimination, hate speech, or slurs.',
      'No threats of any kind.',
      'Do not share others\' private or personal information (doxxing).',
    ],
  },

  // Keep these identical to the website's Media requirements.
  media: {
    title: '🎬 Media Requirements',
    intro: 'Meet the requirements for **one** platform below to apply for the Media rank.',
    platforms: [
      { name: '🎥 YouTube', lines: [
        'Videos: **750+ views**',
        'Shorts: **2,500+ views**',
        'Or livestreams: **8+ average live viewers**',
      ] },
      { name: '🎵 TikTok', lines: [
        '**5,000+ views**',
        'Or livestreams: **8+ average live viewers**',
      ] },
      { name: '💜 Twitch', lines: [
        '**6+ average live viewers**',
      ] },
    ],
    rules: [
      'The **server IP must be visible** on screen the whole video/stream.',
      'Content must stay **public for at least 30 days**.',
      'Only **real, organic views** — no bots.',
      '**Analytics (proof)** required — no proof, no rank.',
      'Media rank lasts **30 days**, then you must reapply.',
    ],
  },

  // ── FAQ auto-replies (NO AI). Whole-word keyword match on short messages.
  //    {user} = @mention · {ip} = SERVER_IP · {website} = WEBSITE_URL ──
  faq: [
    { match: ['ip', 'what is the ip', 'whats the ip', 'server ip', 'how to join', 'how do i join'],
      reply: 'Hey {user}, the IP is **{ip}**' },
    { match: ['apply', 'application', 'media rank'], reply: 'Hey {user}, you can apply on our website: {website}' },
  ],

  // ── Chat moderation (NO AI): delete messages containing any of these words + warn ──
  bannedWords: ['nigger', 'nigga', 'niga', 'faggot', 'fag', 'retard', 'kys', 'nga', 'niger', 'hurensohn'],
  moderationWarn: 'Hey {user}, you can\'t say that.',

  // ── Ticket assistant (NO AI): on ticket creation, if the answers match a website-solvable
  //    case, point them there; otherwise just say support will handle it. ──
  ticketHints: [
    { keywords: ['ban', 'banned', 'unban', 'appeal'],
      text: 'this looks like it\'s about a **ban** — ban appeals are handled on our website. Submit your **Ban-ID** here: https://polaris-support.up.railway.app/appeal.html' },
    { keywords: ['report', 'cheater', 'hacker'],
      text: 'you can file **reports** (with proof) on our website: https://polaris-support.up.railway.app/apply.html?type=report-player' },
    { keywords: ['apply', 'application', 'media', 'staff', 'developer'],
      text: 'applications are done on our website: {website}' },
    { keywords: ['bug', 'bugs'],
      text: 'this looks like it\'s about a Bug Report - Please report a bug on our website: https://polaris-support.up.railway.app/apply.html?type=bug' },
  ],
  ticketSolvable: 'Hey {user}! 👋 {hint}\n\nIf that doesn\'t solve it, no worries — support will handle this here soon. 💙',
  ticketDefault: 'Hey {user}! 👋 Thanks for opening a ticket — support will handle this soon. 💙',
};
