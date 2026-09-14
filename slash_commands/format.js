const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const moment = require('moment');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('format')
        .setDescription('let Alice say currnt time by specific format')
        .setDescriptionLocalization('zh-TW', '讓愛麗絲將當前的時間格式化為指定格式')
        .addStringOption(option => option.setName('format')
            .setDescription('the time format')
            .setDescriptionLocalization('zh-TW', '時間格式')
            .setRequired(true))
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the result is ephemeral or not(default is false)')
            .setDescriptionLocalization('zh-TW', '結果是否僅個人可見(默認公開)')),
    eval: async function (interaction) {
        const format = interaction.options.getString('format');
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });
        await interaction.editReply({
            content: `\`${format}\`會變成下面這樣！\n${moment(new Date()).format(format)}`,
            ephemeral: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }
};