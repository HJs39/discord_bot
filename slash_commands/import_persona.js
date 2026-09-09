const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { type_t, persona, import_persona_t } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');
const z = require('zod');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("import_persona")
        .setDescription('create a persona by json')
        .addAttachmentOption(option => option.setName('persona')
            .setDescription('persona file')
            .setRequired(true)),
    eval: async function (interaction) {
        if (bot_assets.banned_chat.includes(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle("無使用權限")
                .setDescription("你沒有使用這個指令的權限！")
                .setColor(colors.error)
                .setFooter({
                    text: '不能用！',
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }
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
            const import_persona = await persona_source.json();
            const p = import_persona_t.parse(import_persona);
            p.memory.raw_short_term = [];

            /**@type {import('../implement/LLM/assets.js').snowflake[]} */
            const unused_messages = client.chat.create_persona(
                p.display_name,
                p.internal_name,
                p.identity_name,
                p.type,
                p.author,
                p.persona,
                p.profile,
                p.format,
                p.reply_format,
                p.user_format,
                p.phony_chat,
                p.summarize_instruction,
                p.memory
            );
            await interaction.editReply(`上傳成功！\n你現在可以和${p.display_name}聊天啦！`);
            for (const snowflake of unused_messages) {
                client.chat.remove_context(snowflake);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                let error_mes = '';
                error.issues.forEach(iss => {
                    error_mes += iss.message;
                });
                await interaction.editReply({
                    content: `這不是一個可用的persona檔案！\n根據下面的說明調整吧！\n${error_mes}`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            await interaction.editReply('上傳失敗！\n-# 或許你應該等下再試試？');
        }
    }
}