const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, MessageFlags } = require('discord.js');
const context = require('../implement/LLM/context.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new ContextMenuCommandBuilder()
        .setName('check')
        .setType(ApplicationCommandType.Message),
    eval: async function (interaction) {
        if (interaction.targetMessage.author.id !== client.user.id) {
            await interaction.reply({
                content: "這個人我不認識呢...",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_seeable = client.battle.get_list_user_seeable(interaction.user.id);
        /**@type {context} */
        const context = client.battle.get_message_context(interaction.targetMessage.id);
        const persona = user_seeable.find((persona) => persona.id === context.persona_id);
        if (persona) {
            await interaction.reply({
                content: `這是${persona.persona.internal_name}發的！\n-# 更準確來說是${persona.persona.display_name}喔～`,
                flags: MessageFlags.Ephemeral
            });
            return;
        } else {
            await interaction.reply({
                content: "這個好像不是大家發的呢...",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    }
}