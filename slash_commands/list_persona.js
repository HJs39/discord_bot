const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const bot_assets = require('../assets/bot_assets.json');
const { client } = require('../assets/client.js');
const { colors } = require('../assets/embed_color');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('list_persona')
        .setDescription('list existed personas')
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the list would be ephemeral or not(defualt is false)')),
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
        /**@type {import('../implement/LLM/persona_manager.js').filtered_persona_t[]} */
        const personas = client.battle.get_list_user_seeable(interaction.user.id);
        /**@type {import('../implement/LLM/user_repository.js').user} */
        const user = client.chat.get_user(interaction.user.id);
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        let output = '```';
        personas.forEach((persona) => {
            output += `[${persona.id}|${persona.persona.type}${user?.current_use === persona.id ? "|using" : ''}${persona.persona.deprecated ? '|DEPRECATED' : ''}]: ${persona.persona.display_name}\n`;
        });
        await interaction.editReply(output.trimEnd() + '```');
    }
}