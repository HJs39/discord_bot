const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("fight")
        .setDescription("to compare length with someone")
        .addUserOption(option => option.setName('target')
            .setDescription("your target")
            .setRequired(true))
        .addIntegerOption(option => option.setName('maximum_length')
            .setDescription('maximum length')
            .setMinValue(0)
            .setMaxValue(1000)
            .setRequired(false)),
    eval: async function (interaction) {
        var target_1_display = '';
        var target_2_display = '';
        var member;
        if (!interaction.member) {
            target_1_display = interaction.user.displayName;
        } else {
            target_1_display = interaction.member.nickname || interaction.user.displayName;
        }
        if (!interaction.guild) {
            member = interaction.options.getUser('target').username;
            target_2_display = member.username;
        } else {
            member = await interaction.guild.members.fetch(interaction.options.getUser('target').id);
            target_2_display = member.nickname || member.displayName;
        }
        const maximum_length = interaction.options.getInteger('maximum_length') ?? 10;
        let target_1 = Math.floor(Math.random() * maximum_length) - (Math.floor(Math.random() * maximum_length) / 3);
        let target_2 = Math.floor(Math.random() * maximum_length) - (Math.floor(Math.random() * maximum_length) / 3);
        if (target_1 < 0) target_1 = 0;
        if (target_2 < 0) target_2 = 0;
        const embed = new EmbedBuilder()
            .setTitle('結果!')
            .addFields({
                name: `${target_1_display}:`,
                value: `${target_1 == 0 ? `${target_1_display}是女的!` : '='.repeat(target_1) + '>'}`,
                inline: false
            })
            .addFields({
                name: `${target_2_display}:`,
                value: `${target_2 == 0 ? `${target_2_display}是女的!` : '='.repeat(target_2) + '>'}\n`,
                inline: false
            })
            .addFields({
                name: ``,
                value: `**${target_1 > target_2 ? `${interaction.user}贏了` : target_1 == target_2 ? "平手" : `${member}贏了`}~**`,
                inline: false
            })
            .setColor("#b3e9ff")
            .setFooter({
                text: `在${_.get(interaction, 'channel.name', '未知')}`,
                iconURL: client.user.avatarURL(),
            })
            .setTimestamp();;
        await interaction.reply({
            embeds: [embed]
        });
    }
}