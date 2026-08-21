const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('say')
        .setDescription('let Alice say something you want')
        .addStringOption(option => option.setName('message')
            .setDescription('the content you want Alice to say')
            .setRequired(true))
        .addAttachmentOption(option => option.setName("attachment")
            .setDescription("the attachment you want Alice to send")),
    eval: async function (interaction) {
        if (interaction.options.getAttachment('attachment') !== null) {
            await interaction.reply({
                content: `${interaction.user.globalName || interaction.user.userName}想說:\n${interaction.options.getString('message')}`,
                files: [interaction.options.getAttachment('attachment')]
            });
        } else {
            await interaction.reply({
                content: `${interaction.user.globalName || interaction.user.userName}想說:\n${interaction.options.getString('message')}`
            });
        }
    }
};