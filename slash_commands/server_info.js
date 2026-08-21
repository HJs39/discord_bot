const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { client } = require('../assets/client.js');
const _=require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('server_info')
        .setDescription('get current server information')
        .setContexts(InteractionContextType.Guild)
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the information of server is ephemeral or not(default is false)')),
    eval: async function (interaction) {
        const guild_owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL({ dynamic: true }),
            })
            .setTitle(`由${guild_owner.nickname || guild_owner.user.tag}建立`)
            .setDescription(`- 建立於: ${interaction.guild.createdAt}\n- 當前成員數: ${interaction.guild.memberCount}\n- ID: ${interaction.guild.id}`)
            .setColor("#b3e9ff")
            .setFooter({
                text: `在${_.get(interaction,'channel.name','未知')}`,
                iconURL: client.user.avatarURL(),
            })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            flags: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }
};