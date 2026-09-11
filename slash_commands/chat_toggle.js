const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const bot_assets = require('../assets/bot_assets.json');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("chat_toggle")
        .setDescription("switch global chattable status"),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: '你不能這麼做!',
                flags: MessageFlags.Ephemeral
            });
            console.log(`[Info]: someone try to switch chattable status!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            return;
        }
        bot_assets.chat_closed = !bot_assets.chat_closed;
        await interaction.reply({
            content: `現在${bot_assets.chat_closed ? "不能" : "可以"}聊天啦!`,
            flags: MessageFlags.Ephemeral
        });
    }
};