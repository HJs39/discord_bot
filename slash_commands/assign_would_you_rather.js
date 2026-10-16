const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputStyle, LabelBuilder, TextInputBuilder } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown.js');
const { colors } = require('../assets/embed_color.js');
const questions = require('../assets/would_you_rather.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("assign_would_you_rather")
        .setDescription("add new would you rather question"),
    eval: async function (interaction) {
        const modal = new ModalBuilder().setCustomId("ignore would you rather").setTitle("新增問題");

        modal.addLabelComponents(
            new LabelBuilder().setLabel('選項1')
                .setTextInputComponent(
                    new TextInputBuilder().setCustomId('select1')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(300)
                        .setPlaceholder('選項1的內文')
                )
        )
            .addLabelComponents(
                new LabelBuilder().setLabel('選項2')
                    .setTextInputComponent(
                        new TextInputBuilder().setCustomId('select2')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(300)
                            .setPlaceholder('選項2的內文')
                    )
            );
        await interaction.showModal(modal);
        try {
            const submit = await interaction.awaitModalSubmit({
                filter: i => i.customId === 'ignore would you rather' && i.user.id === interaction.user.id,
                time: cooldown_helper.from_second(30)
            });
            await submit.deferReply({ flags: [MessageFlags.Ephemeral] });
            questions.push({
                select1: submit.fields.getTextInputValue('select1'),
                select2: submit.fields.getTextInputValue('select2')
            });
            await submit.editReply({
                content: "你現在可能在小遊戲內遇到這個問題啦！",
                flags: MessageFlags.Ephemeral
            });
        } catch {
            // do nothing
        }
    }
}