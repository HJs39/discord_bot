const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown.js');
const { client } = require('../assets/client.js');
const { cats } = require('../assets/cats.js');
const { colors } = require('../assets/embed_color.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('get a random cat image from database'),
    eval: async function (interaction) {
        if (!cooldown_helper.check('cat', interaction.user.id, Date.now(), cooldown_helper.from_second(20))) {
            const embed = new EmbedBuilder()
                .setTitle("冷卻中...")
                .setDescription("用的太急拉！\n稍微冷靜一下吧~")
                .setColor(colors.error)
                .setFooter({
                    text: `等下在來！`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply();
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const attachment = new AttachmentBuilder(cat.image);
        const embed = new EmbedBuilder()
            .setImage(`attachment://${cat.file_name}`)
            .setColor("#b3e9ff")
            .setFooter({
                text: `由${cat.provider}提供`,
                iconURL: client.user.avatarURL(),
            })
            .setTimestamp();
        cooldown_helper.set('cat', interaction.user.id, Date.now());
        await interaction.editReply({ embeds: [embed], files: [attachment] });
    }
}