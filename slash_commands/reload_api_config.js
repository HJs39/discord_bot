const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ModalBuilder, StringSelectMenuBuilder, APISelectMenuOption } = require('discord.js');
const LLM_interface = require('../implement/LLM/LLM_interface.js');
const path = require('path');
const { colors } = require('../assets/embed_color.js');
const { client } = require('../assets/client.js');
const { assets_path } = require('../assets/assets_path');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("reload_api_config")
        .setDescription("dynamic reload api setting")
        .addStringOption(option => option.setName('api')
            .setDescription("API for choose")
            .setChoices(
                { name: 'battle', value: 'battle' },
                { name: 'chat', value: 'chat' }
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
            console.log(`[Info]: someone try to call reload_api_config command!\n  user id: ${interaction.user.id}\n  user name: ${interaction.user.globalName || interaction.user.userName}`);
            await interaction.reply({ embeds: [embed] });
            return;
        }
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        /**@type {LLM_interface} */
        let API;
        let config_path;
        const choice = interaction.options.getString('api');
        if (choice === 'battle') {
            API = client.battle;
            config_path = path.join(assets_path, 'private-battle_API_config.json');
        }
        else if (choice === 'chat') {
            API = client.chat;
            config_path = path.join(assets_path, 'private-chat_API_config.json');
        }
        else throw new Error("unknow API");
        delete require.cache[config_path];
        API.reload_api(require(config_path));
        await interaction.editReply({
            content: `${choice}的API配置已經重新加載啦！`
        });
    }
}