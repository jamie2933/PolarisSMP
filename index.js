require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials, Events,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, SlashCommandBuilder, REST, Routes, MessageFlags,
} = require('discord.js');
const TICKETS = require('./tickets');
const C = require('./content');

// ── Config (all from Railway env vars) ───────────────────────────────────────
const TOKEN            = process.env.DISCORD_TOKEN || '';
const GUILD_ID         = process.env.GUILD_ID || '';
const STAFF_ROLE_ID    = process.env.STAFF_ROLE_ID || '';
const DEFAULT_CATEGORY = process.env.DEFAULT_TICKET_CATEGORY_ID || '';
const SERVER_IP        = process.env.SERVER_IP || 'PolarisSMP.net';
const BANNER_URL       = process.env.BANNER_URL || '';
const WEBSITE_URL      = process.env.WEBSITE_URL || '';
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL     = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const BRAND_COLOR      = 0x3b82f6;

const BTN_STYLE = { PRIMARY: ButtonStyle.Primary, SUCCESS: ButtonStyle.Success, SECONDARY: ButtonStyle.Secondary, DANGER: ButtonStyle.Danger };

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

// Fill placeholders in content strings.  {user} = @mention · {ip} · {website}
function fill(str, userId) {
  return String(str)
    .replaceAll('{user}', userId ? `<@${userId}>` : 'there')
    .replaceAll('{ip}', SERVER_IP)
    .replaceAll('{website}', WEBSITE_URL || 'our website');
}
// Whole-word test so "ip" doesn't match "trip"/"recipe".
function hasWord(text, word) {
  const w = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, 'i').test(text);
}

let statusMsgRef = null; // { channelId, messageId } — the live status message

// ── Message builders ─────────────────────────────────────────────────────────
function panelMessage() {
  const embed = new EmbedBuilder().setColor(BRAND_COLOR).setTitle('🎫 PolarisSMP Support')
    .setDescription(
      'Need help? Open a ticket below and our team will assist you.\n\n' +
      '📩 **Support** — general help & questions\n' +
      '🤝 **Partnership Request** — apply to partner with us\n' +
      '⭐ **Rank Support** — issues with a purchased rank\n' +
      '🌐 **Website Issues** — problems on the website\n' +
      '🎁 **Claim a Prize** — claim something you won\n\n' +
      '*Pick the matching button — you\'ll be asked a few quick questions.*')
    .setFooter({ text: 'PolarisSMP • Ticketing' });
  const buttons = Object.entries(TICKETS).map(([key, t]) =>
    new ButtonBuilder().setCustomId('open:' + key).setLabel(t.label).setEmoji(t.emoji).setStyle(BTN_STYLE[t.style] || ButtonStyle.Secondary));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  return { embeds: [embed], components: rows };
}

function ipMessage() {
  const e = new EmbedBuilder().setColor(BRAND_COLOR).setTitle(C.ip.title)
    .setDescription(C.ip.steps.join('\n\n').replace('{ip}', SERVER_IP));
  if (BANNER_URL) e.setImage(BANNER_URL);
  return { embeds: [e] };
}

function rulesMessage() {
  const e = new EmbedBuilder().setColor(BRAND_COLOR).setTitle(C.rules.title).addFields(
    { name: '🟩 Minecraft Rules', value: C.rules.minecraft.map((r) => '• ' + r).join('\n').slice(0, 1024) },
    { name: '🟦 Discord Rules', value: C.rules.discord.map((r) => '• ' + r).join('\n').slice(0, 1024) });
  return { embeds: [e] };
}

function mediaMessage() {
  const e = new EmbedBuilder().setColor(BRAND_COLOR).setTitle(C.media.title).setDescription(C.media.intro);
  C.media.platforms.forEach((p) => e.addFields({ name: p.name, value: p.lines.map((l) => '• ' + l).join('\n') }));
  e.addFields({ name: '📋 Rules', value: C.media.rules.map((r) => '• ' + r).join('\n').slice(0, 1024) });
  const comps = [];
  if (WEBSITE_URL) comps.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Apply on the Website').setEmoji('🌐').setStyle(ButtonStyle.Link).setURL(WEBSITE_URL)));
  return { embeds: [e], components: comps };
}

