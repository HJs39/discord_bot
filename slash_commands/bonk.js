const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { type_t, persona } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('remove the summarized memory on top')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to remove memory')
            .setRequired(true)
            .setAutocomplete(true)),
    eval: async function (interaction) {
        const persona_id = interaction.options.getInteger('persona');
        /**@type {persona} */
        const persona = client.chat.get_persona(persona_id);
        if (persona.author !== interaction.user.id) {
            await interaction.reply({
                content: '你不能執行這個操作！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        persona.memory.summarized.pop();
        await interaction.reply({
            content: `現在${persona.display_name}已經忘掉之前記下來的事啦！`,
            flags: MessageFlags.Ephemeral
        });
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_created = client.chat.get_persona_list_by_author(interaction.user.id);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_created.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_created.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}