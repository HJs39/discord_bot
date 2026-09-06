const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('unset_chatable')
        .setDescription('disable a chatable channel')
        .addChannelOption(option => option.setName('channel')
            .setDescription('the target channel')
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
        if (bot_assets.chatable_channel.includes(channel.id)) _.remove(bot_assets.chatable_channel, id => id === channel.id);
        await interaction.reply({
            content: `現在${channel.name}已經不允許聊天了！`,
            flags: MessageFlags.Ephemeral
        });
    }
}