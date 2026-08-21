const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const placeholder_replacer = require('../implement/placeholder_replacer');
const response_receiver = require('../implement/LLM/response_reciver.js');
const timer = require('../implement/timer');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');
const { battle_command_available } = require('./battle_white_list.js');
const { persona } = require('../implement/LLM/persona.js');

const stats_regex = /<record>\s*(?<content>[\s\S]*?)\s*<\/?record>[\s\S]*?<stats_a>[\s\S]*?<name>\s*(?<char_a_name>[\s\S]*?)\s*<\/?name>[\s\S]*?<comment>\s*(?<char_a_comment>[\s\S]*?)\s*<\/?comment>[\s\S]*?<\/?stats_a>[\s\S]*?<stats_b>[\s\S]*?<name>\s*(?<char_b_name>[\s\S]*?)\s*<\/?name>[\s\S]*?<comment>\s*(?<char_b_comment>[\s\S]*?)\s*<\/?comment>[\s\S]*?<\/?stats_b>[\s\S]*?<winner>[\s\S]*?(?<winner>A|a|B|b)[\s\S]*?<\/?winner>/g;

const role_name = '混亂聯盟比賽答疑組（悲）';

module.exports = {
    command: new SlashCommandBuilder()
        .setName('battle')
        .setDescription('experimental AI battle function'),
    eval: async function (interaction) {
        if (!(interaction.member.roles.cache.some((role) => role.name === role_name)) && !client.is_owner(interaction.user.id) && !battle_command_available.includes(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Battle",
                })
                .setTitle("無指定身份組")
                .setDescription("妳沒有使用這個指令的權限！")
                .setColor(colors.error)
                .setFooter({
                    text: "原型取自米米警察",
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const modal = new ModalBuilder().setCustomId('battle information').setTitle('Battle');

        modal
            .addLabelComponents(
                new LabelBuilder().setLabel('角色1名稱')
                    .setTextInputComponent(
                        new TextInputBuilder().setCustomId('char_a')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(39)
                            .setPlaceholder('角色1的名稱')
                    )
            ).addLabelComponents(
                new LabelBuilder().setLabel('角色1特性')
                    .setTextInputComponent(
                        new TextInputBuilder().setCustomId('char_a_description')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(1000)
                            .setPlaceholder('角色1的特性')
                    )
            ).addLabelComponents(
                new LabelBuilder().setLabel('角色2名稱')
                    .setTextInputComponent(
                        new TextInputBuilder().setCustomId('char_b')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(39)
                            .setPlaceholder('角色2的名稱')
                    )
            ).addLabelComponents(
                new LabelBuilder().setLabel('角色2特性')
                    .setTextInputComponent(
                        new TextInputBuilder().setCustomId('char_b_description')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(1000)
                            .setPlaceholder('角色2的特性')
                    )
            );
        await interaction.showModal(modal);
    },
    handle_modal: async function (interaction) {
        const embed_waiting = new EmbedBuilder()
            .setAuthor({
                name: "Battle",
            })
            .setTitle("當前狀態")
            .setDescription("正在排隊中...")
            .setColor(colors.normal)
            .setFooter({
                text: "原型取自米米警察",
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed_waiting] });
        const replacer = new placeholder_replacer([
            ['char_a_name', interaction.fields.getTextInputValue('char_a')],
            ['char_a_description', interaction.fields.getTextInputValue('char_a_description')],
            ['char_b_name', interaction.fields.getTextInputValue('char_b')],
            ['char_b_description', interaction.fields.getTextInputValue('char_b_description')]
        ]);
        /**@type {persona} */
        const Eteris = client.LLM.get_persona(1);
        /**@type {Array<chat_interaction>} */
        const inject_history = new Array();
        for (const chat of Eteris.phony_chat) {
            inject_history.push({
                role: chat.role,
                content: replacer.replace(chat.content),
                name: chat.name
            });
        }
        const format_instruction = inject_history.pop();
        /**@type {response_receiver} */
        let receiver = client.LLM.chat_oneshot_customize_by_default(
            Eteris.persona,
            inject_history,
            format_instruction
        );
        console.log('[info]: construct complete');
        await timer.wait_until(() => receiver.is_generating());
        const embed_generating = new EmbedBuilder()
            .setAuthor({
                name: "Battle",
            })
            .setTitle("當前狀態")
            .setDescription("正在等待中...")
            .setColor(colors.normal)
            .setFooter({
                text: "原型取自米米警察",
                iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed_generating] });
        console.log('[info]: wait for generate');
        /**@type {import('../implement/LLM/API_interactor.js').API_result} */
        var result = await receiver.get_result();
        console.log(`[info]: result:\n${result.content}\n  failed: ${result.failed}`);
        if (result.failed) {
            const embed_failed = new EmbedBuilder()
                .setAuthor({
                    name: "Battle",
                })
                .setTitle("當前狀態")
                .setDescription("對決生成失敗")
                .setColor(colors.error)
                .setFooter({
                    text: "原型取自米米警察",
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed_failed] });
            return;
        } else {
            try {
                const formatted_content = stats_regex.exec(result.content).groups;
                stats_regex.lastIndex = 0;
                const embed_success = new EmbedBuilder()
                    .setAuthor({
                        name: "Battle",
                    })
                    .setTitle(`${formatted_content.char_a_name} VS ${formatted_content.char_b_name}`)
                    .setDescription(formatted_content.content)
                    .addFields(
                        {
                            name: `${formatted_content.char_a_name} ${(formatted_content.winner === 'A' || formatted_content.winner === 'a') ? '🏆' : ''}`,
                            value: `\n\`\`\`\n${formatted_content.char_a_comment}\n\`\`\``,
                            inline: false
                        },
                    )
                    .addFields(
                        {
                            name: `${formatted_content.char_b_name} ${(formatted_content.winner === 'B' || formatted_content.winner === 'b') ? '🏆' : ''}`,
                            value: `\n\`\`\`\n${formatted_content.char_b_comment}\n\`\`\``,
                            inline: false
                        },
                    )
                    .setColor(colors.battle_success)
                    .setFooter({
                        text: "原型取自米米警察",
                        iconURL: client.user.displayAvatarURL(),
                    })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed_success] });
                return;
            } catch (error) {
                console.log(error);
                const embed_failed = new EmbedBuilder()
                    .setAuthor({
                        name: "Battle",
                    })
                    .setTitle("當前狀態")
                    .setDescription("對決生成失敗")
                    .setColor(colors.error)
                    .setFooter({
                        text: "原型取自米米警察",
                        iconURL: client.user.displayAvatarURL(),
                    })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed_failed] });
                return;
            }
        }
    }
}