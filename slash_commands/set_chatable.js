const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('set_chatable')
        .setDescription('add a text channel into chatable list')
        .addChannelOption(option => option.setName('channel')
            .setDescription('the channel to add')
            .setRequired(true)),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: '你不能決定這個！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const channel = interaction.options.getChannel('channel');
        if (!bot_assets.chatable_channel.includes(channel.id)) bot_assets.chatable_channel.push(channel.id);
        await interaction.reply({
            content: `現在可以在${channel.name}聊天啦！`,
            flags: MessageFlags.Ephemeral
        });
    }
}