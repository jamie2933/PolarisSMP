// ── Ticket type definitions ───────────────────────────────────────────────
// Add a new ticket type by adding an entry here — the panel button, the questions
// (modal) and the channel are all generated from this. Max 5 questions per type
// (Discord modal limit). Labels max 45 chars. style: 'short' or 'paragraph'.
//
// categoryEnv = name of the env var that holds the Discord category ID for this type
// (optional — falls back to DEFAULT_TICKET_CATEGORY_ID, or no category).
//
// openInfo = the message shown to the player when the ticket opens (NO AI). {website} and
// {user} are filled in. Keep it clear: tell them what to post and how it's handled.

module.exports = {
  support: {
    label: 'Support',
    emoji: '📩',
    style: 'PRIMARY',
    color: 0x3b82f6,
    categoryEnv: 'SUPPORT_CATEGORY_ID',
    embedTitle: '📩 New Support Ticket',
    openInfo: 'Describe your issue as clearly as you can and add screenshots if you have them. '
      + 'A staff member has been notified and will reply here.',
    questions: [
      { id: 'issue',  label: 'What is your issue?',            style: 'paragraph', required: true },
      { id: 'tried',  label: 'What have you already tried?',   style: 'paragraph', required: false },
    ],
  },
  partnership: {
    label: 'Partnership Request',
    emoji: '🤝',
    style: 'SUCCESS',
    color: 0xf59e0b,
    categoryEnv: 'PARTNERSHIP_CATEGORY_ID',
    embedTitle: '🤝 New Partnership Request',
    openInfo: 'Thanks for your interest! Post your **Discord invite**, **member count** and **what you offer**. '
      + 'Staff review partnerships **only here in this ticket** — there is no partnership email or separate channel.',
    questions: [
      { id: 'server',  label: 'Your server / community + link',  style: 'short',     required: true },
      { id: 'members', label: 'How many members do you have?',   style: 'short',     required: true },
      { id: 'pings',   label: 'Expected pings / what you offer',  style: 'paragraph', required: true },
    ],
  },
  rank: {
    label: 'Rank Support',
    emoji: '⭐',
    style: 'SECONDARY',
    color: 0x9b5cff,
    categoryEnv: 'RANK_CATEGORY_ID',
    embedTitle: '⭐ New Rank Support Ticket',
    openInfo: 'This is for a problem with a rank you already **purchased** — please post your **proof/receipt**. '
      + '(If you want to *buy* a rank, that\'s on our store.) Staff has been pinged to verify.',
    questions: [
      { id: 'rank',    label: 'Which rank is this about?',       style: 'short',     required: true },
      { id: 'problem', label: 'What is the problem?',            style: 'paragraph', required: true },
      { id: 'proof',   label: 'Proof (receipt / screenshot link)', style: 'short',   required: false },
    ],
  },
  website: {
    label: 'Website Issues',
    emoji: '🌐',
    style: 'SECONDARY',
    color: 0x22c55e,
    categoryEnv: 'WEBSITE_CATEGORY_ID',
    embedTitle: '🌐 New Website Issue',
    openInfo: 'Tell us what went wrong on the website — the **page/URL** and a **screenshot** help a lot. '
      + 'Staff has been notified and will look into it.',
    questions: [
      { id: 'problem', label: 'What is the problem?',            style: 'paragraph', required: true },
      { id: 'page',    label: 'Which page / URL?',               style: 'short',     required: false },
    ],
  },
  prize: {
    label: 'Claim a Prize',
    emoji: '🎁',
    style: 'SUCCESS',
    color: 0xffd700,
    categoryEnv: 'PRIZE_CATEGORY_ID',
    embedTitle: '🎁 Prize Claim',
    openInfo: 'Post **what you won** and **where/when** you won it, plus proof (screenshot). '
      + 'Staff will verify and hand it out here.',
    questions: [
      { id: 'won',   label: 'What did you win?',                 style: 'short',     required: true },
      { id: 'where', label: 'Where / when did you win it?',      style: 'short',     required: true },
      { id: 'proof', label: 'Proof (screenshot link)',          style: 'short',     required: false },
    ],
  },
};
