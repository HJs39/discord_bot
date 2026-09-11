const { SlashCommandBuilder, EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const context = require('../implement/LLM/context.js');
const { type_t, persona } = require('../implement/LLM/persona.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require("../assets/embed_color.js");

module.exports = {
    command: new SlashCommandBuilder()
        .setName('select_persona')
        .setDescription('select a persona to use in default')
        .addIntegerOption(option => option.setName('persona')
            .setDescription('the persona to use')
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
        if (!client.chat.user_exist(interaction.user.id)) {
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
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const user = client.chat.get_user(interaction.user.id);
        const persona_id = interaction.options.getInteger('persona');
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_seeable = client.battle.get_list_user_seeable(interaction.user.id);
        /**@type {persona} */
        const persona = user_seeable.find((fp) => fp.id === persona_id);
        if (!persona) {
            await interaction.editReply({
                content: '你無法使用這個！',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        user.current_use = persona_id;
        await interaction.editReply({
            content: `現在${persona.persona.display_name}是你的聊天對象啦！`,
            flags: MessageFlags.Ephemeral
        });
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const user_seeable = client.chat.get_list_user_seeable(interaction.user.id);
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const user = client.chat.get_user(interaction.user.id);
        const idx = parseInt(focus);
        if (isNaN(idx)) {
            await interaction.respond(user_seeable.filter(p => p.persona.display_name.startsWith(focus)).map(p => ({ name: user?.current_use === p.id ? p.persona.display_name + '(using)' : p.persona.display_name, value: p.id })));
        } else {
            await interaction.respond(user_seeable.filter(p => p.id >= idx).map(p => ({ name: user?.current_use === p.id ? p.persona.display_name + '(using)' : p.persona.display_name, value: p.id })));
        }
    }
}