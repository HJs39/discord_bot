const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, SlashCommandBuilder, EmbedBuilder, MessageFlags, SectionBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown.js');
const { colors } = require('../assets/embed_color.js');
const questions = require('../assets/would_you_rather.js');
const _ = require('lodash');


function build_select_screen(round, total, select1, select2, selected, unselected) {
    return new ContainerBuilder()
        .setAccentColor(colors.normal)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# Would you rather?\n-# ${round}/${total}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(select1)
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId("select1")
                        .setLabel('選擇')
                        .setStyle(ButtonStyle.Primary)
                )
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(select2)
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId("select2")
                        .setLabel('選擇')
                        .setStyle(ButtonStyle.Primary)
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ➤ ${selected}人已做出選擇\n-# ➤ 剩餘${unselected}人`)
        );
}

function init_game_questions(num) {
    const result = [];
    const cache = [...questions];
    const get_num = Math.min(num, cache.length);
    for (let i = 0; i < get_num; ++i) {
        const idx = Math.floor(Math.random() * cache.length);
        result.push(cache[idx]);
        cache.splice(idx, 1);
    }
    return {
        q: result,
        num: get_num
    };
}

function build_ending_screen(expect, total) {
    return new ContainerBuilder()
        .setAccentColor(colors.normal)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# 遊戲結束！\n\n預定輪數: ${expect}\n實際輪數: ${total}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId("show_conclusion").setLabel("查看紀錄").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("retry_now").setLabel("再來一局").setStyle(ButtonStyle.Danger)
                )
        );
}

