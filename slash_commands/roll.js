const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');


module.exports = {
    command: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("roll dice")
        .addIntegerOption(option => option.setName('count')
            .setDescription('number of dice you want to roll')
            .setMinValue(1)
            .setMaxValue(100))
        .addIntegerOption(option => option.setName('face')
            .setDescription('face of dice you want to roll')
            .setMinValue(4))
        .addIntegerOption(option => option.setName('add_on')
            .setDescription('the value be added on the result'))
        .addBooleanOption(option => option.setName('process')
            .setDescription('set true to get the roll process(default is false)')),
    eval: async function (interaction) {
        await interaction.deferReply();
        const count = interaction.options.getInteger('count') ?? 1;
        const face = interaction.options.getInteger('face') ?? 4;
        const add_on = interaction.options.getInteger('add_on') ?? 0;
        const get_process = interaction.options.getBoolean('process') ?? false;
        var total = 0;
        var process = '';
        for (var i = 1; i <= count; ++i) {
            var cur = Math.floor(Math.random() * face) + 1;
            total += cur;
            process += `${i}:${cur}\n`;
        }
        if (add_on === 0) {
            process = process.trimEnd();
        } else {
            process += `${total}+${add_on}`;
        }
        const embed = new EmbedBuilder();
        if (get_process) {
            embed.setTitle(`${count}d${face}${add_on == 0 ? '' : add_on < 0 ? add_on : `+${add_on}`}:`)
                .setDescription(`總和:${total + add_on}${add_on == 0 ? '' : `\n加值前:${total}`}`)
                .addFields(
                    {
                        name: "紀錄:",
                        value: process,
                        inline: false
                    },
                )
                .setColor(0xb3e9ff).setColor("#b3e9ff")
                .setFooter({
                    text: "Alice",
                    iconURL: client.user.displayAvatarURL({ size: 32 }),
                })
                .setTimestamp();
        } else {
            embed.setTitle(`${count}d${face}${add_on == 0 ? '' : add_on < 0 ? add_on : `+${add_on}`}:`)
                .setDescription(`總和:${total + add_on}${add_on == 0 ? '' : `\n加值前:${total}`}`)
                .setColor(0xb3e9ff).setColor("#b3e9ff")
                .setFooter({
                    text: "Alice",
                    iconURL: client.user.displayAvatarURL({ size: 32 }),
                })
                .setTimestamp();
        }
        await interaction.followUp({
            embeds: [embed]
        });
    }
};