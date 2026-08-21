const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { client } = require('../assets/client.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('top')
        .setDescription('get a link of the first message in current channel')
        .setContexts(InteractionContextType.Guild)
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select link Alice returned is ephemeral or not(default is false)')),
    eval: async function (interaction) {
        const embed = new EmbedBuilder();
        if (interaction.channel) {
            const mes = await interaction.channel.messages.fetch({ limit: 1, after: '0' });
            embed.setTitle(`找到啦~`)
                .setDescription(`${mes.first().url}`)
                .setColor("#b3e9ff")
                .setFooter({
                    text: `在${_.get(interaction, 'channel.name', '未知')}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        } else {
            embed.setTitle(`啊...`)
                .setDescription(`我不知道這是哪...`)
                .setColor("#b3e9ff")
                .setFooter({
                    text: `在${_.get(interaction, 'channel.name', '未知')}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        }
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        await interaction.reply({
            embeds: [embed],
            Ephemeral: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }
};