module.exports = {
    command: new SlashCommandBuilder()
        .setName("would_you_rather")
        .setDescription("set up a would you rather mini game"),
    eval: async function (interaction) {
        /**@type {number} */
        let question_count = 1;
        /**@type {number} */
        let cur_count = 0;
        const update_wellcome_screen = (body) => new ContainerBuilder()
            .setAccentColor(colors.normal)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# Would you rather?`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(body)
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId("join")
                            .setLabel('參與/退出')
                            .setStyle(ButtonStyle.Primary)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId("start").setLabel('開始遊戲').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('edit_count').setLabel("修改輪數").setStyle(ButtonStyle.Secondary)
                    )
            );
        const wellcome_screen = update_wellcome_screen(`當前尚未有玩家參與\n可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定進行${question_count}輪`);
        const response = await interaction.reply({
            components: [wellcome_screen],
            withResponse: true,
            flags: MessageFlags.IsComponentsV2
        });
        const wellcome = response.resource?.message;
        if (wellcome) {
            /**@type {string[]} */
            let joined_user = Array();
            /**@type {Array<Map<string,number>>} */
            let history = [];
            let would_you_rather_cache;
            let started = false;
            let collector = wellcome.createMessageComponentCollector({
                idle: cooldown_helper.from_second(600)
            });
            const collector_callback = async i => {
                try {
                    if (i.customId === 'join') {
                        await i.deferUpdate();
                        if (started) {
                            let mes = new TextDisplayBuilder().setContent("本次遊戲已經開始！\n請等待下一輪再加入！");
                            await i.reply({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        }
                        if (!joined_user.includes(i.user.id)) joined_user.push(i.user.id);
                        else _.remove(joined_user, (value) => value === i.user.id);
                        let users = '';
                        if (joined_user.length === 0) users = `當前尚未有玩家參與\n可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定進行${question_count}輪`;
                        else {
                            users = '當前參與玩家:\n';
                            joined_user.forEach(v => {
                                users += `- <@${v}>\n`
                            });
                            users += `可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定進行${question_count}輪`;
                        }
                        await i.editReply({
                            components: [update_wellcome_screen(users)],
                            flags: MessageFlags.IsComponentsV2
                        });
                    } else if (i.customId === 'edit_count') {
                        if (i.user.id !== interaction.user.id) {
                            let mes = new TextDisplayBuilder().setContent("你不是這場遊戲的發起者！");
                            await i.reply({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        }
                        const modal = new ModalBuilder().setCustomId('ignore edit_count').setTitle('設定輪數');
                        modal.addLabelComponents(
                            new LabelBuilder()
                                .setLabel('輪數')
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId('count')
                                        .setPlaceholder(`${question_count}`)
                                        .setRequired(true)
                                        .setStyle(TextInputStyle.Short)
                                )
                        );
                        await i.showModal(modal);
                        try {
                            const submit = await i.awaitModalSubmit({
                                filter: i => i.customId === 'ignore edit_count' && i.user.id === interaction.user.id,
                                time: cooldown_helper.from_second(30)
                            });
                            await submit.deferUpdate();
                            const p = parseInt(submit.fields.getTextInputValue('count'));
                            if (p <= 0) question_count = 1;
                            else question_count = p;
                            let users = '';
                            if (joined_user.length === 0) users = `當前尚未有玩家參與\n可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定進行${question_count}輪`;
                            else {
                                users = '當前參與玩家:\n';
                                joined_user.forEach(v => {
                                    users += `- <@${v}>\n`
                                });
                                users += `可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定進行${question_count}輪`;
                            }
                            await submit.editReply({
                                components: [update_wellcome_screen(users)],
                                flags: MessageFlags.IsComponentsV2
                            });
                        } catch {
                            // do nothing
                        }
                    } else if (i.customId === 'start') {
                        if (i.user.id !== interaction.user.id) {
                            let mes = new TextDisplayBuilder().setContent("你不是這場遊戲的發起者！");
                            await i.reply({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        } else if (joined_user.length === 0) {
                            let mes = new TextDisplayBuilder().setContent("本次遊戲沒有參與者！");
                            await i.reply({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        }
                        started = true;
                        would_you_rather_cache = init_game_questions(question_count);
                        await i.update({
                            components: [build_select_screen(cur_count, would_you_rather_cache.num, would_you_rather_cache.q[cur_count].select1, would_you_rather_cache.q[cur_count].select2, 0, joined_user.length)],
                            flags: MessageFlags.IsComponentsV2
                        });
                        history.push(new Map());
                        let players = '';
                        joined_user.forEach(v => {
                            players += `<@${v}>`;
                        });
                        players += '\n遊戲開始啦！';
                        let mes = new TextDisplayBuilder().setContent(players);
                        await i.reply({
                            components: [mes],
                            flags: MessageFlags.IsComponentsV2
                        });
                        return;
                    } else if (i.customId === 'select1') {
                        await i.deferUpdate();
                        if (history[cur_count].has(i.user.id)) {
                            let mes = new TextDisplayBuilder().setContent("你已經做出了選擇！\n請等待下一輪選擇開始！");
                            await i.followUp({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        } else if (!joined_user.includes(i.user.id)) {
                            let mes = new TextDisplayBuilder().setContent("你沒有參與這場would you rather！");
                            await i.followUp({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        }
                        history[cur_count].set(i.user.id, 1);
                        if (history[cur_count].size === joined_user.length) {
                            cur_count += 1;
                            if (cur_count !== would_you_rather_cache.num) {
                                history.push(new Map());
                            }
                        }
                        if (cur_count !== would_you_rather_cache.num) {
                            await i.editReply({
                                components: [build_select_screen(cur_count, would_you_rather_cache.num, would_you_rather_cache.q[cur_count].select1, would_you_rather_cache.q[cur_count].select2, history[cur_count].size, joined_user.length - history[cur_count].size)],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        } else {
                            await i.editReply({
                                components: [build_ending_screen(question_count, would_you_rather_cache.num)],
                                flags: MessageFlags.IsComponentsV2
                            });
                            return;
                        }
                    } else if (i.customId === 'select2') {
                        await i.deferUpdate();
                        if (history[cur_count].has(i.user.id)) {
                            let mes = new TextDisplayBuilder().setContent("你已經做出了選擇！\n請等待下一輪選擇開始！");
                            await i.followUp({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        } else if (!joined_user.includes(i.user.id)) {
                            let mes = new TextDisplayBuilder().setContent("你沒有參與這場would you rather！");
                            await i.followUp({
                                components: [mes],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        }
                        history[cur_count].set(i.user.id, 2);
                        if (history[cur_count].size === joined_user.length) {
                            cur_count += 1;
                            if (cur_count !== would_you_rather_cache.num) {
                                history.push(new Map());
                            }
                        }
                        if (cur_count !== would_you_rather_cache.num) {
                            await i.editReply({
                                components: [build_select_screen(cur_count, would_you_rather_cache.num, would_you_rather_cache.q[cur_count].select1, would_you_rather_cache.q[cur_count].select2, history[cur_count].size, joined_user.length - history[cur_count].size)],
                                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
                            });
                            return;
                        } else {
                            await i.editReply({
                                components: [build_ending_screen(question_count, would_you_rather_cache.num)],
                                flags: MessageFlags.IsComponentsV2
                            });
                            return;
                        }
                    } else if (i.customId === 'show_conclusion') {
                        await i.deferUpdate();
                        let conclusion = '';
                        history.forEach((v, idx) => {
                            let select1 = '';
                            let select2 = '';
                            let idx_map_question = would_you_rather_cache.q[idx];
                            v.forEach((value, key) => {
                                if (value === 1) {
                                    select1 += `<@${key}>`;
                                } else {
                                    select2 += `<@${key}>`;
                                }
                            });
                            if (select1.length === 0) select1 = '無人';
                            if (select2.length === 0) select2 = '無人';
                            if ((conclusion.length + select1.length + select2.length + idx_map_question.select1.length + idx_map_question.select2.length) >= 1800) {
                                i.followUp({
                                    components: [new TextDisplayBuilder().setContent(conclusion.trimEnd())],
                                    flags: MessageFlags.IsComponentsV2
                                });
                                conclusion = `## 在第${idx + 1}輪中\n\n${select1}寧可「${idx_map_question.select1}」\n${select2}寧可「${idx_map_question.select2}」\n\n`;
                            }
                            conclusion += `## 在第${idx + 1}輪中\n\n${select1}寧可「${idx_map_question.select1}」\n${select2}寧可「${idx_map_question.select2}」\n\n`;
                        });
                        await i.followUp({
                            components: [new TextDisplayBuilder().setContent(conclusion.trimEnd())],
                            flags: MessageFlags.IsComponentsV2
                        });
                        return;
                    } else if (i.customId === 'retry_now') {
                        joined_user = Array();
                        history = [];
                        started = false;
                        cur_count = 0;
                        const temp_response = await i.followUp({
                            components: [update_wellcome_screen(`當前尚未有玩家參與\n可點擊右側按鈕加入/退出\n\n-# 本次遊戲預定輪數${question_count}`)],
                            withResponse: true,
                            flags: MessageFlags.IsComponentsV2
                        });
                        if (temp_response.resource?.message) {
                            collector.stop("start_new_game");
                            collector = temp_response.resource.message.createMessageComponentCollector({
                                idle: cooldown_helper.from_second(600)
                            });
                            collector.on('collect', collector_callback);
                        }
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    //do nothing
                }
            }
            collector.on('collect', collector_callback);
        }
    }
}