const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown.js');
const { client } = require('../assets/client.js');
const activities = require('../assets/activity');
const bot_assets = require('../assets/bot_assets.json');
const { colors } = require('../assets/embed_color.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("event")
        .setDescription("get a random event"),
    eval: async function (interaction) {
        if (!interaction.guild || !bot_assets.event_available.includes(interaction.guild.id)) {
            await interaction.reply({
                content: "你不能在這裡用！",
                flags: MessageFlags.Ephemeral
            });
            return;
        } else if (!cooldown_helper.check('event', interaction.guild.id, Date.now(), cooldown_helper.from_second(600))) {
            const embed = new EmbedBuilder()
                .setTitle("冷卻中...")
                .setDescription("用的太急拉！\n稍微冷靜一下吧~")
                .setColor(colors.error)
                .setFooter({
                    text: `等下再來！`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply();
        if (activities.length === 0) {
            const embed = new EmbedBuilder()
                .addFields({
                    name: "",
                    value: `沒有能用的活動呢...`,
                    inline: false
                })
                .setColor(colors.normal)
                .setFooter({
                    text: `你們真無趣...`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
            cooldown_helper.set('event', interaction.guild.id, Date.now());
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const component = new ContainerBuilder()
            .setAccentColor(colors.normal)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${activity.title}`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(activity.rule)
            );
        cooldown_helper.set('event', interaction.guild.id, Date.now());
        await interaction.editReply({
            components: [component],
            flags: MessageFlags.IsComponentsV2
        });
    }
}