const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ModalBuilder, StringSelectMenuBuilder, APISelectMenuOption } = require('discord.js');
const { colors } = require('../assets/embed_color.js');
const { client } = require('../assets/client.js');
const LLM_interface = require('../implement/LLM/LLM_interface.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("select_model")
        .setDescription("select a avalible model for AI function")
        .addStringOption(option => option.setName('api')
            .setDescription("API for choose")
            .setChoices(
                { name: 'battle', value: 'battle' }
            )
            .setRequired(true)),
    eval: async function (interaction) {
        if (!client.is_owner(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle("無使用權限")
                .setDescription("你沒有使用這個指令的權限！")
                .setColor(colors.error)
                .setFooter({
                    text: '不要偷用！',
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();
                console.log(`[Info]: someone try to call select_model command!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            await interaction.reply({ embeds: [embed] });
            return;
        }
        /**@type {LLM_interface} */
        let API;
        const choice = interaction.options.getString('api');
        if (choice === 'battle') API = client.battle;
        else throw new Error("unknow API");
        const embed = new EmbedBuilder()
            .setTitle("選擇可用模型")
            .setDescription(`當前模型:\n  名稱: ${API.get_current_model().name}\n  流式: ${API.get_current_model().stream}`)
            .setColor(colors.normal)
            .setFooter({
                text: "select_model",
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();
        const string_options = API.get_avalible_models().map((model) => { return { label: model.name, value: model.name, description: `流式: ${model.stream}` }; });
        const action_row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`select_model ${interaction.options.getString('api')}`)
                    .setPlaceholder("可用模型")
                    .setOptions(string_options)
            );
        await interaction.reply({
            embeds: [embed],
            components: [action_row]
        });
    },
    handle_select: async function (interaction, slipt_commands) {
        if (!client.is_owner(interaction.user.id)) {
            await interaction.reply({
                content: "你沒有資格做選擇！",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.deferUpdate();
        const id = slipt_commands[1];
        /**@type {LLM_interface} */
        let API;
        if (slipt_commands[1] === 'battle') API = client.battle;
        else throw new Error("unknow API");
        const select = interaction.values[0];
        const current_info = API.get_avalible_models().find((value) => value.name === select);
        API.select_default_model(select);
        console.log(`[info]: current model:${API.get_current_model().name}`);
        const embed = new EmbedBuilder()
            .setTitle("選擇可用模型")
            .setDescription(`當前模型:\n  名稱: ${current_info.name}\n  流式: ${current_info.stream}`)
            .setColor(colors.normal)
            .setFooter({
                text: "select_model",
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();
        const string_options = API.get_avalible_models().map((model) => { return { label: model.name, value: model.name, description: `流式: ${model.stream}` }; });
        const action_row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`select_model ${slipt_commands[1]}`)
                    .setPlaceholder("可用模型")
                    .setOptions(string_options)
            );
        await interaction.editReply({
            embeds: [embed],
            components: [action_row]
        });
    }
}