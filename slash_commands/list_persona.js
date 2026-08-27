const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('list_persona')
        .setDescription('list existed personas')
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the list would be ephemeral or not(defualt is false)')),
    eval: async function (interaction) {
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const personas = client.battle.get_list_user_seeable(interaction.user.id);
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        let output = '```';
        personas.forEach((persona) => {
            output += `[${persona.id}|${persona.persona.type}${persona.persona.deprecated ? '|DEPRECATED' : ''}]: ${persona.persona.display_name}\n`;
        });
        await interaction.editReply(output.trimEnd() + '```');
    }
}