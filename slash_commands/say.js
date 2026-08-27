const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('say')
        .setDescription('let Alice say something you want')
        .addStringOption(option => option.setName('message')
            .setDescription('the content you want Alice to say'))
        .addAttachmentOption(option => option.setName("attachment")
            .setDescription("the attachment you want Alice to send")),
    eval: async function (interaction) {
        const display_name = interaction.member?.displayName ?? interaction.user.displayName;
        if (interaction.options.getString('message') !== null) {
            if (interaction.options.getAttachment('attachment') !== null) {
                await interaction.reply({
                    content: `${display_name}想說:\n${interaction.options.getString('message')}`,
                    files: [interaction.options.getAttachment('attachment')]
                });
            } else {
                await interaction.reply({
                    content: `${display_name}想說:\n${interaction.options.getString('message')}`
                });
            }
        } else {
            if (interaction.options.getAttachment('attachment') !== null) {
                await interaction.reply({
                    files: [interaction.options.getAttachment('attachment')]
                });
            } else {
                await interaction.reply({
                    content: `沒有想說的話就不要用啦~`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};