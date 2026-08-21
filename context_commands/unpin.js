const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new ContextMenuCommandBuilder()
        .setName("unpin")
        .setType(ApplicationCommandType.Message)
        .setContexts(InteractionContextType.Guild),
    eval: async function (interaction) {
        if (interaction.targetMessage.channelId) {
            try {
                const channel = await client.channels.fetch(interaction.targetMessage.channelId);
                if (channel.isThread() && interaction.user.id === channel.ownerId) {
                    await channel.messages.unpin(interaction.targetMessage.id, '由創建者使用指令釘選');
                    await interaction.reply({
                        content: "弄好啦！",
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: "你不能在這裡這麼做！",
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            } catch {
                await interaction.reply({
                    content: "我不知道這裡是哪...",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        await interaction.reply({
            content: "我不知道這裡是哪...",
            flags: MessageFlags.Ephemeral
        });
        return;
    }
}