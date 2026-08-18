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
    { match: ['website', 'site'],  reply: 'Hey {user}, our website is {website}' },
    { match: ['apply', 'application', 'media rank'], reply: 'Hey {user}, you can apply on our website: {website}' },
  ],

  // ── Chat moderation (NO AI): delete messages containing any of these words + warn ──
  bannedWords: ['nigger', 'nigga', 'niga', 'faggot', 'fag', 'retard', 'kys', 'hurensohn'],
  moderationWarn: 'Hey {user}, you can\'t say that.',

  // ── Ticket assistant (NO AI): on ticket creation, if the answers match a website-solvable
  //    case, point them there; otherwise just say support will handle it. ──
  ticketHints: [
    { keywords: ['ban', 'banned', 'unban', 'appeal'],
      text: 'this looks like it\'s about a **ban** — ban appeals are handled on our website. Submit your **Ban-ID** here: {website}' },
    { keywords: ['report', 'cheater', 'hacker'],
      text: 'you can file **reports** (with proof) on our website: {website}' },
    { keywords: ['apply', 'application', 'media', 'staff', 'developer'],
      text: 'applications are done on our website: {website}' },
  ],
  ticketSolvable: 'Hey {user}! 👋 {hint}\n\nIf that doesn\'t solve it, no worries — support will handle this here soon. 💙',
  ticketDefault: 'Hey {user}! 👋 Thanks for opening a ticket — support will handle this soon. 💙',

  // ── AI-first ticket assistant ──────────────────────────────────────────────
  assistant: {
    intro: 'Hi {user}! 👋 I\'m the PolarisSMP assistant — I\'ll try to help you right here. Just tell me what you need! ' +
      'If I can\'t solve it, our staff team will step in.\n*(Staff: click 🙋 Take over to handle this yourself.)*',
    staffActive: '👋 A staff member is handling this ticket now — I\'ll step back. Mention me if you need me again.',
    escalateStaff: '🚨 this ticket needs a human — {user} needs help I can\'t give.',
    escalateUser: 'I\'ve flagged this for our staff team — someone will help you as soon as possible. 💙',
    closeConfirm: 'Just to confirm {user} — should I close this ticket?',
    keepOpen: 'No problem — I\'ll keep this ticket open. 👍',
    check24h: 'Hi {user} — this ticket has been open for a while. Is it still needed? If everything\'s sorted, just say ' +
      '**you can close this ticket**. Otherwise, let us know what you still need!',

    // Rule-based intents (checked top→bottom, first match wins). No AI needed — fast & reliable.
    // type: 'reply' (send text) · 'close' (ask to close) · 'escalate' (hand to staff)
    intents: [
      { type: 'close', keys: ['you can close', 'close this ticket', 'close the ticket', 'you may close', 'please close', 'you can now close', 'close it'] },
      { type: 'escalate', reason: 'Ban-ID / unban needs a human',
        keys: ['ban id', 'ban-id', 'banid', 'wrong id', 'invalid id', 'id is wrong', 'my id'] },
      { type: 'reply', keys: ['doesnt work', 'does not work', 'not working', 'won\'t let me', 'wont let me', 'can\'t appeal', 'cant appeal', 'website is broken', 'error on the website', 'site is down'],
        text: 'Sorry about that! If the website isn\'t working, please post **a screenshot of the website** (showing the problem) **and an in-game screenshot** right here — our staff team will then sort it out for you.' },
      { type: 'reply', keys: ['appeal', 'unban', 'get unbanned', 'ban appeal', 'i was banned', 'im banned', 'i am banned', 'banned for', 'my ban'],
        text: 'Hey {user}! Ban appeals are handled on our website — go to {website}, open **Ban Appeal**, and follow the steps. Our team reviews every appeal there. 💙' },
      { type: 'reply', keys: ['how to join', 'how do i join', 'how can i join', 'join the server', 'what is the ip', 'whats the ip', 'server ip', 'ip'],
        text: 'You can join at **{ip}** — add it under Multiplayer → Add Server. See you in-game! 🎮' },
      { type: 'reply', keys: ['rules', 'rule'],
        text: 'You can read all our rules in the rules channel. Short version: no cheats/hacks, no harassment, no advertising, be respectful. If something specific is unclear, just ask!' },
      { type: 'reply', keys: ['media', 'media rank', 'content creator', 'youtuber', 'streamer', 'apply', 'application'],
        text: 'You can apply for the **Media rank** on our website: {website} → **Apply**. Make sure you meet the requirements (views/viewers + the IP visible on screen + analytics as proof).' },
      { type: 'reply', keys: ['status', 'is the server online', 'is the server up', 'server down', 'is it online', 'server offline'],
        text: 'You can always see the live server status in our status channel (🟢 online / 🟡 maintenance / 🔴 offline). If you can\'t connect, give it a few minutes and try again!' },
      { type: 'reply', keys: ['found a bug', 'a bug', 'bug', 'glitch'],
        text: 'Thanks for helping! Please report bugs on our website: {website} → **Bug Report** — or describe it here with the steps to reproduce + a screenshot if you have one.' },
      { type: 'reply', keys: ['report a player', 'report player', 'report a user', 'report someone', 'report a hacker', 'report a cheater'],
        text: 'You can report a player on our website: {website} → **Report a Player**. Please include their exact name and any proof (screenshot/clip).' },
      { type: 'reply', keys: ['report a staff', 'report staff', 'staff abuse', 'report a mod', 'report an admin'],
        text: 'You can report a staff member on our website: {website} → **Report Staff**. It\'s handled discreetly by senior staff.' },
    ],
  },
};
