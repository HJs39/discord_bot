const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { type_t, persona } = require('../implement/LLM/persona.js');
const { client } = require('../assets/client.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("import_persona")
        .setDescription('create a persona by json')
        .addAttachmentOption(option => option.setName('persona')
            .setDescription('persona file')
            .setRequired(true)),
    eval: async function (interaction) {
        const attachment = interaction.options.getAttachment('persona');
        if ((!attachment.contentType?.startsWith('application/json')) || !attachment.name.endsWith('.json')) {
            await interaction.reply({
                content: '這不是一個可用的persona檔案！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try {
            const persona_source = await fetch(attachment.url);
            /**@type {persona} */
            const persona = await persona_source.json();
            if (!(
                _.has(persona, 'display_name') ||
                _.has(persona, 'internal_name') ||
                _.has(persona, 'identity_name') ||
                _.has(persona, 'type') ||
                _.has(persona, 'author') ||
                _.has(persona, 'deprecated') ||
                _.has(persona, 'format') ||
                _.has(persona, 'reply_format') ||
                _.has(persona, 'user_format') ||
                _.has(persona, 'phony_chat') ||
                _.has(persona, 'summarize_instruction') ||
                _.has(persona, 'used_user') ||
                _.has(persona, 'memory') ||
                _.has(persona, 'memory.short_term_max') ||
                _.has(persona, 'memory.summarize_start_index') ||
                _.has(persona, 'memory.raw_short_term') ||
                _.has(persona, 'memory.summarized')
            )) {
                await interaction.editReply('這不是一個可用的persona檔案！');
                return;
            }
            if (persona.type === type_t.system) persona.type = type_t.private;
            for (const phony_chat of persona.phony_chat) {
                if (!(
                    _.has(phony_chat, 'role') ||
                    _.has(phony_chat, 'content')
                ) ||
                    (_.has(phony_chat, 'name') &&
                        !/^[a-zA-Z0-9_-]+$/.test(phony_chat.name))) {
                    await interaction.editReply({
                        content: '這不是一個可用的persona檔案！',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }
            let placeholder = false;
            for (const summarize_instruction of persona.summarize_instruction) {
                if (!(
                    _.has(summarize_instruction, 'role') ||
                    _.has(summarize_instruction, 'content')
                ) ||
                    (_.has(summarize_instruction, 'name') &&
                        !/^[a-zA-Z0-9_-]+$/.test(summarize_instruction.name))) {
                    await interaction.editReply({
                        content: '這不是一個可用的persona檔案！',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                if (summarize_instruction.role === 'placeholder') placeholder = true;
            }
            if (!placeholder) {
                await interaction.editReply('這不是一個可用的persona檔案！');
                return;
            }
            persona.memory.raw_short_term = [];
            /**@type {import('../implement/LLM/assets.js').snowflake[]} */
            const unused_messages = client.chat.create_persona(
                persona.display_name,
                persona.internal_name,
                persona.identity_name,
                persona.type,
                persona.author,
                persona.persona,
                persona.format,
                persona.reply_format,
                persona.user_format,
                persona.phony_chat,
                persona.summarize_instruction,
                persona.memory
            );
            await interaction.editReply(`上傳成功！\n你現在可以用${persona.display_name}啦！`);
            for (const snowflake of unused_messages) {
                client.chat.remove_context(snowflake);
            }
        } catch (error) {
            await interaction.editReply('上傳失敗！\n-# 或許你應該等下再試試？');
        }
    }
}