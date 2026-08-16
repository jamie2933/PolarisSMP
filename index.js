require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials, Events,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits, SlashCommandBuilder, REST, Routes,
} = require('discord.js');
const TICKETS = require('./tickets');

// ── Config (all from Railway env vars) ───────────────────────────────────────
const TOKEN            = process.env.DISCORD_TOKEN || '';
const GUILD_ID         = process.env.GUILD_ID || '';
const STAFF_ROLE_ID    = process.env.STAFF_ROLE_ID || '';
const DEFAULT_CATEGORY = process.env.DEFAULT_TICKET_CATEGORY_ID || '';
const WELCOME_CHANNEL  = process.env.WELCOME_CHANNEL_ID || '';
const WELCOME_MESSAGE  = process.env.WELCOME_MESSAGE || 'Welcome to **PolarisSMP**, {user}! 🎉 Check the rules and have fun!';
const BRAND_COLOR      = 0x3b82f6;

const BTN_STYLE = { PRIMARY: ButtonStyle.Primary, SUCCESS: ButtonStyle.Success, SECONDARY: ButtonStyle.Secondary, DANGER: ButtonStyle.Danger };

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

// ── The ticket panel (posted with /panel) ────────────────────────────────────
function panelMessage() {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('🎫 PolarisSMP Support')
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
    new ButtonBuilder().setCustomId('open:' + key).setLabel(t.label)
      .setEmoji(t.emoji).setStyle(BTN_STYLE[t.style] || ButtonStyle.Secondary));

  // up to 5 buttons per row
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  return { embeds: [embed], components: rows };
}

// ── Ready: register /panel (guild command = instant) ─────────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  try {
    const cmd = new SlashCommandBuilder().setName('panel').setDescription('Post the ticket panel in this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).toJSON();
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(c.user.id, GUILD_ID), { body: [cmd] });
    else await rest.put(Routes.applicationCommands(c.user.id), { body: [cmd] });
    console.log('Slash command /panel registered.');
  } catch (e) { console.error('command registration failed:', e.message); }
});

// ── Welcome message ──────────────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  if (!WELCOME_CHANNEL) return;
  try {
    const ch = await member.guild.channels.fetch(WELCOME_CHANNEL).catch(() => null);
    if (!ch) return;
    await ch.send({ content: WELCOME_MESSAGE.replace('{user}', `<@${member.id}>`).replace('{name}', member.user.username) });
  } catch (e) { console.error('welcome failed:', e.message); }
});

