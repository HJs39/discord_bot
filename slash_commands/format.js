const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const moment = require('moment');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('format')
        .setDescription('let Alice say currnt time by specific format')
        .addStringOption(option => option.setName('format')
            .setDescription('the time format')
            .setRequired(true))
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the result is ephemeral or not(default is false)')),
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