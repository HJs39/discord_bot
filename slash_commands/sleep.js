const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('sleep')
        .setDescription('shutdown Alice')
        .setDefaultMemberPermissions(0),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            interaction.reply({
                content: '你不能叫我去睡覺!',
                flags: MessageFlags.Ephemeral
            });
            console.log(`[Info]: someone try to call sleep command!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            return;
        }
        interaction.reply({
            content: '我去睡覺啦~',
            flags: MessageFlags.Ephemeral
        });
        console.log('愛麗絲去睡覺啦~');
        client.destroy();
    }
};