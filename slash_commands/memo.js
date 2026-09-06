const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const message_spliter = require('../implement/massage_spliter.js');
const response_receiver = require('../implement/LLM/response_reciver.js');
const { persona } = require('../implement/LLM/persona.js');
const { memory_error } = require('../implement/LLM/LLM_interface.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("memo")
        .setDescription('summarize memory')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to summarize')
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
            await interaction.reply({
                content: `你不能做這件事！`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {context[]} */
        const cache = client.chat.fetch_contexts(persona.memory.raw_short_term).filter(c => !c.summarized);
        try {
            /**@type {response_receiver} */
            const receiver = client.chat.summarize(persona_id);
            const result = await receiver.get_result();
            if (result.failed) {
                await interaction.editReply({
                    content: `summarize faild:\n${result.content}`
                });
                for (const c of cache) {
                    c.summarized = false;
                }
            } else if (result.content.length === 0) {
                await interaction.editReply({
                    content: `summarize faild:\nAPI returns an empty response`
                });
                for (const c of cache) {
                    c.summarized = false;
                }
            } else {
                persona.memory.summarized.push(result.content);
                await interaction.followUp({
                    content: 'memory preview:',
                    flags: MessageFlags.Ephemeral
                });
                for (const split_mes of message_spliter.split(result.content)) {
                    await interaction.followUp({
                        content: split_mes,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } catch (error) {
            for (const c of cache) {
                c.summarized = false;
            }
            if (error instanceof memory_error) {
                await interaction.editReply({
                    content: `summarize faild:\n${error.message}`
                });
            } else {
                await interaction.editReply({
                    content: `summarize faild`
                });
                throw error;
            }
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