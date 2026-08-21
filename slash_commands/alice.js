const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const { test_server_guildId } = require('../assets/bot_assets.json');


module.exports = {
    command: new SlashCommandBuilder()
        .setName("alice")
        .setDescription("get current bot information"),
    eval: async function (interaction) {
        const test_server = client.guilds.cache.get(test_server_guildId);
        const commands = await client.application.commands.fetch();
        const test_server_commands = await test_server.commands.fetch();
        const embed = new EmbedBuilder()
            .setTitle("機器人狀態")
            .setDescription(`名稱: Alice\n測試: ${test_server.name}`)
            .addFields(
                {
                    name: "指令數",
                    value: `記錄: ${client.commands.size}\n全域: ${commands.size}\n測試伺服器: ${test_server_commands.size}`,
                    inline: false
                },
            )
            .setColor(0xb3e9ff).setColor("#b3e9ff")
            .setFooter({
                text: "Alice",
                iconURL: client.user.displayAvatarURL({size:64}),
            })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};