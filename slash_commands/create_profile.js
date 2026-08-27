const { SlashCommandBuilder, EmbedBuilder, MessageFlags, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('create_profile')
        .setDescription('create a profile for chat'),
    eval: async function (interaction) {
        if (client.battle.user_exist(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle("你已經建立好個人資料了！")
                .setDescription("試著用`/edit_profile`修改資料吧！")
                .setTimestamp();
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const modal = new ModalBuilder().setCustomId('create_profile').setTitle('profile');
        modal.addLabelComponents(
            new LabelBuilder().setLabel('名稱')
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId('internal_name')
                        .setMaxLength(39)
                        .setPlaceholder('這將影響AI如何稱呼你(不填寫則會使用你的username)')
                        .setStyle(TextInputStyle.Short)
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
                            .setRequired(true)
                    )
            );
        await interaction.showModal(modal);
    },
    handle_modal: async function (interaction, slipt_commands) {
        const internal_name = interaction.fields.getTextInputValue('internal_name') ?? interaction.user.username;
        const description = interaction.fields.getTextInputValue('description');
        client.battle.add_user(interaction.user.id, interaction.user.username, internal_name, description);
        await interaction.reply({
            content: '創建完畢！',
            flags: MessageFlags.Ephemeral
        });
    }
}