// ── Interactions ─────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isChatInputCommand() && i.commandName === 'panel') {
      await i.channel.send(panelMessage());
      return i.reply({ content: '✅ Panel posted.', ephemeral: true });
    }

    // panel button → open the question modal
    if (i.isButton() && i.customId.startsWith('open:')) {
      const type = i.customId.slice(5);
      const t = TICKETS[type];
      if (!t) return i.reply({ content: 'Unknown ticket type.', ephemeral: true });
      const modal = new ModalBuilder().setCustomId('modal:' + type).setTitle(t.label.slice(0, 45));
      t.questions.forEach((q) => {
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId(q.id).setLabel(q.label.slice(0, 45))
            .setStyle(q.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(!!q.required).setMaxLength(1000)));
      });
      return i.showModal(modal);
    }

    // modal submitted → create the ticket channel
    if (i.isModalSubmit() && i.customId.startsWith('modal:')) {
      const type = i.customId.slice(6);
      const t = TICKETS[type];
      if (!t) return i.reply({ content: 'Unknown ticket type.', ephemeral: true });
      await i.deferReply({ ephemeral: true });
      const answers = t.questions.map((q) => ({ q, value: i.fields.getTextInputValue(q.id) || '—' }));

      const categoryId = process.env[t.categoryEnv] || DEFAULT_CATEGORY || null;
      const overwrites = [
        { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ];
      if (STAFF_ROLE_ID) overwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ManageMessages] });

      const channel = await i.guild.channels.create({
        name: `${type}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || `${type}-ticket`,
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: `ticket|opener:${i.user.id}|type:${type}`,
        permissionOverwrites: overwrites,
      });

      const embed = new EmbedBuilder().setColor(t.color || BRAND_COLOR).setTitle(t.embedTitle)
        .setDescription(`From: <@${i.user.id}>`)
        .addFields(answers.map((a) => ({ name: a.q.label, value: a.value.slice(0, 1024) })))
        .setTimestamp();

      const controls = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('closereason').setLabel('Close with reason').setEmoji('📝').setStyle(ButtonStyle.Danger));

      await channel.send({ content: `${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}> ` : ''}<@${i.user.id}>`, embeds: [embed], components: [controls] });
      return i.editReply({ content: `✅ Your ticket has been created: ${channel}` });
    }

    // Close with reason → ask for a reason
    if (i.isButton() && i.customId === 'closereason') {
      const modal = new ModalBuilder().setCustomId('closemodal').setTitle('Close ticket')
        .addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('reason').setLabel('Reason for closing').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)));
      return i.showModal(modal);
    }
    if (i.isButton() && i.customId === 'close') return closeTicket(i, 'No reason provided');
    if (i.isModalSubmit() && i.customId === 'closemodal') return closeTicket(i, i.fields.getTextInputValue('reason'));

    // Reopen / Delete (staff only)
    if (i.isButton() && i.customId === 'reopen') return reopenTicket(i);
    if (i.isButton() && i.customId === 'delete') {
      if (!isStaff(i.member)) return i.reply({ content: '❌ Only staff can delete tickets.', ephemeral: true });
      await i.reply({ content: '🗑 Deleting ticket in 3s…' });
      setTimeout(() => i.channel.delete().catch(() => {}), 3000);
      return;
    }
  } catch (e) {
    console.error('interaction error:', e);
    if (i.isRepliable() && !i.replied && !i.deferred) i.reply({ content: 'Something went wrong.', ephemeral: true }).catch(() => {});
  }
});

function isStaff(member) {
  return member && (member.permissions.has(PermissionFlagsBits.ManageChannels) || (STAFF_ROLE_ID && member.roles.cache.has(STAFF_ROLE_ID)));
}
function openerId(channel) {
  const m = (channel.topic || '').match(/opener:(\d+)/);
  return m ? m[1] : null;
}

async function closeTicket(i, reason) {
  const oid = openerId(i.channel);
  // opener OR staff may close
  if (!isStaff(i.member) && i.user.id !== oid) return i.reply({ content: '❌ You can\'t close this ticket.', ephemeral: true });

  // remove the opener's access so they can no longer see it
  if (oid) await i.channel.permissionOverwrites.edit(oid, { ViewChannel: false }).catch(() => {});

  const embed = new EmbedBuilder().setColor(0xef4444)
    .setDescription(`🔒 Ticket closed by <@${i.user.id}>\n**Reason:** ${reason}`);
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('reopen').setLabel('Open').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('delete').setLabel('Delete').setEmoji('⛔').setStyle(ButtonStyle.Danger));

  if (i.isModalSubmit()) await i.reply({ embeds: [embed], components: [controls] });
  else await i.update({ components: [] }).then(() => i.channel.send({ embeds: [embed], components: [controls] })).catch(async () => { await i.channel.send({ embeds: [embed], components: [controls] }); });

  // DM the opener
  if (oid) {
    try {
      const user = await client.users.fetch(oid);
      const dm = new EmbedBuilder().setColor(0xef4444).setTitle('Your ticket has been closed')
        .setDescription(`Your ticket in **${i.guild.name}** was closed.`)
        .addFields(
          { name: 'Closed by', value: `<@${i.user.id}>`, inline: true },
          { name: 'Reason', value: reason || 'No reason provided', inline: true });
      await user.send({ embeds: [dm] });
    } catch { /* DMs closed — ignore */ }
  }
}

async function reopenTicket(i) {
  if (!isStaff(i.member)) return i.reply({ content: '❌ Only staff can reopen tickets.', ephemeral: true });
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