// ── Ready: register all slash commands (guild = instant) ─────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  try {
    const cmds = [
      new SlashCommandBuilder().setName('panel').setDescription('Post the ticket panel'),
      new SlashCommandBuilder().setName('ip').setDescription('Post the how-to-join / IP message'),
      new SlashCommandBuilder().setName('rules').setDescription('Post the server rules'),
      new SlashCommandBuilder().setName('media').setDescription('Post the media requirements'),
      new SlashCommandBuilder().setName('status').setDescription('Set the server status')
        .addStringOption((o) => o.setName('state').setDescription('online / maintenance / offline').setRequired(true)
          .addChoices({ name: 'Online', value: 'online' }, { name: 'Maintenance', value: 'maintenance' }, { name: 'Offline', value: 'offline' })),
    ].map((x) => x.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).toJSON());
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(c.user.id, GUILD_ID), { body: cmds });
    else await rest.put(Routes.applicationCommands(c.user.id), { body: cmds });
    console.log('Slash commands registered: panel, ip, rules, media, status');
  } catch (e) { console.error('command registration failed:', e.message); }
  // Nudge tickets open 24h+ (asks if still needed — never auto-closes).
  setInterval(() => check24hTickets().catch(() => {}), 30 * 60 * 1000);
});

// ── Interactions ─────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isChatInputCommand()) {
      switch (i.commandName) {
        case 'panel':  await i.channel.send(panelMessage());  return i.reply({ content: '✅ Panel posted.', flags: MessageFlags.Ephemeral });
        case 'ip':     await i.channel.send(ipMessage());     return i.reply({ content: '✅ IP message posted.', flags: MessageFlags.Ephemeral });
        case 'rules':  await i.channel.send(rulesMessage());  return i.reply({ content: '✅ Rules posted.', flags: MessageFlags.Ephemeral });
        case 'media':  await i.channel.send(mediaMessage());  return i.reply({ content: '✅ Media requirements posted.', flags: MessageFlags.Ephemeral });
        case 'status': return setStatus(i, i.options.getString('state'));
      }
      return;
    }

    // panel button → open the question modal
    if (i.isButton() && i.customId.startsWith('open:')) {
      const type = i.customId.slice(5);
      const t = TICKETS[type];
      if (!t) return i.reply({ content: 'Unknown ticket type.', flags: MessageFlags.Ephemeral });
      const modal = new ModalBuilder().setCustomId('modal:' + type).setTitle(t.label.slice(0, 45));
      t.questions.forEach((q) => modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(q.id).setLabel(q.label.slice(0, 45))
          .setStyle(q.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(!!q.required).setMaxLength(1000))));
      return i.showModal(modal);
    }

    // modal submitted → create the ticket channel
    if (i.isModalSubmit() && i.customId.startsWith('modal:')) {
      const type = i.customId.slice(6);
      const t = TICKETS[type];
      if (!t) return i.reply({ content: 'Unknown ticket type.', flags: MessageFlags.Ephemeral });
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const answers = t.questions.map((q) => ({ q, value: i.fields.getTextInputValue(q.id) || '—' }));
      const categoryId = process.env[t.categoryEnv] || DEFAULT_CATEGORY || null;
      const overwrites = [
        { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ];
      if (STAFF_ROLE_ID) overwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ManageMessages] });
      const channel = await i.guild.channels.create({
        name: `${type}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || `${type}-ticket`,
        type: ChannelType.GuildText, parent: categoryId, topic: `ticket|opener:${i.user.id}|type:${type}`,
        permissionOverwrites: overwrites,
      });
      const embed = new EmbedBuilder().setColor(t.color || BRAND_COLOR).setTitle(t.embedTitle)
        .setDescription(`From: <@${i.user.id}>`)
        .addFields(answers.map((a) => ({ name: a.q.label, value: a.value.slice(0, 1024) }))).setTimestamp();
      const controls = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('closereason').setLabel('Close with reason').setEmoji('📝').setStyle(ButtonStyle.Danger));
      await channel.send({ content: `${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}> ` : ''}<@${i.user.id}>`, embeds: [embed], components: [controls] });

      // AI-first assistant intro + a staff "Take over" button (assistant handles the ticket until staff steps in).
      const takeover = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('asst_takeover').setLabel('Take over').setEmoji('🙋').setStyle(ButtonStyle.Secondary));
      await channel.send({ content: fill(C.assistant.intro, i.user.id), components: [takeover] }).catch(() => {});

      return i.editReply({ content: `✅ Your ticket has been created: ${channel}` });
    }

    if (i.isButton() && i.customId === 'closereason') {
      const modal = new ModalBuilder().setCustomId('closemodal').setTitle('Close ticket').addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason for closing').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)));
      return i.showModal(modal);
    }
    if (i.isButton() && i.customId === 'close') return closeTicket(i, 'No reason provided');
    if (i.isModalSubmit() && i.customId === 'closemodal') return closeTicket(i, i.fields.getTextInputValue('reason'));
    if (i.isButton() && i.customId === 'reopen') return reopenTicket(i);
    if (i.isButton() && i.customId === 'delete') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Only staff can delete tickets.', flags: MessageFlags.Ephemeral });
      await i.reply({ content: '🗑 Deleting ticket in 3s…' });
      return void setTimeout(() => i.channel.delete().catch(() => {}), 3000);
    }

    // ── Assistant buttons ──
    if (i.isButton() && i.customId === 'asst_takeover') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Only staff can take over.', flags: MessageFlags.Ephemeral });
      await markHumanHandled(i.channel);
      await i.update({ components: [] }).catch(() => {});
      return void i.channel.send(`🙋 <@${i.user.id}> is now handling this ticket — the assistant will step back.`).catch(() => {});
    }
    if (i.isButton() && i.customId === 'asst_close_no') {
      await i.update({ components: [] }).catch(() => {});
      return void i.channel.send(fill(C.assistant.keepOpen, openerId(i.channel))).catch(() => {});
    }
    if (i.isButton() && i.customId === 'asst_close_yes') return closeTicket(i, 'Closed at your request');
  } catch (e) {
    console.error('interaction error:', e);
    if (i.isRepliable() && !i.replied && !i.deferred) i.reply({ content: 'Something went wrong.', flags: MessageFlags.Ephemeral }).catch(() => {});
  }
});

