const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const { quotes } = require('./quote.js');
const { assets_path } = require('../assets/assets_path.js');
const bot_assets = require('../assets/bot_assets.json');
const fs = require("node:fs");
const path = require('node:path');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("add_quote_folder")
        .setDescription("add a new quote folder for Alice to save quote")
        .addStringOption(option => option.setName("guild")
            .setDescription("the guild folder belong to")),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: '你不能這麼做!',
                flags: MessageFlags.Ephemeral
            });
            console.log(`[Info]: someone try to add a quote folder!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {string} */
        const guild = interaction.options.getString('guild') ?? interaction.guild.id;
        if (!guild) {
            await interaction.editReply({
                content: "我不知道要幫誰建立資料夾...",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const target = guild.trim();
        const target_folder = path.join(assets_path, 'quotes', target);
        if (!fs.existsSync(target_folder)) fs.mkdirSync(target_folder);
        if (!_.has(quotes, target)) _.assign(quotes, { [target]: [] });
        if (!bot_assets.quote_command_available.includes(target)) bot_assets.quote_command_available.push(target);
        await interaction.editReply({
            content: "建立好啦！\n現在他們也有自己的名言語錄了！",
            flags: MessageFlags.Ephemeral
        });
    }

}