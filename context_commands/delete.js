const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new ContextMenuCommandBuilder()
        .setName('delete')
        .setType(ApplicationCommandType.Message),
    eval: async function (interaction) {
        if (interaction.targetMessage.author.id !== client.user.id) {
            await interaction.reply({
                content: "這不是我發的！",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.targetMessage.delete();
        await interaction.reply({
            content: "刪掉啦！",
            flags: MessageFlags.Ephemeral
        });
    }
}