// ── Server status ────────────────────────────────────────────────────────────
async function setStatus(i, state) {
  const map = {
    online:      { color: 0x22c55e, emoji: '🟢', text: 'Online',      desc: 'The server is online — come play!' },
    maintenance: { color: 0xf59e0b, emoji: '🟡', text: 'Maintenance', desc: 'The server is under maintenance. Please be patient.' },
    offline:     { color: 0xef4444, emoji: '🔴', text: 'Offline',     desc: 'The server is currently offline.' },
  };
  const s = map[state]; if (!s) return i.reply({ content: 'Unknown state.', flags: MessageFlags.Ephemeral });
  const embed = new EmbedBuilder().setColor(s.color).setTitle(`${s.emoji} Server Status: ${s.text}`)
    .setDescription(s.desc).addFields({ name: 'IP', value: '`' + SERVER_IP + '`' }).setTimestamp()
    .setFooter({ text: `Updated by ${i.user.username}` });
  if (statusMsgRef) {
    try {
      const ch = await client.channels.fetch(statusMsgRef.channelId);
      const m = await ch.messages.fetch(statusMsgRef.messageId);
      await m.edit({ embeds: [embed] });
      return i.reply({ content: `✅ Status set to **${s.text}**.`, flags: MessageFlags.Ephemeral });
    } catch { /* old message gone → post a new one */ }
  }
  const msg = await i.channel.send({ embeds: [embed] });
  statusMsgRef = { channelId: msg.channel.id, messageId: msg.id };
  return i.reply({ content: `✅ Status posted as **${s.text}**. (Pin it — future /status edits this message.)`, flags: MessageFlags.Ephemeral });
}

// ── Ticket helpers ───────────────────────────────────────────────────────────
function isStaff(member) {
  return member && (member.permissions.has(PermissionFlagsBits.ManageChannels) || (STAFF_ROLE_ID && member.roles.cache.has(STAFF_ROLE_ID)));
}
function openerId(channel) { const m = (channel.topic || '').match(/opener:(\d+)/); return m ? m[1] : null; }

