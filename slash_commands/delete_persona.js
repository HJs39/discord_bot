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
        /**@type {number} */
        const persona_id = interaction.options.getInteger('persona');
        /**@type {persona} */
        const persona = client.chat.get_persona(persona_id);
        if (!persona) {
            await interaction.reply({
                content: `這個設定不存在！`,
                flags: MessageFlags.Ephemeral
            });
            return;
        } else if (persona.author !== interaction.user.id) {
            client.chat.deprecated_persona(persona_id);
            await interaction.reply({
                content: `${persona.display_name}現在處於棄用狀態啦！`,
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
        const user_created = client.chat.get_persona_list_by_author(interaction.user.id).filter(p => !p.persona.deprecated);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_created.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_created.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}