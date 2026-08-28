const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown');
const { persona, type_t } = require('../implement/LLM/persona.js');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("edit_persona")
        .setDescription("edit the persona you created")
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to edit')
            .setAutocomplete(true)
            .setRequired(true)),
    eval: async function (interaction) {
        const persona_id = interaction.options.getInteger('persona');
        /**@type {persona} */
        const persona = client.battle.get_persona(persona_id);
        if (persona.type === type_t.system || persona.author !== interaction.user.id) {
            await interaction.reply({
                content: '你不能修改這個！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const internal_user = client.battle.get_user(interaction.user.id);
        let embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.member?.displayName ?? interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle('基本資訊')
            .setDescription(`名稱: ${persona.internal_name}\n顯示名稱: ${persona.display_name}\n當前狀態: ${persona.type}\n是否棄用: ${persona.deprecated ? '是' : '否'}`)
            .setFooter({
                text: '概覽',
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();
        let select_list = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_edit')
                    .addOptions([
                        { label: '概覽', value: 'opening', description: '基礎資訊' },
                        { label: '設定', value: 'persona', description: 'persona的設定' },
                        { label: '格式', value: 'format', description: 'persona如何處理訊息' },
                        { label: '偽造對話', value: 'phony_chat', description: '用於穩定設定的初始假對話歷史' },
                        { label: '總結', value: 'summarize', description: '總結時使用的提示詞' },
                        { label: '記憶處理', value: 'memory', description: '處理persona記憶相關的設定' }
                    ])
            );
        let switch_page = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('to_first')
                    .setLabel('<<')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('to_previous')
                    .setLabel('<')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('display_number')
                    .setLabel('-/-')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('to_next')
                    .setLabel('>')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('to_last')
                    .setLabel('>>')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );
        /**@type {ActionRowBuilder} */
        let edit_button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('edit opening')
                    .setLabel('編輯')
                    .setStyle(ButtonStyle.Primary)
            );
        /**@type {number} */
        let page = 1;
        /**@type {number} */
        let index = 0;
        const response = await interaction.reply({
            embeds: [embed],
            components: [select_list, switch_page, edit_button],
            withResponse: true
        });
        const mes = response.resource?.message;
        if (mes) {
            const collector = mes.createMessageComponentCollector({
                idle: cooldown_helper.from_second(600)
            });
            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({
                        content: '你不能使用這個！',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                /**@type {string[]} */
                const commands = i.customId.split(' ');
                if (commands[0] === 'select_edit') {
                    await i.deferUpdate();
                    page = 1;
                    index = 0;
                    if (i.values[0] === 'opening') {
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('基本資訊')
                            .setDescription(`名稱: ${persona.internal_name}\n顯示名稱: ${persona.display_name}\n當前狀態: ${persona.type}\n是否棄用: ${persona.deprecated ? '是' : '否'}`)
                            .setFooter({
                                text: '概覽',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number')
                                    .setLabel('-/-')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        edit_button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('edit opening')
                                    .setLabel('編輯')
                                    .setStyle(ButtonStyle.Primary)
                            );
                    } else if (i.values[0] === 'persona') {
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('設定:')
                            .setDescription(`\`\`\`${persona.persona.slice(0, 1000)}${persona.persona.length > 1000 ? '...' : ''}\`\`\``)
                            .setFooter({
                                text: '設定',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number')
                                    .setLabel('-/-')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        edit_button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('edit persona')
                                    .setLabel('編輯')
                                    .setStyle(ButtonStyle.Primary)
                            );
                    } else if (i.values[0] === 'format') {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number')
                                    .setLabel('-/-')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`普通訊息:\n\`\`\`${persona.format || ' '}\`\`\`\n回覆:\n\`\`\`${persona.reply_format || ' '}\`\`\`\n使用者:\n\`\`\`${persona.user_format || ' '}\`\`\``)
                            .setFooter({
                                text: '格式',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        edit_button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('edit format')
                                    .setLabel('編輯')
                                    .setStyle(ButtonStyle.Primary)
                            );
                    } else if (i.values[0] === 'phony_chat') {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first phony_chat')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous phony_chat')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number phony_chat')
                                    .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next phony_chat')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last phony_chat')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                            .setFooter({
                                text: '偽造對話',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        edit_button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('create phony_chat')
                                    .setLabel('新增')
                                    .setStyle(ButtonStyle.Success)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('edit phony_chat')
                                    .setLabel('編輯')
                                    .setStyle(ButtonStyle.Primary)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('delete phony_chat')
                                    .setLabel('刪除')
                                    .setStyle(ButtonStyle.Danger)
                            );
                    } else if (i.values[0] === 'summarize') {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first summarize')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous summarize')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number summarize')
                                    .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next summarize')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last summarize')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                    `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                            .setFooter({
                                text: '總結',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        if (persona.summarize_instruction[index].role === 'placeholder') {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                );
                        } else {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                );
                        }
                    } else {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number')
                                    .setLabel('-/-')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`發送${persona.memory.short_term_max}倫對話\n總結${persona.memory.summarize_start_index}前的所有對話\n${persona.internal_name}最新的記憶:\n${persona.memory.summarized.length > 0 ? `\`\`\`${persona.memory.summarized.at(-1)}\`\`\`` : '尚未總結'}`)
                            .setFooter({
                                text: '記憶處理',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        edit_button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('edit memory')
                                    .setLabel('編輯')
                                    .setStyle(ButtonStyle.Primary)
                            );
                    }
                } else if (commands[0] === 'to_first') {
                    await i.deferUpdate();
                    page = 1;
                    index = 0;
                    if (commands[1] === 'phony_chat') {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first phony_chat')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous phony_chat')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number phony_chat')
                                    .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next phony_chat')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last phony_chat')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                            .setFooter({
                                text: '偽造對話',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    } else {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first summarize')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous summarize')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number summarize')
                                    .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next summarize')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last summarize')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            );
                        if (persona.summarize_instruction[index].role === 'placeholder') {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                );
                        } else {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                );
                        }
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                    `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                            .setFooter({
                                text: '總結',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    }
                } else if (commands[0] === 'to_previous') {
                    await i.deferUpdate();
                    page -= 1;
                    if (commands[1] === 'phony_chat') {
                        if (page == 1) {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first phony_chat')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous phony_chat')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number phony_chat')
                                        .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next phony_chat')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last phony_chat')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        } else {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first phony_chat')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous phony_chat')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number phony_chat')
                                        .setLabel(`${page}/${persona.phony_chat.length / 2}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next phony_chat')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last phony_chat')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        }
                        index -= 2;
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                            .setFooter({
                                text: '偽造對話',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    } else {
                        if (page == 1) {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first summarize')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous summarize')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number summarize')
                                        .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next summarize')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last summarize')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        } else {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first summarize')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous summarize')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number summarize')
                                        .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next summarize')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last summarize')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        }
                        index -= 1;
                        if (persona.summarize_instruction[index].role === 'placeholder') {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                );
                        } else {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                );
                        }
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                    `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                            .setFooter({
                                text: '總結',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    }
                } else if (commands[0] === 'display_number') {
                    if (commands[1] === 'phony_chat') {
                        const modal = new ModalBuilder().setCustomId('ignore junp_page').setTitle('跳轉');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel('頁面')
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId('jump')
                                        .setPlaceholder(`頁末: ${Math.round(persona.phony_chat.length / 2)}`)
                                        .setRequired(true)
                                        .setStyle(TextInputStyle.Short)
                                )
                        );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore junp_page' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            const p = Math.floor(Number(submit.fields.getTextInputValue('jump')));
                            if (p <= 1) {
                                page = 1;
                                index = 0;
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (p >= (persona.phony_chat.length / 2)) {
                                page = persona.phony_chat.length / 2;
                                index = 2 * (page - 1);
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                page = p;
                                index = 2 * (page - 1);
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            }
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                                .setFooter({
                                    text: '偽造對話',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                        } catch {
                            //do nothing
                        }
                    } else {
                        const modal = new ModalBuilder().setCustomId('ignore junp_page').setTitle('跳轉');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel('頁面')
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId('jump')
                                        .setPlaceholder(`頁末: ${persona.summarize_instruction.length}`)
                                        .setRequired(true)
                                        .setStyle(TextInputStyle.Short)
                                )
                        );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore junp_page' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            const p = Math.floor(Number(submit.fields.getTextInputValue('jump')));
                            if (p <= 1) {
                                page = 1;
                                index = 0;
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (p >= (persona.summarize_instruction.length)) {
                                page = persona.phony_chat.length / 2;
                                index = page - 1;
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                page = p;
                                index = page - 1;
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            }
                            if (persona.summarize_instruction[index].role === 'placeholder') {
                                edit_button = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('create summarize')
                                            .setLabel('新增')
                                            .setStyle(ButtonStyle.Success)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('edit summarize')
                                            .setLabel('編輯')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('delete summarize')
                                            .setLabel('刪除')
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true)
                                    );
                            } else {
                                edit_button = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('create summarize')
                                            .setLabel('新增')
                                            .setStyle(ButtonStyle.Success)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('edit summarize')
                                            .setLabel('編輯')
                                            .setStyle(ButtonStyle.Primary)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('delete summarize')
                                            .setLabel('刪除')
                                            .setStyle(ButtonStyle.Danger)
                                    );
                            }
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                    persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                        `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                                .setFooter({
                                    text: '偽造對話',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                        } catch {
                            //do nothing
                        }
                    }
                    return;
                } else if (commands[0] === 'to_next') {
                    await i.deferUpdate();
                    page += 1;
                    if (commands[1] === 'phony_chat') {
                        if (page == Math.round(persona.phony_chat.length / 2)) {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first phony_chat')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous phony_chat')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number phony_chat')
                                        .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next phony_chat')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last phony_chat')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );
                        } else {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first phony_chat')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous phony_chat')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number phony_chat')
                                        .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next phony_chat')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last phony_chat')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        }
                        index += 2;
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                            .setFooter({
                                text: '偽造對話',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    } else {
                        if (page == persona.summarize_instruction.length) {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first summarize')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous summarize')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number summarize')
                                        .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next summarize')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last summarize')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );
                        } else {
                            switch_page = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_first summarize')
                                        .setLabel('<<')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_previous summarize')
                                        .setLabel('<')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('display_number summarize')
                                        .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_next summarize')
                                        .setLabel('>')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(false)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('to_last summarize')
                                        .setLabel('>>')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(false)
                                );
                        }
                        index -= 1;
                        if (persona.summarize_instruction[index].role === 'placeholder') {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                );
                        } else {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                );
                        }
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                    `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                            .setFooter({
                                text: '總結',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    }
                } else if (commands[0] === 'to_last') {
                    await i.deferUpdate();
                    page = 1;
                    index = 0;
                    if (commands[1] === 'phony_chat') {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first phony_chat')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous phony_chat')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number phony_chat')
                                    .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next phony_chat')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last phony_chat')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                            .setFooter({
                                text: '偽造對話',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    } else {
                        switch_page = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_first summarize')
                                    .setLabel('<<')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_previous summarize')
                                    .setLabel('<')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('display_number summarize')
                                    .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(false)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_next summarize')
                                    .setLabel('>')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('to_last summarize')
                                    .setLabel('>>')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        if (persona.summarize_instruction[index].role === 'placeholder') {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                        .setDisabled(true)
                                );
                        } else {
                            edit_button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create summarize')
                                        .setLabel('新增')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('edit summarize')
                                        .setLabel('編輯')
                                        .setStyle(ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('delete summarize')
                                        .setLabel('刪除')
                                        .setStyle(ButtonStyle.Danger)
                                );
                        }
                        embed = new EmbedBuilder()
                            .setAuthor({
                                name: interaction.member?.displayName ?? interaction.user.displayName,
                                iconURL: interaction.user.displayAvatarURL(),
                            })
                            .setTitle('\u200b')
                            .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                    `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                            .setFooter({
                                text: '總結',
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();
                    }
                } else if (commands[0] === 'create') {
                    if (commands[1] === 'phony_chat') {
                        const modal = new ModalBuilder().setCustomId('ignore create_persona').setTitle('建立');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel('創建位置')
                                .setStringSelectMenuComponent(
                                    new StringSelectMenuBuilder()
                                        .setCustomId('position')
                                        .addOptions([
                                            { label: 'front', value: 'front', description: '在此位置的前方新增' },
                                            { label: 'back', value: 'back', description: '在此位置的後方新增' }
                                        ])
                                )
                        );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore create_persona' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            const position = submit.fields.getStringSelectValues('position')[0];
                            if (position === 'front') {
                                const temp = _.take(persona.phony_chat, index);
                                temp.push({
                                    role: 'user',
                                    name: internal_user.name,
                                    content: ''
                                }, {
                                    role: 'assistant',
                                    content: ''
                                });
                                temp.push(_.takeRight(persona.phony_chat, persona.phony_chat.length - index));
                                persona.phony_chat = temp;
                            } else {
                                const temp = _.take(persona.phony_chat, index + 2);
                                temp.push({
                                    role: 'user',
                                    name: internal_user.name,
                                    content: ''
                                }, {
                                    role: 'assistant',
                                    content: ''
                                });
                                temp.push(_.takeRight(persona.phony_chat, persona.phony_chat.length - index));
                                persona.phony_chat = temp;
                            }
                            if (page == 1) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (page == Math.round(persona.phony_chat.length / 2)) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            }
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                                .setFooter({
                                    text: '偽造對話',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                        } catch {
                            //do nothing
                        }
                    } else {
                        const modal = new ModalBuilder().setCustomId('ignore create_persona').setTitle('建立');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel('創建位置')
                                .setStringSelectMenuComponent(
                                    new StringSelectMenuBuilder()
                                        .setCustomId('position')
                                        .addOptions([
                                            { label: 'front', value: 'front', description: '在此位置的前方新增' },
                                            { label: 'back', value: 'back', description: '在此位置的後方新增' }
                                        ])
                                )
                        )
                            .addLabelComponents(
                                new LabelBuilder()
                                    .setLabel('role')
                                    .setStringSelectMenuComponent(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('role')
                                            .addOptions([
                                                { label: 'user', value: 'user' },
                                                { label: 'assistant', value: 'assistant' }
                                            ])
                                    )
                            );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore create_persona' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            const position = submit.fields.getStringSelectValues('position')[0];
                            if (position === 'front') {
                                const temp = _.take(persona.phony_chat, index);
                                temp.push(submit.fields.getStringSelectValues('role')[0] === 'user' ? {
                                    role: 'user',
                                    name: internal_user.name,
                                    content: ''
                                } : {
                                    role: 'assistant',
                                    content: ''
                                });
                                temp.push(_.takeRight(persona.phony_chat, persona.phony_chat.length - index));
                                persona.phony_chat = temp;
                            } else {
                                const temp = _.take(persona.phony_chat, index + 1);
                                temp.push(submit.fields.getStringSelectValues('role')[0] === 'user' ? {
                                    role: 'user',
                                    name: internal_user.name,
                                    content: ''
                                } : {
                                    role: 'assistant',
                                    content: ''
                                });
                                temp.push(_.takeRight(persona.phony_chat, persona.phony_chat.length - index));
                                persona.phony_chat = temp;
                            }
                            if (page == 1) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (page == persona.summarize_instruction.length) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            }
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                    persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                        `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                                .setFooter({
                                    text: '總結',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                        } catch {
                            //do nothing
                        }
                    }
                    return;
                } else if (commands[0] === 'edit') {
                    if (commands[1] === 'phony_chat') {
                        const modal = new ModalBuilder().setCustomId('ignore edit_persona').setTitle('編輯');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel(persona.phony_chat[index].role)
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId('first')
                                        .setValue(persona.phony_chat[index].content)
                                        .setMaxLength(4000)
                                        .setStyle(TextInputStyle.Paragraph)
                                )
                        );
                        if (persona.phony_chat.at(index + 1)) {
                            modal.addLabelComponents(
                                new LabelBuilder()
                                    .setLabel(persona.phony_chat[index + 1].role)
                                    .setTextInputComponent(
                                        new TextInputBuilder()
                                            .setCustomId('second')
                                            .setValue(persona.phony_chat[index + 1].content)
                                            .setMaxLength(4000)
                                            .setStyle(TextInputStyle.Paragraph)
                                    )
                            );
                        }
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore edit_persona' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            persona.phony_chat[index].content = submit.fields.getTextInputValue('first');
                            if (persona.phony_chat.at(index + 1)) persona.phony_chat[index + 1].content = submit.fields.getTextInputValue('second');
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                                .setFooter({
                                    text: '偽造對話',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                            return;
                        } catch {
                            //do nothing
                        }
                    } else {
                        const modal = new ModalBuilder().setCustomId('ignore edit_persona').setTitle('編輯');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel(persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name)
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId('instruction')
                                        .setValue(persona.summarize_instruction[index].content)
                                        .setMaxLength(4000)
                                        .setStyle(TextInputStyle.Paragraph)
                                )
                        );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore edit_persona' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            persona.summarize_instruction[index].content = submit.fields.getTextInputValue('instruction');
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                    persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                        `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                                .setFooter({
                                    text: '總結',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                            await submit.editReply({
                                embeds: [embed],
                                components: [select_list, switch_page, edit_button]
                            });
                            return;
                        } catch {
                            //do nothing
                        }
                    }
                    return;
                } else if (commands[0] === 'delete') {
                    const modal = new ModalBuilder().setCustomId('ignore confirm').setTitle('刪除');
                    modal.addLabelComponents(
                        new LabelBuilder()
                            .setLabel('確認')
                            .setTextInputComponent(
                                new TextInputBuilder()
                                    .setCustomId('confirm')
                                    .setPlaceholder('輸入\'確認\'以繼續')
                                    .setMaxLength(39)
                                    .setStyle(TextInputStyle.Short)
                            )
                    );
                    await i.showModal(modal);
                    try {
                        const submit = await i.awaitModalSubmit({
                            filter: i => i.customId === 'ignore confirm' && i.user.id === interaction.user.id,
                            time: cooldown_helper.from_second(30)
                        });
                        if (submit.fields.getTextInputValue('confirm') !== '確認') return;
                        if (commands[1] === 'phony_chat') {
                            if (persona.phony_chat.length <= 2) {
                                await submit.reply({
                                    content: '不能再刪了！',
                                    flags: MessageFlags.Ephemeral
                                });
                                return;
                            }
                            await submit.deferUpdate();
                            _.remove(persona.phony_chat, (obj, idx) => {
                                return idx === index || idx === index + 1;
                            });
                            if (page == Math.round(persona.phony_chat.length / 2)) {
                                page = Math.round(persona.phony_chat.length / 2);
                                index = 2 * (page - 1);
                            }
                            if (page == 1) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (page == Math.round(persona.phony_chat.length / 2)) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first phony_chat')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous phony_chat')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number phony_chat')
                                            .setLabel(`${page}/${Math.round(persona.phony_chat.length / 2)}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next phony_chat')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last phony_chat')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            }
                            embed = new EmbedBuilder()
                                .setAuthor({
                                    name: interaction.member?.displayName ?? interaction.user.displayName,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTitle('\u200b')
                                .setDescription(`${persona.phony_chat[index].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index].content.slice(0, 1000)}${persona.phony_chat[index].content.length > 1000 ? '...' : ''}${persona.phony_chat.at(index + 1) ? `\n\`\`\`\n${persona.phony_chat[index + 1].role === 'user' ? 'user' : persona.internal_name}:\n\`\`\`${persona.phony_chat[index + 1].content.slice(0, 1000)}${persona.phony_chat[index + 1].content.length > 1000 ? '...' : persona.phony_chat[index + 1].length > 1000 ? '...' : ''}\`\`\`` : ''}`)
                                .setFooter({
                                    text: '偽造對話',
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setTimestamp();
                        } else {
                            if (persona.summarize_instruction.length <= 1) {
                                await submit.reply({
                                    content: '不能再刪了！',
                                    flags: MessageFlags.Ephemeral
                                });
                                return;
                            } else if (persona.summarize_instruction[index].role === 'placeholder') {
                                await submit.reply({
                                    content: '這個不能刪！',
                                    flags: MessageFlags.Ephemeral
                                });
                                return;
                            }
                            await submit.deferUpdate();
                            _.remove(persona.phony_chat, (obj, idx) => {
                                return idx === index;
                            });
                            if (page == persona.summarize_instruction.length) {
                                page = persona.summarize_instruction.length;
                                index = page - 1;
                            }
                            if (page == 1) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                            } else if (page == persona.summarize_instruction.length) {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(true)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true)
                                    );
                            } else {
                                switch_page = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_first summarize')
                                            .setLabel('<<')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_previous summarize')
                                            .setLabel('<')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('display_number summarize')
                                            .setLabel(`${page}/${persona.summarize_instruction.length}`)
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_next summarize')
                                            .setLabel('>')
                                            .setStyle(ButtonStyle.Primary)
                                            .setDisabled(false)
                                    )
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('to_last summarize')
                                            .setLabel('>>')
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(false)
                                    );
                                embed = new EmbedBuilder()
                                    .setAuthor({
                                        name: interaction.member?.displayName ?? interaction.user.displayName,
                                        iconURL: interaction.user.displayAvatarURL(),
                                    })
                                    .setTitle('\u200b')
                                    .setDescription(`${persona.summarize_instruction[index].role === 'placeholder' ? '對話歷史' :
                                        persona.summarize_instruction[index].role === 'user' ? `user:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\`` :
                                            `${persona.internal_name}:\n\`\`\`${persona.summarize_instruction[index].content.slice(0, 1000)}${persona.summarize_instruction[index].content.length > 1000 ? '...' : ''}\`\`\``}`)
                                    .setFooter({
                                        text: '總結',
                                        iconURL: interaction.user.displayAvatarURL()
                                    })
                                    .setTimestamp();
                            }
                        }

                        await submit.editReply({
                            embeds: [embed],
                            components: [select_list, switch_page, edit_button]
                        });
                        return;
                    } catch {
                        //do nothing
                    }
                }
                await i.editReply({
                    embeds: [embed],
                    components: [select_list, switch_page, edit_button]
                });
            });
        }
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_seeable = client.battle.get_list_user_seeable(interaction.user.id);
        if (/^\d*$/.test(focus)) {
            idx = Number(focus);
            await interaction.respond(user_seeable.filter(p => p.id >= idx).map(p => ({ name: p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_seeable.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: p.persona.display_name, value: p.id })));
        }
    }
}