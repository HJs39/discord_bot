const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const bot_assets = require('../assets/bot_assets.json');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("set_quote_available")
        .setDescription("add new available channel id into quote available channel list")
        .setDescriptionLocalization('zh-TW', '新增一個可使用/quote指令的頻道')
        .addStringOption(option => option.setName("channel")
            .setDescription("the channel id(default is current channel)")
            .setDescriptionLocalization('zh-TW', '頻道id(默認嘗試擷取當前頻道id)')),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: '你不能這麼做!',
                flags: MessageFlags.Ephemeral
            });
            console.log(`[Info]: someone try to set a new channel for /quote!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {string} */
        const channel = interaction.options.getString('channel') ?? interaction.channel.id;
        if (!channel) {
            await interaction.editReply({
                content: "無法獲取可用的頻道id！",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const target = channel.trim();
        if (!bot_assets.quote_command_available.includes(target)) bot_assets.quote_command_available.push(target);
        await interaction.editReply({
            content: `建立好啦！\n現在<#${target}>也可以使用\`/quote\`啦！`,
            flags: MessageFlags.Ephemeral
        });
    }

}