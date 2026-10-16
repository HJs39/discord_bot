const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { client } = require('../assets/client.js');
const activities = require('../assets/activity');
const bot_assets = require('../assets/bot_assets.json');
const { colors } = require('../assets/embed_color.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("assign_event")
        .setDescription("add new event")
        .addStringOption(option => option.setName("title")
            .setDescription("the title of this activity")
            .setRequired(true))
        .addStringOption(option => option.setName("rule")
            .setDescription("detail of this activity")
            .setRequired(true)),
    eval: async function (interaction) {
        if (!interaction.guild || !bot_assets.event_available.includes(interaction.guild.id)) {
            await interaction.reply({
                content: "你不能在這裡用！",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        activities.push({
            title: interaction.options.getString("title"),
            rule: interaction.options.getString("rule")
        });
        await interaction.editReply({
            content: "新的小活動紀錄好啦！",
            flags: MessageFlags.Ephemeral
        });
    }
}