async function closeTicket(i, reason) {
  const oid = openerId(i.channel);
  if (!isStaff(i.member) && i.user.id !== oid) return i.reply({ content: '❌ You can\'t close this ticket.', flags: MessageFlags.Ephemeral });
  if (oid) await i.channel.permissionOverwrites.edit(oid, { ViewChannel: false }).catch(() => {});
  const embed = new EmbedBuilder().setColor(0xef4444).setDescription(`🔒 Ticket closed by <@${i.user.id}>\n**Reason:** ${reason}`);
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('reopen').setLabel('Open').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('delete').setLabel('Delete').setEmoji('⛔').setStyle(ButtonStyle.Danger));
  if (i.isModalSubmit()) await i.reply({ embeds: [embed], components: [controls] });
  else { await i.update({ components: [] }).catch(() => {}); await i.channel.send({ embeds: [embed], components: [controls] }); }
  if (oid) {
    try {
      const user = await client.users.fetch(oid);
      const dm = new EmbedBuilder().setColor(0xef4444).setTitle('Your ticket has been closed')
        .setDescription(`Your ticket in **${i.guild.name}** was closed.`)
        .addFields({ name: 'Closed by', value: `<@${i.user.id}>`, inline: true }, { name: 'Reason', value: reason || 'No reason provided', inline: true });
      await user.send({ embeds: [dm] });
    } catch { /* DMs closed */ }
  }
}

async function reopenTicket(i) {
  if (!isStaff(i.member)) return i.reply({ content: '❌ Only staff can reopen tickets.', flags: MessageFlags.Ephemeral });
  const oid = openerId(i.channel);
  if (oid) await i.channel.permissionOverwrites.edit(oid, { ViewChannel: true, SendMessages: true }).catch(() => {});
  await i.update({ components: [] }).catch(() => {});
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('closereason').setLabel('Close with reason').setEmoji('📝').setStyle(ButtonStyle.Danger));
  await i.channel.send({ content: `🔓 Ticket reopened by <@${i.user.id}>.`, components: [controls] });
}

// ── AI-first ticket assistant ─────────────────────────────────────────────────
const isTicketChannel = (ch) => (ch?.topic || '').startsWith('ticket|');
const isHumanHandled  = (ch) => /\|human:1/.test(ch?.topic || '');
async function markHumanHandled(ch) {
  if (ch && !isHumanHandled(ch)) await ch.setTopic((ch.topic || '') + '|human:1').catch(() => {});
}
const pinged24h = new Set();

function matchAssistantIntent(text) {
  for (const it of (C.assistant?.intents || [])) {
    if (it.keys.some((k) => (k.includes(' ') ? text.includes(k) : hasWord(text, k)))) return it;
  }
  return null;
}

// Ask Gemini for a reply, or an "escalate" decision. Returns {action,message,reason} or null.
async function askGemini(history) {
  if (!GEMINI_API_KEY) return null;
  const system =
    'You are the official support assistant for the Minecraft server PolarisSMP, replying inside a PRIVATE Discord ' +
    'support ticket. Be warm, concise and professional (1-3 sentences). ' +
    `Facts: server IP = ${SERVER_IP}; website = ${WEBSITE_URL || 'the PolarisSMP website'} — ban appeals, player/staff ` +
    'reports, bug reports and rank applications are ALL done on the website. ' +
    'You are an INTAKE assistant, NOT a decision-maker: you CANNOT unban anyone, check or fix ban IDs, change ranks, ' +
    'give refunds, punish players, or make any staff decision. ' +
    'Choose action "escalate" (hand to human staff) when: the user needs a human decision/action (ban, unban, ban-ID, ' +
    'punishments, payments, account/rank changes), the user is upset or asks for a human, or you are unsure. ' +
    'Otherwise choose "reply" with a genuinely helpful answer. Never invent rules, prices or punishments. ' +
    'Respond with ONLY JSON: {"action":"reply"|"escalate","message":"...","reason":"short reason (if escalate)"}';
  const contents = history.slice(-10).map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] }));
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } }),
    });
    if (!r.ok) { console.warn('Gemini', r.status, (await r.text()).slice(0, 150)); return null; }
    const d = await r.json();
    const t = d?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!t) return null;
    const mt = t.match(/\{[\s\S]*\}/);
    return JSON.parse(mt ? mt[0] : t);
  } catch (e) { console.warn('Gemini failed:', e.message); return null; }
}

