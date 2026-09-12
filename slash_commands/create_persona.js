const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { persona, type_t } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color.js');

const default_format = "${user} send at ${time:YYYY/MM/DD HH:mm:ss}:\n${message}";
const default_reply_format = "${target_user}:\n${target_message}\n\n${user} reply to ${target_user}, send at ${time:YYYY/MM/DD HH:mm:ss}:\n${message}";
const default_user_format = "<${name}>\n${description}\n</${name}>";

module.exports = {
    command: new SlashCommandBuilder()
        .setName('create_persona')
        .setDescription('create a new persona')
        .addStringOption(option => option.setName('display_name')
            .setDescription('a name for display in list_persona')
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
        const display_name = interaction.options.getString('display_name');
        if (display_name.length > 64) {
            await interaction.reply({
                content: '名字太長了啦！\n改短一點吧！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const modal = new ModalBuilder()
            .setTitle(display_name)
            .setCustomId(`create_persona ${display_name}`);

        modal.addLabelComponents(
            new LabelBuilder()
                .setLabel('實際名稱')
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId('internal_name')
                        .setPlaceholder('實際使用的名稱')
                        .setMaxLength(64)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                )
        )
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel('設定')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('persona')
                            .setPlaceholder('此persona的設定')
                            .setMaxLength(4000)
                            .setRequired(true)
                            .setStyle(TextInputStyle.Paragraph)
                    )
            )
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel('引用設定')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('profile')
                            .setPlaceholder('此persona的profile')
                            .setMaxLength(4000)
                            .setRequired(false)
                            .setStyle(TextInputStyle.Paragraph)
                    )
            )
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel('發送訊息數')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('short_term')
                            .setPlaceholder('應該從對話歷史中抓取多少倫發送？(即短期記憶)')
                            .setMaxLength(10)
                            .setRequired(false)
                            .setValue('10')
                            .setStyle(TextInputStyle.Short)
                    )
            )
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel('總結位置')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('summarize_position')
                            .setPlaceholder('總結時從多遠的地方開始？')
                            .setMaxLength(10)
                            .setRequired(false)
                            .setValue('10')
                            .setStyle(TextInputStyle.Short)
                    )
            );

        await interaction.showModal(modal);
    },
    handle_modal: async function (interaction, split_commands) {
        const internal_name = interaction.fields.getTextInputValue('internal_name');
        const persona = interaction.fields.getTextInputValue('persona');
        const profile = interaction.fields.getTextInputValue('profile') ?? '';
        const short_term = parseInt(interaction.fields.getTextInputValue('short_term') ?? '10');
        const summarize_position = parseInt(interaction.fields.getTextInputValue('summarize_position') ?? '10');
        if (!isNaN(short_term) || isNaN(summarize_position)) {
            await interaction.reply({
                content: `資料不合格！\n出局的都在這下面啦！\n${isNaN(short_term) ? "'- 發送訊息數'並非數字\n" : ''}${isNaN(summarize_position) ? "- '總結位置'並非數字\n" : ''}`.trimEnd(),
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const unused_messages = client.chat.create_persona(
            split_commands[1],
            internal_name,
            type_t.private,
            interaction.user.id,
            persona,
            profile,
            default_format,
            default_reply_format,
            default_user_format,
            [],
            [
                {
                    role: "placeholder",
                    content: "${history}"
                }
            ],
            {
                short_term_max: short_term,
                summarize_start_index: summarize_position,
                raw_short_term: [],
                summarized: []
            }
        );
        await interaction.reply({
            content: `${split_commands[1]}建立好啦！`,
            flags: MessageFlags.Ephemeral
        });
        for (const snowflake of unused_messages) {
            client.chat.remove_context(snowflake);
        }
    }
}