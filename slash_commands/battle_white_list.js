const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('node:fs');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color.js');
const bot_assets = require('../assets/bot_assets.json');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('battle_white_list')
        .setDescription('add user to white list')
        .addUserOption(option => option.setName('user')
            .setDescription('user to add')
            .setRequired(true)),
    eval: async function (interaction) {
        const user_id = interaction.options.getUser('user').id;
        if (!bot_assets.battle_command_available.includes(user_id)) bot_assets.battle_command_available.push(user_id);
        await interaction.reply({
            content: '紀錄完畢！',
            flags: MessageFlags.Ephemeral
        });
    },
    battle_command_available: bot_assets.battle_command_available
};

process.on('exit', () => {
    fs.writeFileSync('./assets/bot_assets.json', JSON.stringify(bot_assets, undefined, 4), 'utf-8');
});