async function ticketHistory(channel, limit = 12) {
  try {
    const msgs = await channel.messages.fetch({ limit });
    return [...msgs.values()].reverse()
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({ role: m.author.bot ? 'ai' : 'player', text: m.content.slice(0, 1500) }));
  } catch { return []; }
}

async function askCloseConfirm(channel, userId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('asst_close_yes').setLabel('Close').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('asst_close_no').setLabel('Keep open').setEmoji('❌').setStyle(ButtonStyle.Secondary));
  await channel.send({ content: fill(C.assistant.closeConfirm, userId), components: [row] }).catch(() => {});
}

async function escalateTicket(channel, userId, reason) {
  await markHumanHandled(channel);   // assistant steps back, staff takes it from here
  const ping = STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}> ` : '';
  await channel.send(ping + fill(C.assistant.escalateStaff, userId) + (reason ? ` *(${reason})*` : '')).catch(() => {});
  await channel.send(fill(C.assistant.escalateUser, userId)).catch(() => {});
}

// Per-message handler for ticket channels: staff-handover → rule intents → Gemini → escalate.
async function handleTicketMessage(m) {
  const ch = m.channel;
  if (isStaff(m.member)) {                          // a staff member wrote → hand over, go quiet
    if (!isHumanHandled(ch)) { await markHumanHandled(ch); await ch.send(fill(C.assistant.staffActive, m.author.id)).catch(() => {}); }
    return;
  }
  if (isHumanHandled(ch)) return;                   // staff is handling → stay silent
  const text = (m.content || '').toLowerCase();
  const intent = matchAssistantIntent(text);
  if (intent) {
    if (intent.type === 'close')    return void askCloseConfirm(ch, m.author.id);
    if (intent.type === 'escalate') return void escalateTicket(ch, m.author.id, intent.reason);
    return void m.reply(fill(intent.text, m.author.id)).catch(() => {});
  }
  const out = await askGemini(await ticketHistory(ch));   // nothing matched → let Gemini try
  if (!out || out.action === 'escalate') return void escalateTicket(ch, m.author.id, out?.reason);
  await m.reply(String(out.message || 'How can I help?').slice(0, 1800)).catch(() => {});
}

// Every 30 min: nudge tickets that have been open 24h+ (never auto-closes).
async function check24hTickets() {
  for (const [, guild] of client.guilds.cache) {
    for (const [, ch] of guild.channels.cache) {
      if (ch.type !== ChannelType.GuildText || !isTicketChannel(ch) || isHumanHandled(ch)) continue;
      if (pinged24h.has(ch.id) || Date.now() - ch.createdTimestamp < 24 * 3600 * 1000) continue;
      pinged24h.add(ch.id);
      await ch.send(fill(C.assistant.check24h, openerId(ch))).catch(() => {});
    }
  }
}

// ── Chat: moderation (word filter) · ticket assistant · FAQ auto-replies ──────
client.on(Events.MessageCreate, async (m) => {
  if (m.author.bot || !m.guild) return;
  const text = (m.content || '').toLowerCase();
  if (!text) return;

  // 1) Moderation everywhere — delete bad words + a short auto-deleting warning.
  if ((C.bannedWords || []).some((w) => hasWord(text, w))) {
    await m.delete().catch(() => {});
    const warn = await m.channel.send(fill(C.moderationWarn, m.author.id)).catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
    return;
  }

  // 2) Inside a ticket → AI-first assistant.
  if (isTicketChannel(m.channel)) return void handleTicketMessage(m);

  // 3) Elsewhere → FAQ auto-replies (short messages, first match wins).
  if (m.content.length <= 80) {
    const f = (C.faq || []).find((e) => e.match.some((k) => hasWord(text, k)));
    if (f) await m.reply(fill(f.reply, m.author.id)).catch(() => {});
  }
});

// Tiny HTTP server so Railway's port/health check is satisfied (a Discord bot has
// no web server on its own → without this Railway can SIGTERM the container in a loop).
require('http').createServer((_req, res) => { res.writeHead(200); res.end('PolarisBot OK'); })
  .listen(process.env.PORT || 3000, () => console.log('Keepalive HTTP server on', process.env.PORT || 3000));

if (!TOKEN) { console.error('DISCORD_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
