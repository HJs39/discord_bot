const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("delete_persona")
        .setDescription('turn a persona into deprecated state')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to deprecated')
            .setRequired(true)
            .setAutocomplete(true)),
    eval: async function (interaction) {
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const list = client.battle.get_persona_list_by_author(interaction.user.id);
        /**@type {number} */
        const persona_id = interaction.options.getInteger('persona');
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t} */
        const persona = list.find(p => p.id === persona_id);
        if (persona) {
            client.battle.deprecated_persona(persona_id);
            await interaction.reply({
                content: `${persona.persona.display_name}現在處於棄用狀態啦！`,
                flags: MessageFlags.Ephemeral
            });
            return;
        } else {
            await interaction.reply({
                content: `這個設定不是你創建的！`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_created = client.battle.get_persona_list_by_author(interaction.user.id).filter(p => !p.persona.deprecated);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_created.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_created.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}