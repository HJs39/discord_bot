const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { type_t, persona, import_persona_t } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require("../assets/embed_color.js");
const z = require('zod');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("update_persona")
        .setDescription('update a persona by json')
        .addAttachmentOption(option => option.setName('source')
            .setDescription('persona file')
            .setRequired(true))
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to update')
            .setAutocomplete(true)
            .setRequired(true)
            .setAutocomplete(true)),
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
        const attachment = interaction.options.getAttachment('source');
        if ((!attachment.contentType?.startsWith('application/json')) || !attachment.name.endsWith('.json')) {
            await interaction.reply({
                content: '這不是一個可用的persona檔案！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const persona_id = interaction.options.getInteger('persona');
        /**@type {persona} */
        const original = client.chat.get_persona(persona_id);
        if (original.type === type_t.system || original.author !== interaction.user.id) {
            await interaction.reply({
                content: '你不能修改這個！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try {
            const persona_source = await fetch(attachment.url);
            /**@type {persona} */
            const persona = await persona_source.json();
            const p = import_persona_t.parse(import_persona);
            client.chat.edit_persona(persona_id, p);
            await interaction.editReply(`上傳成功！\n設定已經更新啦！`);
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
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_create = client.chat.get_persona_list_by_author(interaction.user.id);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_create.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_create.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}