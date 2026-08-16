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
const SERVER_IP        = process.env.SERVER_IP || 'play.polarissmp.net';
const BANNER_URL       = process.env.BANNER_URL || '';
const WEBSITE_URL      = process.env.WEBSITE_URL || '';
const BRAND_COLOR      = 0x3b82f6;

const BTN_STYLE = { PRIMARY: ButtonStyle.Primary, SUCCESS: ButtonStyle.Success, SECONDARY: ButtonStyle.Secondary, DANGER: ButtonStyle.Danger };

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

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

if (!TOKEN) { console.error('DISCORD_TOKEN is not set!'); process.exit(1); }
client.login(TOKEN);
