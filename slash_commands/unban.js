const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const bot_assets = require('../assets/bot_assets.json');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("unban a user")
        .addUserOption(option => option.setName('target')
            .setDescription("your target")
            .setRequired(true))
        .addStringOption(option => option.setName('range')
            .setDescription("the range of this action")
            .setChoices(
                { name: 'global', value: 'global' },
                { name: 'chat', value: 'chat' }
            )
            .setRequired(true)),
    eval: async function (interaction) {
        const user_to_unban = interaction.options.getUser('target');
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: '你不能這麼做!',
                flags: MessageFlags.Ephemeral
            });
            console.log(`[Info]: someone try to unban a member!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            return;
        }
        const range = interaction.options.getString('range');
        if (range === 'global' && bot_assets.banned_global.includes(user_to_unban.id)) _.remove(bot_assets.banned_global, id => id === user_to_ban.id);
        else if (range === 'chat' && bot_assets.banned_chat.includes(user_to_unban.id)) _.remove(bot_assets.banned_chat, id => id === user_to_ban.id);
        await interaction.reply({
            content: '現在他已經被從小本本上擦掉啦!',
            flags: MessageFlags.Ephemeral
        });
    }
}