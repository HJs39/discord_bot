const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { type_t } = require('../implement/LLM/persona.js');
const { client } = require('../assets/client.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("export_persona")
        .setDescription('export a persona as json')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to export')
            .setRequired(true)
            .setAutocomplete(true)),
    eval: async function (interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const list = client.chat.get_list_user_seeable(interaction.user.id).filter(p => p.persona.author === interaction.user.id || p.persona.type === type_t.system);
        /**@type {number} */
        const persona_id = interaction.options.getInteger('persona');
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t} */
        const persona = list.find(p => p.id === persona_id);
        if (persona) {
            const buffer = Buffer.from(
                JSON.stringify(
                    persona.persona,
                    (key, value) => {
                        if (key === 'type' && value === type_t.system) {
                            return type_t.private;
                        }
                        return value;
                    },
                    4
                ),
                'utf-8'
            );
            const attachment = new AttachmentBuilder(buffer, { name: `${persona.persona.display_name}.json` });
            await interaction.editReply({
                files: [attachment]
            });
            return;
        } else {
            await interaction.editReply({
                content: `這個設定不是你創建的！`
            });
            return;
        }
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_created = client.chat.get_list_user_seeable(interaction.user.id).filter(p => p.persona.author === interaction.user.id || p.persona.type === type_t.system);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_created.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_created.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}