// ── Ticket type definitions ───────────────────────────────────────────────
// Add a new ticket type by adding an entry here — the panel button, the questions
// (modal) and the channel are all generated from this. Max 5 questions per type
// (Discord modal limit). Labels max 45 chars. style: 'short' or 'paragraph'.
//
// categoryEnv = name of the env var that holds the Discord category ID for this type
// (optional — falls back to DEFAULT_TICKET_CATEGORY_ID, or no category).

module.exports = {
  support: {
    label: 'Support',
    emoji: '📩',
    style: 'PRIMARY',
    color: 0x3b82f6,
    categoryEnv: 'SUPPORT_CATEGORY_ID',
    embedTitle: '📩 New Support Ticket',
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
    questions: [
      { id: 'won',   label: 'What did you win?',                 style: 'short',     required: true },
      { id: 'where', label: 'Where / when did you win it?',      style: 'short',     required: true },
      { id: 'proof', label: 'Proof (screenshot link)',          style: 'short',     required: false },
    ],
  },
};
