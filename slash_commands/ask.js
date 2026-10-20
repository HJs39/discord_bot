const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const JEV = require('../implement/LLM/jev');
const { colors } = require('../assets/embed_color.js');
const _ = require('lodash');

const answer_type = [
    ['不是', '是'],
    ['假的', '真的'],
    ['別做', '做吧'],
    ['不行', '可以'],
    ['不同意', '同意'],
    ['不會', '會']
];

module.exports = {
    command: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('ask Alice a question, she will answer you by "answer_type"')
        .addStringOption(option => option.setName("context_name")
            .setDescription("the name of context")
            .setRequired(true))
        .addStringOption(option => option.setName("context")
            .setDescription("the context(more detail will get more accuracy answer)")
            .setRequired(true))
        .addStringOption(option => option.setName("question_name")
            .setDescription("the name of your question")
            .setRequired(true))
        .addStringOption(option => option.setName("question")
            .setDescription("your question(more detail will get more accuracy answer)")
            .setRequired(true))
        .addStringOption(option => option.setName('answer_type')
            .setDescription('choose which answer type you want(default is "yes or no")')
            .setChoices([
                { name: 'yes or no', value: 'yes or no' },
                { name: 'true or false', value: 'true or false' },
                { name: 'do or not', value: 'do or don\'t' },
                { name: 'can or not', value: 'can or can\'t' },
                { name: 'agree or disagree', value: 'agree or disagree' },
                { name: 'will or won\'t', value: 'will or won\'t' }
            ])),
    eval: async function (interaction) {
        await interaction.deferReply();
        const context_name = interaction.options.getString('context_name');
        const context = interaction.options.getString('context');
        const question_name = interaction.options.getString('question_name');
        const question = interaction.options.getString('question');
        const choose_type = interaction.options.getString('answer_type') ?? 'yes or no';
        let type;
        if (choose_type === 'yes or no') type = answer_type[0];
        else if (choose_type === 'true or false') type = answer_type[1];
        else if (choose_type === 'do or don\'t') type = answer_type[2];
        else if (choose_type === 'can or can\'t') type = answer_type[3];
        else if (choose_type === 'agree or disagree') type = answer_type[4];
        else type = answer_type[5];
        const answer = await JEV.send_request({
            [context_name]: context
        }, {
            [question_name]: {
                "type": "noul",
                "instructions": question
            }
        });
        if (answer === undefined) {
            const component_v2 = new ContainerBuilder()
                .setAccentColor(colors.error)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`response error: try again later`)
                );
            await interaction.editReply({
                components: [component_v2],
                flags: MessageFlags.IsComponentsV2
            });
            return;
        }
        const component_v2 = new ContainerBuilder()
            .setAccentColor(colors.normal)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${question_name}`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(question)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Large)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 愛麗絲認為:`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${type[answer.noul.get(question_name).result > 0.5 ? 1 : 0]}(愛麗絲對這個答案有${answer.noul.get(question_name).result > 0.5 ? Math.round(answer.noul.get(question_name).result * 10000) / 100 : Math.round((Math.abs(answer.noul.get(question_name).result - 1)) * 10000) / 100}%的信心)`)
            );
        await interaction.editReply({
            components: [component_v2],
            flags: MessageFlags.IsComponentsV2
        });
    }
}