const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');


module.exports = {
    command: new SlashCommandBuilder()
        .setName("select")
        .setDescription("let Alice select some elements from the list you give")
        .addStringOption(option => option.setName('elements')
            .setDescription('the element list seperated by "separator" option')
            .setRequired(true))
        .addIntegerOption(option => option.setName('count')
            .setDescription('number of element you want to Alice to select')
            .setMinValue(1))
        .addStringOption(option => option.setName('separator')
            .setDescription('the character or string to separate element list(default is ",")'))
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the result would be ephemeral or not(defualt is false)')),
    eval: async function (interaction) {
        await interaction.deferReply();
        const element_list = interaction.options.getString('elements');
        const count = interaction.options.getInteger('count') ?? 1;
        const separator = interaction.options.getString('separator') ?? ',';
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        var result = '';
        const elements = element_list.split(separator);

        for (var i = 0; i < count; ++i) {
            result += `${elements[Math.floor(Math.random() * elements.length)]}\n`;
        }
        result = result.trimEnd();
        const embed = new EmbedBuilder()
            .setTitle(`我要${count == 1 ? "這個" : "這些"}!`)
            .setDescription(result)
            .setColor(0xb3e9ff).setColor("#b3e9ff")
            .setFooter({
                text: "Alice",
                iconURL: client.user.displayAvatarURL({ size: 32 }),
            })
            .setTimestamp();
        await interaction.editReply({
            embeds: [embed],
            flags: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }
};