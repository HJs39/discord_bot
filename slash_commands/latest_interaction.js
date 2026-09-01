const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const context = require('../implement/LLM/context.js');
const { type_t, persona } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('latest_interaction')
        .setDescription('check the nearest interaction of persona')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to check')
            .setRequired(true)
            .setAutocomplete(true)),
    eval: async function (interaction) {
        /**@type {persona[]} */
        const user_seeable = client.chat.get_list_user_seeable(interaction.user.id).map(fp => { return fp.persona; });
        const persona_id = interaction.options.getInteger('persona');
        /**@type {persona} */
        const persona = client.chat.get_persona(persona_id);
        if (!user_seeable.includes(persona)) {
            await interaction.reply({
                content: '你不能執行這個操作！',
                flags: MessageFlags.Ephemeral
            });
            return;
        } else if (persona.memory.raw_short_term.length === 0) {
            await interaction.reply({
                content: `${persona.display_name}還沒有跟人對話過呢...`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        await interaction.editReply({
            content: `對${persona.display_name}來說最新發生的事是這個！`,
            flags: MessageFlags.Ephemeral
        });
        /**@type {context[]} */
        const contexts = new Array();
        for (let i = -1; ; --i) {
            contexts.unshift(client.chat.get_message_context(persona.memory.raw_short_term.at(i)));
            if (contexts[0].user_input.length !== 0) break;
        }
        for (const c of contexts) {
            await interaction.followUp({
                content: c.assistant_message,
                flags: MessageFlags.Ephemeral
            });
        }
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_seeable = client.chat.get_list_user_seeable(interaction.user.id);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_seeable.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_seeable.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}