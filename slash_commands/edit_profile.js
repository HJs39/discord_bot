const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('edit_profile')
        .setDescription('edit your chat profile'),
    eval: async function (interaction) {
        if (!client.battle.user_exist(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle("你還沒有個人資料！")
                .setDescription("試著用`/create_profile`建立一個吧！")
                .setTimestamp();
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const user = client.battle.get_user(interaction.user.id);
        const modal = new ModalBuilder().setCustomId('edit_profile').setTitle('profile');
        modal.addLabelComponents(
            new LabelBuilder().setLabel('名稱')
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId('internal_name')
                        .setMaxLength(39)
                        .setPlaceholder('這將影響AI如何稱呼你(留空視同不做更改)')
                        .setStyle(TextInputStyle.Short)
                        .setValue(user.internal_name)
                )
        )
            .addLabelComponents(
                new LabelBuilder().setLabel('描述')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('description')
                            .setMaxLength(4000)
                            .setPlaceholder('這將影響AI如何理解你')
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(user.description)
                            .setRequired(true)
                    )
            );
        await interaction.showModal(modal);
    },
    handle_modal: async function (interaction, split_commands) {
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const user = client.battle.get_user(interaction.user.id);
        const internal_name = interaction.fields.getTextInputValue('internal_name') ?? user.internal_name;
        const description = interaction.fields.getTextInputValue('description');
        user.internal_name = internal_name;
        user.description = description;
        await interaction.reply({
            content: '改好啦！',
            flags: MessageFlags.Ephemeral
        });
    }
}